import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { json, errorJson, requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { PUBLIC_HERDER_WHERE, getCoordinatorScope, herderStats, pageParams, pagesFor, scopeWhere } from '@/lib/herder';

// GET /api/herder/coordinator/herders — хариуцсан аймгийн идэвхтэй малчид
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const scope = await getCoordinatorScope(auth);
  if (!scope) return errorJson('Зөвхөн координатор хандах боломжтой', 403);

  const { page, limit, skip } = pageParams(req.nextUrl.searchParams);
  const where: Prisma.HerderShopWhereInput = { AND: [PUBLIC_HERDER_WHERE, scopeWhere(scope)] };
  const [rows, total] = await Promise.all([
    prisma.herderShop.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit, include: { shop: { select: { userId: true } } } }),
    prisma.herderShop.count({ where }),
  ]);

  const shopIds = rows.map((r) => r.shopId);
  const [stats, users, productCounts] = await Promise.all([
    herderStats(rows.map((r) => r.id), shopIds),
    prisma.user.findMany({ where: { id: { in: rows.map((r) => r.shop.userId) } }, select: { id: true, name: true, email: true, phone: true } }),
    prisma.product.groupBy({ by: ['shopId'], where: { shopId: { in: shopIds }, isActive: true }, _count: { _all: true } }),
  ]);
  const userMap = new Map(users.map((u) => [u.id, u]));
  const productMap = new Map(productCounts.map((p) => [p.shopId || '', p._count._all]));

  return json({
    herders: rows.map((r) => {
      const u = userMap.get(r.shop.userId);
      return {
        id: r.id,
        user: u ? { _id: u.id, name: u.name, email: u.email, ...(u.phone ? { phone: u.phone } : {}) } : null,
        herderName: r.herderName,
        phone: r.phone || u?.phone || '',
        province: r.province,
        district: r.district,
        isVerified: r.isVerified,
        rating: stats.rating.get(r.id)?.avg ?? 0,
        orderCount: stats.orders.get(r.shopId) ?? 0,
        productCount: productMap.get(r.shopId) ?? 0,
        onTimeRate: 0,
        joinedAt: r.createdAt.toISOString(),
      };
    }),
    total,
    page,
    pages: pagesFor(total, limit),
  });
}
