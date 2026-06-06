import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [productCount, shopCount, userCount, orderCount] = await Promise.all([
      prisma.product.count({ where: { isActive: true, isDemo: false } }),
      prisma.shop.count({ where: { isBlocked: false, isDemo: false } }),
      prisma.user.count(),
      prisma.order.count({ where: { status: 'delivered' } }),
    ]);

    return NextResponse.json({
      productCount,
      shopCount,
      userCount,
      orderCount,
    });
  } catch (error) {
    console.error('[stats]:', error);
    return NextResponse.json({
      productCount: 0,
      shopCount: 0,
      userCount: 0,
      orderCount: 0,
    });
  }
}
