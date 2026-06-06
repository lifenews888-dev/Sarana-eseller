import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok } from '@/lib/api-envelope';
import { getSafeImageList } from '@/lib/image-url';
import { filterPublicLaunchProducts, publicProductWhere } from '@/lib/product-visibility';

// GET /api/products/[id]/related?limit=4
// Same-category active products, excluding the current one.
// Used by the web ProductDetailClient and the mobile product detail
// "Төстэй бараа" section. Shape matches the /api/products list so a
// single ProductCard component can render either feed.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const limit = Math.min(12, Math.max(1, Number(req.nextUrl.searchParams.get('limit') || '4')));

  try {
    const current = await prisma.product.findUnique({
      where: { id },
      select: { category: true },
    });

    if (!current || !current.category) {
      return ok({ products: [] });
    }

    const products = await prisma.product.findMany({
      where: publicProductWhere({
        category: current.category,
        id: { not: id },
      }),
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        price: true,
        salePrice: true,
        images: true,
        emoji: true,
        rating: true,
        reviewCount: true,
      },
    });

    const visibleProducts = filterPublicLaunchProducts(products);

    return ok({
      products: visibleProducts.map((product) => ({
        ...product,
        _id: product.id,
        images: getSafeImageList(product.images),
      })),
    });
  } catch (err) {
    console.error('Related products error:', err);
    // Soft-fail with an empty list so the caller renders the "no
    // related products" branch instead of an error toast. Using ok()
    // (not fail()) keeps the envelope `success: true` contract.
    return ok({ products: [] });
  }
}
