import { NextRequest } from "next/server";
import { getAuthUser } from '@/lib/api-auth';
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api-envelope";

const TIERS = [
  { name: "PLATINUM", min: 50000 },
  { name: "GOLD", min: 20000 },
  { name: "SILVER", min: 5000 },
  { name: "BRONZE", min: 0 },
] as const;

function getTier(lifetime: number) {
  return TIERS.find((t) => lifetime >= t.min)!.name;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    // Зөвхөн өөрийн (эсвэл админ) онооны мэдээллийг харна
    const me = getAuthUser(req);
    if (!me) return fail('Нэвтрэх шаардлагатай', 401);
    if (me.id !== userId) {
      const dbUser = await prisma.user.findUnique({ where: { id: me.id }, select: { role: true } });
      if (!['admin', 'superadmin', 'super_admin'].includes(dbUser?.role || me.role)) return fail('Эрх байхгүй', 403);
    }

    const account = await prisma.loyaltyAccount.upsert({
      where: { userId },
      create: { userId, balance: 0, lifetimeEarned: 0, tier: "BRONZE" },
      update: {},
    });

    const gold = await prisma.goldMembership.findUnique({ where: { userId } });

    return ok({
      ...account,
      // Alias for legacy consumers that read `points` instead of `balance`
      points: account.balance,
      tier: getTier(account.lifetimeEarned),
      goldMembership: gold
        ? {
            ...gold,
            isActive:
              gold.status !== "CANCELLED" && new Date(gold.endsAt) > new Date(),
          }
        : null,
    });
  } catch (error: unknown) {
    return fail((error instanceof Error ? error.message : String(error)), 500);
  }
}
