export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSafeImageList } from '@/lib/image-url';
import { filterPublicLaunchProducts, publicProductWhere } from '@/lib/product-visibility';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: publicProductWhere(),
      take: 60,
      orderBy: { createdAt: 'desc' },
    });

    // Map to store page format (_id, name, price, etc)
    const visibleProducts = filterPublicLaunchProducts(products);
    const items = visibleProducts.map((p) => ({
      _id: p.id,
      id: p.id,
      type: 'product',
      name: p.name,
      title: p.name,
      price: p.price,
      salePrice: p.salePrice,
      description: p.description,
      category: p.category,
      emoji: p.emoji,
      images: getSafeImageList(p.images),
      stock: p.stock,
      rating: p.rating,
      reviewCount: p.reviewCount,
      isActive: p.isActive,
      createdAt: p.createdAt?.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: { items, total: items.length, hasMore: false },
      // Also return as "products" for store page compatibility
      products: items,
    });
  } catch (e: unknown) {
    console.error('MARKETPLACE ERROR:', (e as Error).message);
    return NextResponse.json({
      success: true,
      data: { items: [], total: 0, hasMore: false },
      products: [],
    });
  }
}
