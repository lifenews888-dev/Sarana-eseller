import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireDriver, json } from '@/lib/api-auth';

// GET /api/driver/orders?type=available|mine
export async function GET(req: NextRequest) {
  const user = await requireDriver(req);
  if (user instanceof NextResponse) return user;

  const type = req.nextUrl.searchParams.get('type') || 'mine';

  if (type === 'available') {
    // Orders ready for driver pickup
    const orders = await prisma.order.findMany({
      where: { status: 'ready', driverId: null },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    // Enrich with buyer + shop
    const buyerIds = [...new Set(orders.map((o) => o.userId).filter(Boolean))];
    const shopIds = [...new Set(orders.map((o) => o.shopId).filter(Boolean) as string[])];

    const [buyers, shops] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: buyerIds } },
        select: { id: true, name: true, phone: true },
      }),
      prisma.shop.findMany({
        where: { id: { in: shopIds } },
        select: { id: true, name: true, address: true, phone: true },
      }),
    ]);
    const buyerMap = new Map(buyers.map((b) => [b.id, b]));
    const shopMap = new Map(shops.map((s) => [s.id, s]));

    return json({
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        total: o.total,
        items: o.items,
        deliveryAddress: o.deliveryAddress,
        delivery: o.delivery,
        createdAt: o.createdAt,
        buyer: buyerMap.get(o.userId) || null,
        shop: o.shopId ? shopMap.get(o.shopId) || null : null,
      })),
    });
  }

  // My active deliveries
  const orders = await prisma.order.findMany({
    where: {
      driverId: user.id,
      status: { in: ['delivering', 'handed_to_driver'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  const buyerIds = [...new Set(orders.map((o) => o.userId).filter(Boolean))];
  const buyers = await prisma.user.findMany({
    where: { id: { in: buyerIds } },
    select: { id: true, name: true, phone: true },
  });
  const buyerMap = new Map(buyers.map((b) => [b.id, b]));

  return json({
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: o.total,
      items: o.items,
      deliveryAddress: o.deliveryAddress,
      delivery: o.delivery,
      createdAt: o.createdAt,
      buyer: buyerMap.get(o.userId) || null,
    })),
  });
}
