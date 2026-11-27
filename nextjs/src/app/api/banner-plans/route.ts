import { prisma } from '@/lib/prisma';
import { json } from '@/lib/api-auth';
import { AD_SLOTS, isAdSlot } from '@/lib/bannerAds';

export const dynamic = 'force-dynamic';

// GET /api/banner-plans — нийтэд нээлттэй үнийн жагсаалт (админы тохируулсан идэвхтэй багцууд)
export async function GET() {
  const now = new Date();
  const [plans, active] = await Promise.all([
    prisma.bannerPlan.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }] }).catch(() => []),
    prisma.banner.groupBy({
      by: ['slot'],
      where: { isPaid: true, status: { in: ['ACTIVE', 'PENDING', 'SCHEDULED'] }, endsAt: { gte: now } },
      _count: { _all: true },
    }).catch(() => [] as { slot: string; _count: { _all: number } }[]),
  ]);
  const used = new Map(active.map((a) => [a.slot, a._count._all]));
  return json({
    slots: AD_SLOTS,
    plans: plans
      .filter((p) => isAdSlot(p.slot))
      .map((p) => ({
        id: p.id,
        name: p.name,
        slot: p.slot,
        durationDays: p.durationDays,
        price: p.price,
        description: p.description,
        features: p.features,
        soldOut: p.maxPerPeriod != null && (used.get(p.slot) || 0) >= p.maxPerPeriod,
      })),
  });
}
