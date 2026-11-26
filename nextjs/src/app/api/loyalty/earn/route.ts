import { requireAdmin } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/lib/api-envelope';

const TIERS = [
  { name: 'PLATINUM', min: 50000 },
  { name: 'GOLD', min: 20000 },
  { name: 'SILVER', min: 5000 },
  { name: 'BRONZE', min: 0 },
] as const;

function getTier(lifetime: number) {
  return TIERS.find((t) => lifetime >= t.min)!.name;
}

export async function POST(req: NextRequest) {
  // Аюулгүй байдал: зөвхөн админ (өмнө нь нэвтрэлтгүй дуудагдах боломжтой байсан)
  const adminUser = requireAdmin(req);
  if (adminUser instanceof NextResponse) return adminUser;
  try {
    const { userId, type, points, description, refType, refId } = await req.json();

    if (!userId || !type || !points || points <= 0) {
      return fail('userId, type, and positive points required', 400);
    }

    // Upsert account first
    const account = await prisma.loyaltyAccount.upsert({
      where: { userId },
      create: { userId, balance: points, lifetimeEarned: points, tier: getTier(points) },
      update: { balance: { increment: points }, lifetimeEarned: { increment: points } },
    });

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const transaction = await prisma.loyaltyTransaction.create({
      data: { accountId: account.id, type, points, description: description || `Earned ${points} points`, refType, refId, expiresAt },
    });

    const newTier = getTier(account.lifetimeEarned);
    if (newTier !== account.tier) {
      await prisma.loyaltyAccount.update({ where: { userId }, data: { tier: newTier } });
    }

    return ok({ transaction, balance: account.balance, tier: newTier });
  } catch (error: unknown) {
    return fail((error as Error).message, 500);
  }
}
