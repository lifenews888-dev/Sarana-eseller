import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSafeImageList } from '@/lib/image-url';
import { fetchPublicLaunchProductPage, publicProductWhere } from '@/lib/product-visibility';

const searchProductSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  salePrice: true,
  images: true,
  emoji: true,
  rating: true,
  reviewCount: true,
  entityType: true,
  district: true,
  category: true,
  createdAt: true,
  isActive: true,
  isDemo: true,
} satisfies Prisma.ProductSelect;

type SearchProductRow = Prisma.ProductGetPayload<{ select: typeof searchProductSelect }>;

function positiveIntParam(value: string | null, fallback: number, max: number) {
  const parsed = Number(value || fallback);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(max, Math.floor(parsed));
}

function numberParam(value: string | null, fallback: number) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toSearchProduct(product: SearchProductRow) {
  return {
    id: product.id,
    _id: product.id,
    name: product.name,
    price: product.price,
    salePrice: product.salePrice,
    images: getSafeImageList(product.images),
    emoji: product.emoji,
    rating: product.rating,
    reviewCount: product.reviewCount,
    entityType: product.entityType,
    district: product.district,
    category: product.category,
    createdAt: product.createdAt,
  };
}

// GET /api/search?q=&category=&minPrice=&maxPrice=&district=&entityType=&sort=&page=&limit=
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get('q') || '';
  const category = sp.get('category');
  const minPrice = numberParam(sp.get('minPrice'), 0);
  const maxPrice = numberParam(sp.get('maxPrice'), 999999999);
  const district = sp.get('district');
  const entityType = sp.get('entityType');
  const sort = sp.get('sort') || 'newest';
  const page = positiveIntParam(sp.get('page'), 1, Number.MAX_SAFE_INTEGER);
  const limit = positiveIntParam(sp.get('limit'), 20, 50);

  const productFilters: Parameters<typeof publicProductWhere> = [
    { price: { gte: Math.max(minPrice, 2), lte: maxPrice } },
  ];

  if (q) {
    productFilters.push({
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
      ],
    });
  }
  if (category) productFilters.push({ categoryId: category });
  if (district) productFilters.push({ district });
  if (entityType) productFilters.push({ entityType });

  const where = publicProductWhere(...productFilters);
  const orderBy = sort === 'price_asc'
    ? { price: 'asc' as const }
    : sort === 'price_desc'
      ? { price: 'desc' as const }
      : sort === 'rating'
        ? { rating: 'desc' as const }
        : { createdAt: 'desc' as const };

  try {
    const productPage = await fetchPublicLaunchProductPage({
      page,
      limit,
      fetchBatch: ({ skip, take }) => prisma.product.findMany({
        where,
        orderBy,
        skip,
        take,
        select: searchProductSelect,
      }),
    });

    if (productPage.products.length > 0 || productPage.total > 0) {
      return NextResponse.json({
        products: productPage.products.map(toSearchProduct),
        total: productPage.total,
        pages: productPage.pages,
        page,
      });
    }

    const feedWhere: Prisma.FeedItemWhereInput = { status: 'active' };
    if (q) {
      feedWhere.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const feedPosts = await prisma.feedItem.findMany({
      where: feedWhere,
      include: { media: { take: 1 } },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const converted = feedPosts.map((p) => ({
      id: p.id,
      _id: p.id,
      name: p.title,
      price: p.price,
      images: getSafeImageList(p.images),
      media: p.media,
      category: p.category ? { name: p.category } : null,
      isFeedPost: true,
      district: p.district,
      createdAt: p.createdAt,
    }));

    return NextResponse.json({
      products: converted,
      total: converted.length,
      pages: 1,
      page: 1,
      fromFeed: true,
    });
  } catch (e) {
    return NextResponse.json({
      products: [],
      total: 0,
      pages: 0,
      page: 1,
      error: (e as Error).message,
    });
  }
}
