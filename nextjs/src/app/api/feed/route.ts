import { NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { json, requireAuth, errorJson } from '@/lib/api-auth';
import { DEMO_FEED } from '@/lib/types/entity';
import { buildOwnedFeedWhere, normalizeListingEntityType } from '@/lib/feedOwnership';

const mediaInclude = { media: { orderBy: { sortOrder: 'asc' as const } } };

type MetadataValue = string | number | boolean | string[];
type MetadataRecord = Record<string, MetadataValue>;

const SPECIAL_ENTITY_TYPES = new Set(['agent', 'company', 'auto_dealer']);
const VALID_TIERS = new Set(['normal', 'featured', 'vip', 'discounted']);

const REQUIRED_SPECIAL_METADATA_KEYS: Record<string, string[]> = {
  agent: ['propertyType', 'sqm', 'rooms'],
  company: ['projectStatus', 'totalUnits', 'pricePerSqm', 'completionDate'],
  auto_dealer: ['brand', 'model', 'year', 'mileage'],
};

const NUMBER_METADATA_KEYS = new Set([
  'sqm',
  'area',
  'rooms',
  'bedrooms',
  'bathrooms',
  'floor',
  'totalFloors',
  'builtYear',
  'windowCount',
  'maintenanceFeeMnt',
  'pricePerSqm',
  'totalUnits',
  'soldUnits',
  'availableUnits',
  'floors',
  'year',
  'mileage',
  'ownersCount',
  'minBatch',
  'currentBatch',
  'advancePercent',
  'availableSlots',
]);

const BOOLEAN_METADATA_KEYS = new Set(['certificateReady', 'mortgageAvailable']);

const LIST_METADATA_KEYS = new Set([
  'highlights',
  'nearby',
  'documents',
  'roomChoices',
  'amenities',
  'paymentTerms',
  'features',
]);

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStringList(value: unknown): string[] {
  const values = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[\n,]/) : [];
  return values
    .map((item) => (typeof item === 'string' ? item.trim() : String(item).trim()))
    .filter(Boolean);
}

function toOptionalNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;

  const normalized = value.replace(/[,\s₮]/g, '');
  if (!normalized) return null;

  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function toOptionalBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'тийм'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n', 'үгүй'].includes(normalized)) return false;
  return null;
}

function normalizeMediaUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(cleanString).filter(Boolean);
}

function defaultCategory(entityType: string, metadata: MetadataRecord): string {
  if (entityType === 'company') return 'new_building';
  if (entityType === 'auto_dealer') return 'vehicle';
  if (entityType === 'service') return 'service';
  if (entityType !== 'agent') return '';

  const propertyType = String(metadata.propertyType || '').toLowerCase();
  if (propertyType.includes('газар') || propertyType.includes('land')) return 'land';
  if (propertyType.includes('оффис') || propertyType.includes('office')) return 'office';
  if (propertyType.includes('хаус') || propertyType.includes('house')) return 'house';
  return 'apartment';
}

function normalizeMetadata(
  value: unknown,
  entityType: string,
  district: string,
  price: number | null
): MetadataRecord {
  const clean: MetadataRecord = {};
  const source =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  for (const [key, raw] of Object.entries(source)) {
    if (NUMBER_METADATA_KEYS.has(key)) {
      const n = toOptionalNumber(raw);
      if (n !== null) clean[key] = n;
      continue;
    }

    if (BOOLEAN_METADATA_KEYS.has(key)) {
      const b = toOptionalBoolean(raw);
      if (b !== null) clean[key] = b;
      continue;
    }

    if (LIST_METADATA_KEYS.has(key)) {
      const list = normalizeStringList(raw);
      if (list.length > 0) clean[key] = list;
      continue;
    }

    if (typeof raw === 'string') {
      const str = raw.trim();
      if (str) clean[key] = str;
    } else if (typeof raw === 'number' && Number.isFinite(raw)) {
      clean[key] = raw;
    } else if (typeof raw === 'boolean') {
      clean[key] = raw;
    } else if (Array.isArray(raw)) {
      const list = normalizeStringList(raw);
      if (list.length > 0) clean[key] = list;
    }
  }

  if (district && !clean.district) clean.district = district;
  if (typeof clean.sqm === 'number' && !clean.area) clean.area = clean.sqm;

  const sqm = typeof clean.sqm === 'number' ? clean.sqm : null;
  if (entityType === 'agent' && price && sqm && !clean.pricePerSqm) {
    clean.pricePerSqm = Math.round(price / sqm);
  }

  const totalUnits = typeof clean.totalUnits === 'number' ? clean.totalUnits : null;
  const soldUnits = typeof clean.soldUnits === 'number' ? clean.soldUnits : null;
  if (entityType === 'company' && totalUnits !== null && soldUnits !== null && !clean.availableUnits) {
    clean.availableUnits = Math.max(0, totalUnits - soldUnits);
  }

  return clean;
}

function hasMetadataValue(metadata: MetadataRecord, key: string): boolean {
  const value = metadata[key];
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== '';
}

function validateSpecialListing(
  entityType: string,
  description: string,
  imageUrls: string[],
  metadata: MetadataRecord
): string | null {
  if (!SPECIAL_ENTITY_TYPES.has(entityType)) return null;

  if (description.length < 30) {
    return 'Онцгой зар дээр худалдан авагч ойлгохуйц дэлгэрэнгүй тайлбар оруулна уу';
  }

  if (imageUrls.length < 3) {
    return 'Машин, байр, төсөл зэрэг тусгай зар дээр хамгийн багадаа 3 зураг оруулна уу';
  }

  const missing = (REQUIRED_SPECIAL_METADATA_KEYS[entityType] || []).filter(
    (key) => !hasMetadataValue(metadata, key)
  );

  if (missing.length > 0) {
    return `Тусгай зарын заавал бөглөх мэдээлэл дутуу байна: ${missing.join(', ')}`;
  }

  return null;
}

// GET /api/feed?category=agent&tier=vip&page=1&limit=20&sort=newest&search=...&mine=1&entityType=auto_dealer
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const category = sp.get('category');
  const tier = sp.get('tier');
  const page = Math.max(1, Number(sp.get('page') || '1'));
  const limit = Math.min(50, Number(sp.get('limit') || '20'));
  const sort = sp.get('sort') || 'newest';
  const search = sp.get('search');
  const district = sp.get('district');
  const province = sp.get('province');
  const entityType = normalizeListingEntityType(sp.get('entityType'));
  const mine = ['1', 'true', 'yes'].includes((sp.get('mine') || '').toLowerCase());
  const priceMin = sp.get('priceMin') ? Number(sp.get('priceMin')) : undefined;
  const priceMax = sp.get('priceMax') ? Number(sp.get('priceMax')) : undefined;

  let ownedWhere: Prisma.FeedItemWhereInput | null = null;
  if (mine) {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;
    ownedWhere = await buildOwnedFeedWhere(auth.id, entityType);
  }

  try {
    const where: Prisma.FeedItemWhereInput = mine ? {} : { status: 'active' };
    if (category) where.category = category;
    if (tier && tier !== 'all') where.tier = tier;
    if (entityType && !mine) where.entityType = entityType;
    if (district) where.district = district;
    if (province) where.province = province;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = {};
      if (priceMin !== undefined) where.price.gte = priceMin;
      if (priceMax !== undefined) where.price.lte = priceMax;
    }
    if (ownedWhere) {
      where.AND = [...(Array.isArray(where.AND) ? where.AND : []), ownedWhere];
    }

    const normalOrder =
      sort === 'price_asc'
        ? { price: 'asc' as const }
        : sort === 'price_desc'
          ? { price: 'desc' as const }
          : { createdAt: 'desc' as const };

    const [vip, featured, discounted, normalItems, total] = await Promise.all([
      prisma.feedItem.findMany({ where: { ...where, tier: 'vip' }, orderBy: { createdAt: 'desc' }, take: mine ? limit : 6, include: mediaInclude }),
      prisma.feedItem.findMany({ where: { ...where, tier: 'featured' }, orderBy: { createdAt: 'desc' }, take: mine ? limit : 12, include: mediaInclude }),
      prisma.feedItem.findMany({ where: { ...where, tier: 'discounted' }, orderBy: { createdAt: 'desc' }, take: mine ? limit : 10, include: mediaInclude }),
      prisma.feedItem.findMany({
        where: { ...where, tier: 'normal' },
        orderBy: normalOrder,
        skip: (page - 1) * limit,
        take: limit,
        include: mediaInclude,
      }),
      prisma.feedItem.count({ where: { ...where, tier: 'normal' } }),
    ]);

    return json({
      vip,
      featured,
      discounted,
      normal: normalItems,
      meta: { total, page, hasMore: page * limit < total },
    });
  } catch {
    if (mine) {
      return json({
        vip: [],
        featured: [],
        discounted: [],
        normal: [],
        meta: { total: 0, page: 1, hasMore: false },
      });
    }

    let items = [...DEMO_FEED];
    if (category) items = items.filter((i) => i.category === category);
    if (entityType) items = items.filter((i) => normalizeListingEntityType(i.entityType) === entityType);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((i) => i.title.toLowerCase().includes(q));
    }

    return json({
      vip: items.filter((i) => i.tier === 'vip'),
      featured: items.filter((i) => i.tier === 'featured'),
      discounted: items.filter((i) => i.tier === 'discounted'),
      normal: items.filter((i) => i.tier === 'normal'),
      meta: { total: items.length, page: 1, hasMore: false },
    });
  }
}

// POST /api/feed - create a read/write public listing owned by the current seller entity.
export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  try {
    const body = await req.json();
    const {
      title,
      description,
      price,
      originalPrice,
      images,
      category,
      subcategory,
      entityType,
      district,
      province,
      lat,
      lng,
      metadata,
      tier,
      videoUrl,
      virtualTourUrl,
      floorPlanUrl,
    } = body;

    const normalizedEntityType = normalizeListingEntityType(entityType) || 'store';
    const normalizedTitle = cleanString(title);
    const normalizedDescription = cleanString(description);
    const normalizedDistrict = cleanString(district);
    const normalizedProvince = cleanString(province);
    const normalizedSubcategory = cleanString(subcategory);
    const normalizedTier = VALID_TIERS.has(cleanString(tier)) ? cleanString(tier) : 'normal';
    const normalizedPrice = toOptionalNumber(price);
    const normalizedOriginalPrice = toOptionalNumber(originalPrice);
    const normalizedLat = toOptionalNumber(lat);
    const normalizedLng = toOptionalNumber(lng);
    const imageUrls = normalizeMediaUrls(images);
    const normalizedVideoUrl = cleanString(videoUrl);
    const normalizedVirtualTourUrl = cleanString(virtualTourUrl);
    const normalizedFloorPlanUrl = cleanString(floorPlanUrl);
    const normalizedMetadata = normalizeMetadata(
      metadata,
      normalizedEntityType,
      normalizedDistrict,
      normalizedPrice
    );
    const normalizedCategory = cleanString(category) || defaultCategory(normalizedEntityType, normalizedMetadata);
    if (!title || !normalizedEntityType) return errorJson('title, entityType шаардлагатай');

    if (!normalizedTitle) return errorJson('Гарчиг шаардлагатай');

    const validationError = validateSpecialListing(
      normalizedEntityType,
      normalizedDescription,
      imageUrls,
      normalizedMetadata
    );
    if (validationError) return errorJson(validationError);

    const prefixMap: Record<string, string> = {
      agent: 'AGT',
      auto_dealer: 'AUT',
      company: 'COM',
      service: 'SRV',
      store: 'STR',
      pre_order: 'PRE',
      digital: 'DIG',
      user: 'USR',
    };
    const prefix = prefixMap[normalizedEntityType] || 'USR';
    const refId = `${prefix}-${Date.now().toString(36).toUpperCase()}`;

    let entityId = user.id;
    if (normalizedEntityType === 'agent') {
      const agent = await prisma.agent.findUnique({ where: { userId: user.id }, select: { id: true } });
      if (!agent) return errorJson('Үл хөдлөхийн агент бүртгэл олдсонгүй', 404);
      entityId = agent.id;
    } else if (normalizedEntityType === 'company') {
      const company = await prisma.company.findUnique({ where: { userId: user.id }, select: { id: true } });
      if (!company) return errorJson('Компанийн бүртгэл олдсонгүй', 404);
      entityId = company.id;
    } else if (normalizedEntityType === 'auto_dealer') {
      const dealer = await prisma.autoDealer.findUnique({ where: { userId: user.id }, select: { id: true } });
      if (!dealer) return errorJson('Авто дилерийн бүртгэл олдсонгүй', 404);
      entityId = dealer.id;
    } else if (normalizedEntityType === 'service') {
      const provider = await prisma.serviceProvider.findUnique({ where: { userId: user.id }, select: { id: true } });
      if (!provider) return errorJson('Үйлчилгээний бүртгэл олдсонгүй', 404);
      entityId = provider.id;
    }

    const item = await prisma.feedItem.create({
      data: {
        refId,
        title: normalizedTitle,
        description: normalizedDescription || null,
        price: normalizedPrice,
        originalPrice: normalizedOriginalPrice,
        images: imageUrls,
        category: normalizedCategory || null,
        subcategory: normalizedSubcategory || null,
        entityType: normalizedEntityType,
        entityId,
        tier: normalizedTier,
        status: 'active',
        district: normalizedDistrict || null,
        province: normalizedProvince || null,
        lat: normalizedLat,
        lng: normalizedLng,
        metadata: normalizedMetadata as Prisma.InputJsonValue,
        ...(normalizedEntityType === 'agent' ? { agentId: entityId } : {}),
        ...(normalizedEntityType === 'company' ? { companyId: entityId } : {}),
        ...(normalizedEntityType === 'auto_dealer' ? { autoDealerId: entityId } : {}),
        ...(normalizedEntityType === 'service' ? { serviceProviderId: entityId } : {}),
      },
    });

    const mediaRows = [
      ...imageUrls.map((url, sortOrder) => ({ feedItemId: item.id, type: 'IMAGE', url, sortOrder })),
      ...(normalizedVideoUrl ? [{ feedItemId: item.id, type: 'VIDEO', url: normalizedVideoUrl, sortOrder: imageUrls.length }] : []),
      ...(normalizedVirtualTourUrl ? [{ feedItemId: item.id, type: 'VIRTUAL_TOUR', url: normalizedVirtualTourUrl, sortOrder: imageUrls.length + 1 }] : []),
      ...(normalizedFloorPlanUrl ? [{ feedItemId: item.id, type: 'FLOOR_PLAN', url: normalizedFloorPlanUrl, sortOrder: imageUrls.length + 2 }] : []),
    ].filter((row) => row.url.trim());

    if (mediaRows.length > 0) {
      await prisma.entityMedia.createMany({ data: mediaRows });
    }

    const itemWithMedia = await prisma.feedItem.findUnique({
      where: { id: item.id },
      include: mediaInclude,
    });

    return json(itemWithMedia || item, 201);
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === 'P2002') return errorJson('Энэ зар аль хэдийн бүртгэлтэй');
    return errorJson('Зар нэмэхэд алдаа: ' + (error.message || ''));
  }
}
