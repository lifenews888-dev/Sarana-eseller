import { NextRequest } from 'next/server';
import { json, getAuthUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/affiliate/leaderboard?offset=0|1|2 — сарын шилдэг борлуулагчид (линкээр зарсан захиалгаар)
export async function GET(req: NextRequest) {
  const offset = Math.min(11, Math.max(0, Math.floor(Number(req.nextUrl.searchParams.get('offset')) || 0)));
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  const to = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);

  const groups = await prisma.order.groupBy({
    by: ['sellerProfileId'],
    where: {
      sellerProfileId: { not: null },
      createdAt: { gte: from, lt: to },
      status: { notIn: ['pending', 'cancelled', 'refunded'] },
    },
    _count: { _all: true },
    _sum: { total: true, affiliateAmount: true },
  });

  const top = groups
    .filter((g) => g.sellerProfileId)
    .sort((a, b) => (b._sum.total || 0) - (a._sum.total || 0))
    .slice(0, 50);

  const profiles = await prisma.sellerProfile.findMany({
    where: { id: { in: top.map((g) => g.sellerProfileId as string) }, isActive: true },
    select: { id: true, userId: true, displayName: true, username: true, avatar: true, isVerified: true },
  });
  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const me = getAuthUser(req);

  const leaderboard = top
    .map((g) => {
      const p = profileMap.get(g.sellerProfileId as string);
      if (!p) return null;
      return {
        id: p.id,
        name: p.displayName || p.username,
        username: p.username,
        avatar: p.avatar,
        isVerified: p.isVerified,
        totalSales: g._count._all,
        totalRevenue: Math.round(g._sum.total || 0),
        earned: Math.round(g._sum.affiliateAmount || 0),
        isMe: !!me && me.id === p.userId,
      };
    })
    .filter(Boolean)
    .map((row, i) => ({ ...row!, rank: i + 1 }));

  return json({
    leaderboard,
    period: { from: from.toISOString(), to: to.toISOString(), offset },
  });
}
