import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isCronAuthorized } from '@/lib/cron-auth';

const PLAN_DURATIONS: Record<string, { duration: number; price: number }> = {
  MONTHLY: { duration: 30, price: 19900 },
  QUARTERLY: { duration: 90, price: 49900 },
  ANNUAL: { duration: 365, price: 149900 },
};

export async function GET(req: NextRequest) {
  // Зөвхөн Vercel cron (CRON_SECRET) дуудна — өмнө нь хэн ч гаднаас ажиллуулах боломжтой байв
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const now = new Date();

    // 1. Expire old points (where expiresAt passed and points still positive)
    const expiredTxns = await prisma.loyaltyTransaction.findMany({
      where: { expiresAt: { lt: now }, points: { gt: 0 } },
      include: { account: true },
    });

    let expiredCount = 0;
    for (const txn of expiredTxns) {
      if (!txn.account || txn.account.balance <= 0) continue;
      const expireAmount = Math.min(txn.points, txn.account.balance);
      if (expireAmount <= 0) continue;

      await prisma.loyaltyAccount.update({
        where: { id: txn.accountId },
        data: { balance: { decrement: expireAmount } },
      });
      await prisma.loyaltyTransaction.update({
        where: { id: txn.id },
        data: { points: 0 },
      });
      expiredCount++;
    }

    // 2. Auto-renew gold memberships expiring within next day
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const renewals = await prisma.goldMembership.findMany({
      where: { endsAt: { lte: tomorrow }, autoRenew: true, status: 'ACTIVE' },
    });

    let renewedCount = 0;
    for (const m of renewals) {
      const planConfig = PLAN_DURATIONS[m.plan];
      if (!planConfig) continue;

      const newEndsAt = new Date(m.endsAt.getTime() + planConfig.duration * 24 * 60 * 60 * 1000);

      await prisma.goldMembership.update({
        where: { id: m.id },
        data: { endsAt: newEndsAt },
      });

      await prisma.membershipPayment.create({
        data: {
          membershipId: m.id,
          plan: m.plan,
          amount: planConfig.price,
          method: 'auto-renew',
          refId: `auto-${m.id}-${Date.now()}`,
        },
      });
      renewedCount++;
    }

    return NextResponse.json({
      expiredPoints: expiredCount,
      renewedMemberships: renewedCount,
      timestamp: now.toISOString(),
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
