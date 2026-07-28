import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';

// GET /api/seller/orders?status=pending
export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  // Shop.userId is the owner
  const shop = await prisma.shop.findFirst({ where: { userId: user.id } });
  if (!shop) return errorJson('Дэлгүүр олдсонгүй', 404);

  const status = req.nextUrl.searchParams.get('status');

  const orders = await prisma.order.findMany({
    where: {
      shopId: shop.id,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // Enrich with buyer info
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
