import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/search?q=&category=&minPrice=&maxPrice=&district=&entityType=&sort=&page=&limit=
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get('q') || '';
  const category = sp.get('category');
  const minPrice = Number(sp.get('minPrice') || 0);
  const maxPrice = Number(sp.get('maxPrice') || 999999999);
  const district = sp.get('district');
  const entityType = sp.get('entityType');
  const sort = sp.get('sort') || 'newest';
  const page = Math.max(1, Number(sp.get('page') || 1));
  const limit = Math.min(50, Number(sp.get('limit') || 20));

  const where: any = { isActive: true, price: { gte: minPrice, lte: maxPrice } };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { brand: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (category) where.categoryId = category;
  if (district) where.district = district;
  if (entityType) where.entityType = entityType;

  const orderBy = sort === 'price_asc' ? { price: 'asc' as const }
    : sort === 'price_desc' ? { price: 'desc' as const }
    : sort === 'rating' ? { rating: 'desc' as const }
    : { createdAt: 'desc' as const };

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, orderBy, skip: (page - 1) * limit, take: limit,
        select: {
          id: true, name: true, price: true, salePrice: true,
          images: true, emoji: true, rating: true, reviewCount: true,
          entityType: true, district: true, category: true, createdAt: true,
          description: true, stock: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Бараа байвал шууд буцаах
    if (products.length > 0) {
      return NextResponse.json({
        products: products.map((p) => ({ ...p, _id: p.id })),
        total,
        pages: Math.ceil(total / limit),
        page,
      });
    }

    // Бараа байхгүй бол Feed posts-оос хайх
    const feedWhere: any = { status: 'active' };
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
      images: p.images || [],
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
      products: [], total: 0, pages: 0, page: 1,
      error: (e as Error).message,
    });
  }
}
