import { NextRequest, NextResponse } from 'next/server';
import { json, errorJson, requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { PUBLIC_HERDER_WHERE, getCoordinatorScope, scopeWhere, toHerderOrderStatus } from '@/lib/herder';

// GET /api/herder/coordinator/stats
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const scope = await getCoordinatorScope(auth);
  if (!scope) return errorJson('Зөвхөн координатор хандах боломжтой', 403);

  const base = scopeWhere(scope);
  const [byStatus, active, herders] = await Promise.all([
    prisma.herderShop.groupBy({ by: ['status'], where: base, _count: { _all: true } }),
    prisma.herderShop.count({ where: { AND: [PUBLIC_HERDER_WHERE, base] } }),
    prisma.herderShop.findMany({ where: { AND: [PUBLIC_HERDER_WHERE, base] }, select: { shopId: true } }),
  ]);
  const count = (s: string) => byStatus.find((b) => b.status === s)?._count._all ?? 0;

  const shopIds = herders.map((h) => h.shopId);
  const orders = shopIds.length
    ? await prisma.order.groupBy({ by: ['status'], where: { shopId: { in: shopIds } }, _count: { _all: true }, _sum: { total: true } })
    : [];

  const orderCounts: Record<string, number> = {};
  let salesTotal = 0;
  let salesCount = 0;
  for (const o of orders) {
    const key = toHerderOrderStatus(o.status);
    orderCounts[key] = (orderCounts[key] || 0) + o._count._all;
    if (o.status !== 'pending' && o.status !== 'cancelled') {
      salesTotal += Math.round(o._sum.total || 0);
      salesCount += o._count._all;
    }
  }

  return json({
    scope: scope.all ? 'ALL' : scope.provinces,
    applications: {
      pending: count('pending'),
      underReview: count('under_review'),
      approved: count('approved'),
      rejected: count('rejected'),
    },
    herders: { active },
    orders: orderCounts,
    sales: { total: salesTotal, count: salesCount },
  });
}
