import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireAuth } from '@/lib/api-auth';

const DAY = 24 * 60 * 60 * 1000;

// GET /api/affiliate/earnings — борлуулагчийн БОДИТ орлого (SellerCommission + холбоосын товшилт).
// Өгөгдөл байхгүй бол 0 буцаана; жишээ тоо хэзээ ч буцаахгүй.
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;

  try {
    const [profile, links] = await Promise.all([
      prisma.sellerProfile.findUnique({ where: { userId: auth.id }, select: { id: true, username: true, commissionRate: true } }),
      prisma.affiliateLink.findMany({ where: { affiliateId: auth.id }, select: { clicks: true } }),
    ]);
    const commissions = profile
      ? await prisma.sellerCommission.findMany({
          where: { sellerProfileId: profile.id, status: { not: 'cancelled' } },
          orderBy: { createdAt: 'desc' },
          take: 500,
          select: { id: true, orderId: true, commissionAmount: true, status: true, createdAt: true },
        })
      : [];

    const now = Date.now();
    const totalEarnings = commissions.reduce((s, c) => s + c.commissionAmount, 0);
    const monthlyEarnings = commissions.filter((c) => now - c.createdAt.getTime() < 30 * DAY).reduce((s, c) => s + c.commissionAmount, 0);
    const pendingEarnings = commissions.filter((c) => c.status !== 'paid').reduce((s, c) => s + c.commissionAmount, 0);
    const paidEarnings = totalEarnings - pendingEarnings;
    const totalClicks = links.reduce((s, l) => s + l.clicks, 0);
    const totalConversions = commissions.length;
    const conversionRate = totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 1000) / 10 : 0;

    // Сүүлийн 7 хоног (өнөөдөр сүүлд)
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, i) => new Date(start.getTime() - (6 - i) * DAY));
    const sparkData = days.map((d) => commissions
      .filter((c) => c.createdAt.getTime() >= d.getTime() && c.createdAt.getTime() < d.getTime() + DAY)
      .reduce((s, c) => s + c.commissionAmount, 0));

    const recent = commissions.slice(0, 10);
    const orders = recent.length
      ? await prisma.order.findMany({ where: { id: { in: recent.map((c) => c.orderId) } }, select: { id: true, orderNumber: true, items: true } })
      : [];
    const nameOf = (orderId: string) => {
      const o = orders.find((x) => x.id === orderId);
      const first = Array.isArray(o?.items) ? (o!.items[0] as { name?: string } | undefined) : undefined;
      return first?.name || o?.orderNumber || 'Захиалга';
    };

    return json({
      totalEarnings,
      monthlyEarnings,
      pendingEarnings,
      paidEarnings,
      totalClicks,
      totalConversions,
      conversionRate,
      commissionRate: profile?.commissionRate ?? 10,
      username: profile?.username ?? null,
      sparkData,
      sparkDays: days.map((d) => d.getDay()),
      earnings: recent.map((c) => ({ _id: c.id, productName: nameOf(c.orderId), amount: c.commissionAmount, status: c.status, createdAt: c.createdAt })),
    });
  } catch {
    return errorJson('Орлогын мэдээлэл ачаалж чадсангүй', 500);
  }
}
