import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok } from '@/lib/api-envelope';
import { DEMO_PRODUCTS } from '@/lib/utils';
import { getSafeImageList } from '@/lib/image-url';
import { publicProductWhere } from '@/lib/product-visibility';

// GET /api/products?limit=20&search=&category=
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const limit = Math.min(100, Number(sp.get('limit') || '20'));
  const page = Math.max(1, Number(sp.get('page') || '1'));
  const search = sp.get('search') || sp.get('q') || '';
  const category = sp.get('category') || '';

  const filters: Parameters<typeof publicProductWhere> = [];

  if (search) {
    filters.push({ name: { contains: search, mode: 'insensitive' } });
  }
  if (category) {
    filters.push({ category });
  }

  const where = publicProductWhere(...filters);

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          price: true,
          salePrice: true,
          images: true,
          category: true,
          emoji: true,
          stock: true,
          rating: true,
          reviewCount: true,
          isLive: true,
          currentLiveId: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    return ok({
      products: products.map((product) => ({
        ...product,
        _id: product.id,
        images: getSafeImageList(product.images),
      })),
      total,
      page,
      hasMore: page * limit < total,
    });
  } catch (err) {
    console.error('Products list error:', err);
    const products = DEMO_PRODUCTS.map((product) => ({
      ...product,
      id: product._id,
      _id: product._id,
      images: getSafeImageList('images' in product ? product.images : []),
      isActive: true,
    }));

    return ok({
      products,
      total: products.length,
      page,
      hasMore: false,
    });
  }
}
