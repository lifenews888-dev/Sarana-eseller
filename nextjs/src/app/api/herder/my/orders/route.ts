import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { json, errorJson, requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { getMyHerderShop, pageParams, pagesFor, toMyHerderOrder } from '@/lib/herder';
import { loadOrderContext } from '@/lib/herderOrders';

// Мобайлын төлөв → вэбийн Order.status-ууд
const STATUS_FILTER: Record<string, string[]> = {
  pending: ['pending'],
  confirmed: ['confirmed'],
  preparing: ['preparing', 'ready'],
  shipped: ['delivering'],
  delivered: ['delivered', 'completed'],
  cancelled: ['cancelled', 'refunded'],
};

// GET /api/herder/my/orders?status&page&limit
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const herder = await getMyHerderShop(auth.id);
  if (!herder) return errorJson('Малчны бүртгэл олдсонгүй', 404);

  const sp = req.nextUrl.searchParams;
  const { page, limit, skip } = pageParams(sp);
  const where: Prisma.OrderWhereInput = { shopId: herder.shopId };
  const status = sp.get('status');
  if (status && STATUS_FILTER[status]) where.status = { in: STATUS_FILTER[status] };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.order.count({ where }),
  ]);
  const ctx = await loadOrderContext(orders);

  return json({
    orders: orders.map((o) => toMyHerderOrder(o, ctx.buyers.get(o.userId) || null, ctx.coldChain(o))),
    total,
    page,
    pages: pagesFor(total, limit),
  });
}
