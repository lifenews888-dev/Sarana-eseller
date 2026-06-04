import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { filterPublicLaunchProducts, publicProductWhere } from '@/lib/product-visibility';
import { sanitizeImageUrls } from '@/lib/image-url';
import {
  STORE_DIRECTORY_TYPES,
  type StoreDirectoryFacet,
  type StoreDirectoryFacets,
  type StoreDirectoryItem,
  type StoreDirectorySort,
  type StoreDirectoryType,
  isStoreDirectorySort,
  isStoreDirectoryType,
  normalizeFacetValue,
} from '@/lib/shop-directory';

const DIRECTORY_FETCH_LIMIT = 300;

const BLOCKED_PUBLIC_ENTITY_TEXT = [
  'test',
  'demo',
  'dummy',
  'placeholder',
  'sample',
  'asdf',
  'qwer',
  'тест',
];

const MIN_PUBLIC_DIRECTORY_NAME_LENGTH = 2;

const EMPTY_FACETS: StoreDirectoryFacets = {
  types: {
    all: 0,
    store: 0,
    service: 0,
    agent: 0,
    company: 0,
    auto_dealer: 0,
  },
  districts: [],
  categories: [],
};

type ShopWithRelations = Prisma.ShopGetPayload<{
  include: {
    shopType: true;
    services: { select: { id: true } };
    _count: { select: { services: true } };
  };
}>;

type AgentWithCount = Prisma.AgentGetPayload<{
  include: { _count: { select: { listings: true } } };
}>;

type CompanyWithCount = Prisma.CompanyGetPayload<{
  include: { _count: { select: { projects: true } } };
}>;

type AutoDealerWithCount = Prisma.AutoDealerGetPayload<{
  include: { _count: { select: { vehicles: true } } };
}>;

type ServiceProviderWithCount = Prisma.ServiceProviderGetPayload<{
  include: { _count: { select: { listings: true } } };
}>;

type ShopDirectoryAssets = {
  productCount: number;
  coverImage: string | null;
};

function blockedShopWhere(): Prisma.ShopWhereInput[] {
  return [
    { slug: { startsWith: 'test-' } },
    { slug: { startsWith: 'demo-' } },
    ...BLOCKED_PUBLIC_ENTITY_TEXT.flatMap((pattern) => [
      { name: { contains: pattern, mode: 'insensitive' as const } },
      { slug: { contains: pattern, mode: 'insensitive' as const } },
      { address: { contains: pattern, mode: 'insensitive' as const } },
      { industry: { contains: pattern, mode: 'insensitive' as const } },
    ]),
  ];
}

function blockedAgentWhere(): Prisma.AgentWhereInput[] {
  return [
    { slug: { startsWith: 'test-' } },
    { slug: { startsWith: 'demo-' } },
    ...BLOCKED_PUBLIC_ENTITY_TEXT.flatMap((pattern) => [
      { name: { contains: pattern, mode: 'insensitive' as const } },
      { slug: { contains: pattern, mode: 'insensitive' as const } },
      { bio: { contains: pattern, mode: 'insensitive' as const } },
      { address: { contains: pattern, mode: 'insensitive' as const } },
    ]),
  ];
}

function blockedCompanyWhere(): Prisma.CompanyWhereInput[] {
  return [
    { slug: { startsWith: 'test-' } },
    { slug: { startsWith: 'demo-' } },
    ...BLOCKED_PUBLIC_ENTITY_TEXT.flatMap((pattern) => [
      { name: { contains: pattern, mode: 'insensitive' as const } },
      { slug: { contains: pattern, mode: 'insensitive' as const } },
      { description: { contains: pattern, mode: 'insensitive' as const } },
      { address: { contains: pattern, mode: 'insensitive' as const } },
    ]),
  ];
}

function blockedAutoDealerWhere(): Prisma.AutoDealerWhereInput[] {
  return [
    { slug: { startsWith: 'test-' } },
    { slug: { startsWith: 'demo-' } },
    ...BLOCKED_PUBLIC_ENTITY_TEXT.flatMap((pattern) => [
      { name: { contains: pattern, mode: 'insensitive' as const } },
      { slug: { contains: pattern, mode: 'insensitive' as const } },
      { description: { contains: pattern, mode: 'insensitive' as const } },
      { address: { contains: pattern, mode: 'insensitive' as const } },
    ]),
  ];
}

function blockedServiceProviderWhere(): Prisma.ServiceProviderWhereInput[] {
  return [
    { slug: { startsWith: 'test-' } },
    { slug: { startsWith: 'demo-' } },
    ...BLOCKED_PUBLIC_ENTITY_TEXT.flatMap((pattern) => [
      { name: { contains: pattern, mode: 'insensitive' as const } },
      { slug: { contains: pattern, mode: 'insensitive' as const } },
      { description: { contains: pattern, mode: 'insensitive' as const } },
      { address: { contains: pattern, mode: 'insensitive' as const } },
    ]),
  ];
}

function normalizeShopType(type?: string | null): 'store' | 'service' {
  return type === 'service' ? 'service' : 'store';
}

function displayText(...values: Array<string | string[] | null | undefined>) {
  return values
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
}

function compactPublicText(value?: string | null) {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function hasBlockedPublicEntityText(value?: string | null) {
  const searchable = (value || '').trim().toLowerCase();
  return BLOCKED_PUBLIC_ENTITY_TEXT.some((pattern) => searchable.includes(pattern));
}

function hasLowDiversityName(value?: string | null) {
  const compact = compactPublicText(value);
  const chars = [...compact];
  if (chars.length < 8) return false;
  const uniqueChars = new Set(chars);
  return uniqueChars.size <= 3 || uniqueChars.size / chars.length <= 0.28;
}

function hasPublicDirectoryQuality(item: StoreDirectoryItem) {
  const compactName = compactPublicText(item.name);
  if (compactName.length < MIN_PUBLIC_DIRECTORY_NAME_LENGTH) return false;
  if (hasBlockedPublicEntityText(item.name) || hasBlockedPublicEntityText(item.slug)) return false;
  if (hasLowDiversityName(item.name)) return false;
  return true;
}

function matchesSearch(item: StoreDirectoryItem, search: string) {
  if (!search) return true;
  const query = search.toLowerCase();
  return [
    item.name,
    item.slug,
    item.description,
    item.category,
    item.address,
    item.district,
    ...item.keywords,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(query);
}

function matchesCategory(item: StoreDirectoryItem, category: string) {
  if (!category) return true;
  const normalized = normalizeFacetValue(category);
  return item.keywords.some((keyword) => normalizeFacetValue(keyword) === normalized)
    || normalizeFacetValue(item.category) === normalized;
}

function activityScore(item: StoreDirectoryItem) {
  const ratingScore = (item.rating || 0) * 20;
  const reviewScore = (item.reviewCount || 0) * 2;
  const inventoryScore = item.productCount + item.serviceCount + item.listingCount;
  const verifiedScore = item.isVerified ? 50 : 0;
  return verifiedScore + ratingScore + reviewScore + inventoryScore;
}

function sortDirectoryItems(items: StoreDirectoryItem[], sort: StoreDirectorySort) {
  return [...items].sort((a, b) => {
    if (sort === 'rating') {
      return (b.rating || 0) - (a.rating || 0)
        || (b.reviewCount || 0) - (a.reviewCount || 0)
        || a.name.localeCompare(b.name, 'mn');
    }

    if (sort === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    if (sort === 'name') {
      return a.name.localeCompare(b.name, 'mn');
    }

    return activityScore(b) - activityScore(a)
      || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      || a.name.localeCompare(b.name, 'mn');
  });
}

function createFacets(items: StoreDirectoryItem[]): StoreDirectoryFacets {
  const types = { ...EMPTY_FACETS.types };
  const districtCounts = new Map<string, { label: string; count: number }>();
  const categoryCounts = new Map<string, { label: string; count: number }>();

  for (const item of items) {
    types.all += 1;
    types[item.directoryType] += 1;

    if (item.district) {
      const value = normalizeFacetValue(item.district);
      const current = districtCounts.get(value);
      districtCounts.set(value, { label: current?.label || item.district, count: (current?.count || 0) + 1 });
    }

    for (const keyword of item.keywords.slice(0, 4)) {
      const value = normalizeFacetValue(keyword);
      if (!value) continue;
      const current = categoryCounts.get(value);
      categoryCounts.set(value, { label: current?.label || keyword, count: (current?.count || 0) + 1 });
    }
  }

  const toFacet = ([value, entry]: [string, { label: string; count: number }]): StoreDirectoryFacet => ({
    value,
    label: entry.label,
    count: entry.count,
  });

  return {
    types,
    districts: [...districtCounts.entries()]
      .map(toFacet)
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'mn')),
    categories: [...categoryCounts.entries()]
      .map(toFacet)
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'mn'))
      .slice(0, 18),
  };
}

function mapShop(shop: ShopWithRelations, assets: ShopDirectoryAssets): StoreDirectoryItem {
  const directoryType = normalizeShopType(shop.shopType?.type);
  const keywords = displayText(shop.industry, shop.shopType?.type, directoryType === 'service' ? 'Үйлчилгээ' : 'Дэлгүүр');
  return {
    id: shop.id,
    ownerId: shop.userId,
    name: shop.name,
    slug: shop.slug,
    href: `/s/${shop.storefrontSlug || shop.slug}`,
    logo: shop.logo,
    coverImage: assets.coverImage || shop.logo,
    description: shop.industry || shop.address || null,
    category: shop.industry || (directoryType === 'service' ? 'Үйлчилгээ' : 'Дэлгүүр'),
    address: shop.address,
    district: shop.district,
    phone: shop.phone,
    entityType: 'store',
    directoryType,
    storeType: shop.shopType?.type || 'product',
    isVerified: shop.locationStatus === 'verified',
    rating: null,
    reviewCount: null,
    productCount: assets.productCount,
    serviceCount: shop._count.services || shop.services.length,
    listingCount: 0,
    createdAt: shop.createdAt.toISOString(),
    keywords,
  };
}

function mapAgent(agent: AgentWithCount): StoreDirectoryItem {
  const keywords = displayText(agent.specialties, 'Агент', 'Үл хөдлөх');
  return {
    id: agent.id,
    ownerId: agent.userId,
    name: agent.name,
    slug: agent.slug,
    href: `/entity/agent/${agent.slug}`,
    logo: agent.profilePhoto,
    coverImage: agent.coverImage || agent.profilePhoto,
    description: agent.bio || agent.specialties.join(', ') || null,
    category: agent.specialties[0] || 'Үл хөдлөх',
    address: agent.address,
    district: agent.district,
    phone: agent.phone,
    entityType: 'agent',
    directoryType: 'agent',
    isVerified: agent.isVerified,
    rating: agent.rating,
    reviewCount: agent.reviewCount,
    productCount: 0,
    serviceCount: 0,
    listingCount: agent._count.listings,
    createdAt: agent.createdAt.toISOString(),
    keywords,
  };
}

function mapCompany(company: CompanyWithCount): StoreDirectoryItem {
  const keywords = displayText(company.awards, 'Компани', 'Барилга');
  return {
    id: company.id,
    ownerId: company.userId,
    name: company.name,
    slug: company.slug,
    href: `/entity/company/${company.slug}`,
    logo: company.logo,
    coverImage: company.coverImage || company.logo,
    description: company.description,
    category: 'Барилга',
    address: company.address,
    district: company.district,
    phone: company.phone,
    entityType: 'company',
    directoryType: 'company',
    isVerified: company.isVerified,
    rating: company.rating,
    reviewCount: company.reviewCount,
    productCount: 0,
    serviceCount: 0,
    listingCount: company._count.projects,
    createdAt: company.createdAt.toISOString(),
    keywords,
  };
}

function mapAutoDealer(dealer: AutoDealerWithCount): StoreDirectoryItem {
  const keywords = displayText(dealer.brands, 'Авто');
  return {
    id: dealer.id,
    ownerId: dealer.userId,
    name: dealer.name,
    slug: dealer.slug,
    href: `/entity/auto_dealer/${dealer.slug}`,
    logo: dealer.logo,
    coverImage: dealer.coverImage || dealer.logo,
    description: dealer.description || dealer.brands.join(', ') || null,
    category: dealer.brands[0] || 'Авто',
    address: dealer.address,
    district: dealer.district,
    phone: dealer.phone,
    entityType: 'auto_dealer',
    directoryType: 'auto_dealer',
    isVerified: dealer.isVerified,
    rating: dealer.rating,
    reviewCount: dealer.reviewCount,
    productCount: 0,
    serviceCount: 0,
    listingCount: dealer._count.vehicles,
    createdAt: dealer.createdAt.toISOString(),
    keywords,
  };
}

function mapServiceProvider(provider: ServiceProviderWithCount): StoreDirectoryItem {
  const keywords = displayText(provider.serviceTypes, 'Үйлчилгээ');
  return {
    id: provider.id,
    ownerId: provider.userId,
    name: provider.name,
    slug: provider.slug,
    href: `/entity/service/${provider.slug}`,
    logo: provider.logo,
    coverImage: provider.coverImage || provider.logo,
    description: provider.description || provider.serviceTypes.join(', ') || null,
    category: provider.serviceTypes[0] || 'Үйлчилгээ',
    address: provider.address,
    district: provider.district,
    phone: provider.phone,
    entityType: 'service',
    directoryType: 'service',
    isVerified: provider.isVerified,
    rating: provider.rating,
    reviewCount: provider.reviewCount,
    productCount: 0,
    serviceCount: provider.serviceTypes.length,
    listingCount: provider._count.listings,
    createdAt: provider.createdAt.toISOString(),
    keywords,
  };
}

async function fetchShopDirectoryAssets(shops: ShopWithRelations[]) {
  const entries = await Promise.all(
    shops.map(async (shop) => {
      const products = await prisma.product.findMany({
        where: publicProductWhere({ userId: shop.userId }),
        select: {
          name: true,
          description: true,
          price: true,
          salePrice: true,
          images: true,
          isActive: true,
          isDemo: true,
        },
        take: 500,
      });
      const publicProducts = filterPublicLaunchProducts(products);
      const coverImage = publicProducts
        .flatMap((product) => sanitizeImageUrls(product.images))
        .at(0) || null;

      return [shop.id, { productCount: publicProducts.length, coverImage }] as const;
    }),
  );

  return new Map(entries);
}

async function fetchDirectoryItems(district: string) {
  const shopWhere: Prisma.ShopWhereInput = {
    isBlocked: false,
    isDemo: false,
    ...(district ? { district } : {}),
    NOT: blockedShopWhere(),
  };
  const entityDistrict = district ? { district } : {};

  const [shops, agents, companies, dealers, providers] = await Promise.all([
    prisma.shop.findMany({
      where: shopWhere,
      include: {
        shopType: true,
        services: { select: { id: true } },
        _count: { select: { services: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: DIRECTORY_FETCH_LIMIT,
    }),
    prisma.agent.findMany({
      where: { ...entityDistrict, NOT: blockedAgentWhere() },
      include: { _count: { select: { listings: true } } },
      orderBy: { createdAt: 'desc' },
      take: DIRECTORY_FETCH_LIMIT,
    }),
    prisma.company.findMany({
      where: { ...entityDistrict, NOT: blockedCompanyWhere() },
      include: { _count: { select: { projects: true } } },
      orderBy: { createdAt: 'desc' },
      take: DIRECTORY_FETCH_LIMIT,
    }),
    prisma.autoDealer.findMany({
      where: { ...entityDistrict, NOT: blockedAutoDealerWhere() },
      include: { _count: { select: { vehicles: true } } },
      orderBy: { createdAt: 'desc' },
      take: DIRECTORY_FETCH_LIMIT,
    }),
    prisma.serviceProvider.findMany({
      where: { ...entityDistrict, NOT: blockedServiceProviderWhere() },
      include: { _count: { select: { listings: true } } },
      orderBy: { createdAt: 'desc' },
      take: DIRECTORY_FETCH_LIMIT,
    }),
  ]);

  const shopAssets = await fetchShopDirectoryAssets(shops);

  return [
    ...shops.map((shop) => mapShop(shop, shopAssets.get(shop.id) || { productCount: 0, coverImage: null })),
    ...agents.map(mapAgent),
    ...companies.map(mapCompany),
    ...dealers.map(mapAutoDealer),
    ...providers.map(mapServiceProvider),
  ].filter(hasPublicDirectoryQuality);
}

function applyFilters(
  items: StoreDirectoryItem[],
  type: StoreDirectoryType,
  search: string,
  category: string,
) {
  return items.filter((item) => {
    if (type !== 'all' && item.directoryType !== type) return false;
    return matchesSearch(item, search) && matchesCategory(item, category);
  });
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const typeParam = url.searchParams.get('type');
    const sortParam = url.searchParams.get('sort');
    const type = isStoreDirectoryType(typeParam) ? typeParam : 'all';
    const sort = isStoreDirectorySort(sortParam) ? sortParam : 'featured';
    const district = (url.searchParams.get('district') || '').trim();
    const search = (url.searchParams.get('search') || url.searchParams.get('q') || '').trim();
    const category = (url.searchParams.get('category') || '').trim();
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(60, Math.max(1, parseInt(url.searchParams.get('limit') || '24', 10)));

    const allItems = await fetchDirectoryItems(district);
    const searchFiltered = allItems.filter((item) => matchesSearch(item, search));
    const facets = createFacets(searchFiltered);
    const filtered = applyFilters(searchFiltered, type, '', category);
    const sorted = sortDirectoryItems(filtered, sort);
    const start = (page - 1) * limit;
    const stores = sorted.slice(start, start + limit);
    const total = sorted.length;
    const pages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      stores,
      total,
      page,
      pages,
      limit,
      hasMore: start + limit < total,
      facets,
      query: { type, search, district, category, sort },
    });
  } catch (error: unknown) {
    console.warn('Stores API error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({
      stores: [],
      total: 0,
      page: 1,
      pages: 1,
      limit: 24,
      hasMore: false,
      facets: EMPTY_FACETS,
      query: {
        type: STORE_DIRECTORY_TYPES[0],
        search: '',
        district: '',
        category: '',
        sort: 'featured' satisfies StoreDirectorySort,
      },
    });
  }
}
