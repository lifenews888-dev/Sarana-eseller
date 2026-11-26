import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireAuth } from '@/lib/api-auth';

// GET /api/admin/banners/stats
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  if (!['admin', 'superadmin', 'super_admin'].includes(auth.role)) return errorJson('Админ эрх шаардлагатай', 403);

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [active, pending, expiringToday, paidThisMonth, impressionsAgg] = await Promise.all([
      prisma.banner.count({ where: { status: 'ACTIVE' } }),
      prisma.banner.count({ where: { status: 'PENDING' } }),
      prisma.banner.count({
        where: { status: 'ACTIVE', endsAt: { gte: todayStart, lt: todayEnd } },
      }),
      prisma.banner.aggregate({
        _sum: { price: true },
        where: { isPaid: true, createdAt: { gte: monthStart } },
      }),
      prisma.banner.aggregate({ _sum: { impressions: true } }),
    ]);

    return json({
      active,
      pending,
      expiringToday,
      revenueThisMonth: paidThisMonth._sum.price || 0,
      totalImpressions: impressionsAgg._sum.impressions || 0,
    });
  } catch (e: unknown) {
    return errorJson((e as Error).message, 500);
  }
}
