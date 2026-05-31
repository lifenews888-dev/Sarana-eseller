import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSafeImageList } from '@/lib/image-url';

// GET /api/search/suggest?q=
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  if (q.length < 2) return NextResponse.json({ products: [], shops: [], categories: [] });

  try {
    const [products, shops, categories] = await Promise.all([
      prisma.product.findMany({
        where: { name: { contains: q, mode: 'insensitive' }, isActive: true },
        take: 5, select: { id: true, name: true, price: true, images: true, emoji: true },
      }),
      prisma.shop.findMany({
        where: { name: { contains: q, mode: 'insensitive' } },
        take: 3, select: { id: true, name: true, slug: true, storefrontSlug: true, logo: true },
      }),
      prisma.category.findMany({
        where: { name: { contains: q, mode: 'insensitive' }, isApproved: true },
        take: 3, select: { id: true, name: true, slug: true, icon: true },
      }),
    ]);
    return NextResponse.json({
      products: products.map((product) => ({ ...product, images: getSafeImageList(product.images) })),
      shops,
      categories,
    });
  } catch {
    return NextResponse.json({ products: [], shops: [], categories: [] });
  }
}
