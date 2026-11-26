// ══════════════════════════════════════════════════════════════
// eseller.mn — Server-only Subscription Functions
// Uses Prisma — ONLY import this in API routes / server components
// ══════════════════════════════════════════════════════════════

import { prisma } from './prisma';
import { PLANS, type PlanLimits } from './subscription';

export async function getShopPlan(shopId: string) {
  const sub = await prisma.shopSubscription.findUnique({ where: { shopId } });

  const planKey = sub?.planKey ?? 'free';
  const plan = PLANS[planKey] ?? PLANS.free;

  const platformDefault = await getPlatformConfig('commission_rate');
  const commissionRate = sub?.commissionRate ?? plan.commissionRate ?? platformDefault ?? 5;

  const isActive = !sub || sub.status === 'active';
  const isExpired = sub?.expiresAt ? new Date(sub.expiresAt) < new Date() : false;

  return {
    planKey,
    plan,
    limits: plan.limits,
    commissionRate,
    expiresAt: sub?.expiresAt ?? null,
    isActive: isActive && !isExpired,
    billingCycle: sub?.billingCycle ?? 'monthly',
  };
}

export type LimitCheckResult = {
  allowed: boolean;
  reason?: string;
  currentPlan?: string;
  requiredPlan?: string;
  upgradeRequired?: boolean;
};

export async function checkShopLimit(
  shopId: string,
  action: 'product' | 'staff' | 'branch' | 'ai' | 'analytics' | 'custom_domain'
): Promise<LimitCheckResult> {
  const { planKey, limits, isActive } = await getShopPlan(shopId);

  if (!isActive) {
    return { allowed: false, reason: 'Таны subscription дууссан байна', upgradeRequired: true };
  }

  const planName = PLANS[planKey]?.name ?? planKey;

  if (action === 'product') {
    // Өмнө нь `userId: shopId` гэж тоолж байсан тул хязгаар хэзээ ч ажилладаггүй байв.
    const count = await prisma.product.count({ where: { shopId, isActive: true } });
    if (limits.maxProducts !== -1 && count >= limits.maxProducts) {
      return {
        allowed: false,
        reason: `${planName} багцад хамгийн ихдээ ${limits.maxProducts} бараа байршуулна`,
        currentPlan: planKey, requiredPlan: getNextPlan(planKey), upgradeRequired: true,
      };
    }
  }

  if (action === 'ai' && limits.aiCredits === 0) {
    return { allowed: false, reason: 'AI функц Standard болон дээш багцад боломжтой', currentPlan: planKey, requiredPlan: 'standard', upgradeRequired: true };
  }

  if (action === 'analytics' && !limits.analytics) {
    return { allowed: false, reason: 'Дэлгэрэнгүй аналитик Standard болон дээш багцад боломжтой', currentPlan: planKey, requiredPlan: 'standard', upgradeRequired: true };
  }

  if (action === 'custom_domain' && !limits.customDomain) {
    return { allowed: false, reason: 'Хувийн домайн Standard болон дээш багцад боломжтой', currentPlan: planKey, requiredPlan: 'standard', upgradeRequired: true };
  }

  return { allowed: true };
}

function getNextPlan(current: string): string {
  const order = ['free', 'standard', 'ultimate', 'ai_pro'];
  const idx = order.indexOf(current);
  return order[idx + 1] ?? 'ai_pro';
}

export async function getPlatformConfig(key: string): Promise<number | null> {
  try {
    const config = await prisma.platformConfig.findUnique({ where: { key } });
    return config ? parseFloat(config.value) : null;
  } catch {
    return null;
  }
}


/**
 * Эзэмшигч хэдэн дэлгүүр нээх эрхтэй вэ: эзэмшиж буй дэлгүүрүүдийн идэвхтэй
 * (дуусаагүй) багцуудын хамгийн их `maxShops`. Үнэгүй хэрэглэгч = 1 дэлгүүр.
 * 2 дахь дэлгүүр нь дор хаяж нэг дэлгүүр нь Стандарт (төлбөртэй) багцтай үед л нээгдэнэ.
 */
export async function getOwnerShopAllowance(userId: string) {
  const shops = await prisma.shop.findMany({
    where: { userId, isBlocked: false },
    select: { id: true, subscription: true },
  });
  const now = new Date();
  let maxShops = PLANS.free.limits.maxShops;
  let bestPlanKey = 'free';
  for (const shop of shops) {
    const sub = shop.subscription;
    if (!sub || sub.status !== 'active') continue;
    if (sub.expiresAt && new Date(sub.expiresAt) < now) continue;
    const limit = PLANS[sub.planKey]?.limits.maxShops ?? 1;
    if (limit === -1 || (maxShops !== -1 && limit > maxShops)) {
      maxShops = limit;
      bestPlanKey = sub.planKey;
    }
  }
  const used = shops.length;
  return {
    used,
    maxShops,
    planKey: bestPlanKey,
    canCreate: maxShops === -1 || used < maxShops,
  };
}
