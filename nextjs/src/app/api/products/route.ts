import { NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ok } from '@/lib/api-envelope';
import { DEMO_PRODUCTS } from '@/lib/utils';
import { getSafeImageList } from '@/lib/image-url';
import { fetchPublicLaunchProductPage, publicProductWhere } from '@/lib/product-visibility';

const productListSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  salePrice: true,
  images: true,
  category: true,
  emoji: true,
  stock: true,
  rating: true,
  reviewCount: true,
  isActive: true,
  isDemo: true,
  isLive: true,
  currentLiveId: true,
} satisfies Prisma.ProductSelect;

type ProductListRow = Prisma.ProductGetPayload<{ select: typeof productListSelect }>;

function positiveIntParam(value: string | null, fallback: number, max: number) {
  const parsed = Number(value || fallback);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(max, Math.floor(parsed));
}

function toProductListItem(product: ProductListRow) {
  return {
    id: product.id,
    _id: product.id,
    name: product.name,
    price: product.price,
    salePrice: product.salePrice,
    images: getSafeImageList(product.images),
    category: product.category,
    emoji: product.emoji,
    stock: product.stock,
    rating: product.rating,
    reviewCount: product.reviewCount,
    isLive: product.isLive,
    currentLiveId: product.currentLiveId,
  };
}

// GET /api/products?limit=20&search=&category=
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const limit = positiveIntParam(sp.get('limit'), 20, 100);
  const page = positiveIntParam(sp.get('page'), 1, Number.MAX_SAFE_INTEGER);
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
  const orderBy = { createdAt: 'desc' as const };

  try {
    const productPage = await fetchPublicLaunchProductPage({
      page,
      limit,
      fetchBatch: ({ skip, take }) => prisma.product.findMany({
        where,
        orderBy,
        skip,
        take,
        select: productListSelect,
      }),
    });

    return ok({
      products: productPage.products.map(toProductListItem),
      total: productPage.total,
      page,
      hasMore: productPage.hasMore,
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
