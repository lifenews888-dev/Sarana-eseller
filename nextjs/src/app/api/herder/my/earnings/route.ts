import { NextRequest, NextResponse } from 'next/server';
import { json, errorJson, requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { HERDER_COMMISSION_RATE, getMyHerderShop } from '@/lib/herder';

// GET /api/herder/my/earnings — орлогын хураангуй (integer MNT, шимтгэл хассан)
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const herder = await getMyHerderShop(auth.id);
  if (!herder) return errorJson('Малчны бүртгэл олдсонгүй', 404);

  const orders = await prisma.order.findMany({
    where: { shopId: herder.shopId, status: { notIn: ['cancelled', 'refunded'] } },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, orderNumber: true, total: true, sellerAmount: true, status: true, escrowStatus: true, confirmedAt: true, updatedAt: true },
  });

  const net = (o: { total: number | null; sellerAmount: number | null }) =>
    Math.round(o.sellerAmount && o.sellerAmount > 0 ? o.sellerAmount : (Number(o.total) || 0) * (1 - HERDER_COMMISSION_RATE));

  const released = { total: 0, count: 0 };
  const held = { total: 0, count: 0 };
  const pending = { total: 0, count: 0 };
  const releasedOrders: typeof orders = [];

  for (const o of orders) {
    if (o.escrowStatus === 'RELEASED') {
      released.total += net(o);
      released.count += 1;
      releasedOrders.push(o);
    } else if (o.status === 'pending') {
      pending.total += net(o);
      pending.count += 1;
    } else {
      held.total += net(o);
      held.count += 1;
    }
  }

  return json({
    released,
    held,
    pending,
    recentPayouts: releasedOrders.slice(0, 10).map((o) => ({
      _id: o.id,
      orderNumber: o.orderNumber || o.id.slice(-6).toUpperCase(),
      total: Math.round(Number(o.total) || 0),
      escrow: { holdAmount: net(o), releasedAt: (o.confirmedAt || o.updatedAt).toISOString() },
    })),
    commissionRate: Math.round(HERDER_COMMISSION_RATE * 100), // хувиар (мобайл % гэж харуулна)
  });
}
