import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { json, errorJson, requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { APPLICATION_STATUSES, getCoordinatorScope, pageParams, pagesFor, scopeWhere } from '@/lib/herder';
import { toCoordinatorApplication } from '@/lib/herderCoordinator';

// GET /api/herder/coordinator/applications?status=pending|under_review|approved|rejected|all
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const scope = await getCoordinatorScope(auth);
  if (!scope) return errorJson('Зөвхөн координатор хандах боломжтой', 403);

  const sp = req.nextUrl.searchParams;
  const { page, limit, skip } = pageParams(sp);
  const status = sp.get('status') || 'pending';
  const where: Prisma.HerderShopWhereInput = { ...scopeWhere(scope) };
  if (status !== 'all' && (APPLICATION_STATUSES as readonly string[]).includes(status)) where.status = status;
  else where.status = { in: [...APPLICATION_STATUSES] };

  const [rows, total] = await Promise.all([
    prisma.herderShop.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { shop: { select: { userId: true } } },
    }),
    prisma.herderShop.count({ where }),
  ]);
  const users = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.shop.userId) } },
    select: { id: true, name: true, email: true, phone: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return json({
    applications: rows.map((r) => toCoordinatorApplication(r, userMap.get(r.shop.userId) || null)),
    total,
    page,
    pages: pagesFor(total, limit),
  });
}
