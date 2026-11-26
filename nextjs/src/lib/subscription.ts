// ══════════════════════════════════════════════════════════════
// eseller.mn — Subscription / Package System
// Client-safe exports (no prisma imports)
// Server-only DB functions are in subscription-server.ts
// ══════════════════════════════════════════════════════════════

export type PlanId = 'free' | 'standard' | 'ultimate' | 'ai_pro';

export interface PlanLimits {
  maxProducts: number;
  maxStaff: number;
  maxBranches: number;
  /** Нэг эзэмшигчийн нээж болох дэлгүүрийн тоо (-1 = хязгааргүй) */
  maxShops: number;
  maxCategories: number;
  maxBrands: number;
  maxStorage: number;
  aiCredits: number;
  customDomain: boolean;
  removeBranding: boolean;
  analytics: boolean;
  prioritySupport: boolean;
  blogPosts: number;
  promoCodesLimit: number;
  giftCards: boolean;
  multiLanguage: boolean;
  apiAccess: boolean;
  exportData: boolean;
  seoTools: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  nameEn: string;
  price: number;
  yearlyPrice: number;
  description: string;
  badge?: string;
  color: string;
  commissionRate: number;
  limits: PlanLimits;
  features: string[];
}

export const PLANS: Record<string, Plan> = {
  free: {
    id: 'free', name: 'Үнэгүй', nameEn: 'Free', price: 0, yearlyPrice: 0,
    description: 'Эхлэгчдэд зориулсан үнэгүй багц', color: '#94A3B8', commissionRate: 8,
    limits: {
      maxProducts: 20, maxStaff: 1, maxShops: 1, maxBranches: 1, maxCategories: 5, maxBrands: 3,
      maxStorage: 500, aiCredits: 0, customDomain: false, removeBranding: false,
      analytics: false, prioritySupport: false, blogPosts: 3, promoCodesLimit: 2,
      giftCards: false, multiLanguage: false, apiAccess: false, exportData: false, seoTools: false,
    },
    features: ['1 дэлгүүр', '20 бараа хүртэл', '1 ажилтан', '500MB хадгалах зай', 'eseller.mn субдомайн', 'QPay төлбөр'],
  },
  standard: {
    id: 'standard', name: 'Стандарт', nameEn: 'Standard', price: 29900, yearlyPrice: 299000,
    description: 'Жижиг, дунд бизнест тохиромжтой', badge: 'Түгээмэл', color: '#6366F1', commissionRate: 5,
    limits: {
      maxProducts: 500, maxStaff: 5, maxShops: 2, maxBranches: 3, maxCategories: 30, maxBrands: 20,
      maxStorage: 5000, aiCredits: 50, customDomain: true, removeBranding: true,
      analytics: true, prioritySupport: false, blogPosts: 50, promoCodesLimit: 20,
      giftCards: true, multiLanguage: false, apiAccess: false, exportData: true, seoTools: true,
    },
    features: ['2 дэлгүүр', '500 бараа', '5 ажилтан', '3 салбар', 'Хувийн домайн', '50 AI кредит/сар', 'SEO хэрэгсэл'],
  },
  ultimate: {
    id: 'ultimate', name: 'Алтимэйт', nameEn: 'Ultimate', price: 59900, yearlyPrice: 599000,
    description: 'Том бизнес, enterprise шийдэл', badge: 'Хамгийн сайн', color: '#D97706', commissionRate: 3,
    limits: {
      maxProducts: 5000, maxStaff: 20, maxShops: 5, maxBranches: 10, maxCategories: 100, maxBrands: 100,
      maxStorage: 50000, aiCredits: 200, customDomain: true, removeBranding: true,
      analytics: true, prioritySupport: true, blogPosts: -1, promoCodesLimit: -1,
      giftCards: true, multiLanguage: true, apiAccess: true, exportData: true, seoTools: true,
    },
    features: ['5 дэлгүүр', '5,000 бараа', '20 ажилтан', '10 салбар', '200 AI кредит/сар', 'API хандалт', 'Тэргүүлэх дэмжлэг'],
  },
  ai_pro: {
    id: 'ai_pro', name: 'AI Pro', nameEn: 'AI Pro', price: 99900, yearlyPrice: 999000,
    description: 'AI-д суурилсан бүрэн автоматжуулалт', badge: 'AI Хүчирхэг', color: '#EC4899', commissionRate: 2,
    limits: {
      maxProducts: -1, maxStaff: -1, maxShops: 10, maxBranches: -1, maxCategories: -1, maxBrands: -1,
      maxStorage: 200000, aiCredits: -1, customDomain: true, removeBranding: true,
      analytics: true, prioritySupport: true, blogPosts: -1, promoCodesLimit: -1,
      giftCards: true, multiLanguage: true, apiAccess: true, exportData: true, seoTools: true,
    },
    features: ['10 дэлгүүр', 'Хязгааргүй бараа', 'Хязгааргүй AI кредит', '200GB хадгалах зай', '24/7 Дэмжлэг'],
  },
};

export const PLANS_LIST = Object.values(PLANS);

// ══════ Client-side helpers (localStorage-based, backwards compatible) ══════

const SUB_KEY = 'eseller_subscription';

export interface SubscriptionState {
  planId: PlanId;
  startDate: string;
  endDate: string;
  aiCreditsUsed: number;
  productsCount: number;
  staffCount: number;
  branchesCount: number;
  storageUsed: number;
}

export function getSubscription(): SubscriptionState {
  if (typeof window === 'undefined') return getDefaultSubscription();
  try {
    const raw = localStorage.getItem(SUB_KEY);
    return raw ? JSON.parse(raw) : getDefaultSubscription();
  } catch {
    return getDefaultSubscription();
  }
}

function getDefaultSubscription(): SubscriptionState {
  return {
    planId: 'free', startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    aiCreditsUsed: 0, productsCount: 0, staffCount: 1, branchesCount: 1, storageUsed: 0,
  };
}

export function saveSubscription(sub: SubscriptionState) {
  if (typeof window !== 'undefined') localStorage.setItem(SUB_KEY, JSON.stringify(sub));
}

export function getPlan(id: PlanId): Plan {
  return PLANS[id] || PLANS.free;
}

export function getCurrentPlan(): Plan {
  return getPlan(getSubscription().planId);
}

export type CheckResult = { allowed: boolean; message?: string; current: number; limit: number };

export function checkLimit(field: keyof PlanLimits, currentCount: number): CheckResult {
  const plan = getCurrentPlan();
  const limit = plan.limits[field];
  if (typeof limit === 'boolean') {
    return { allowed: limit, current: currentCount, limit: limit ? 1 : 0, message: limit ? undefined : `${plan.name} багцад энэ боломж байхгүй. Багцаа шинэчлэнэ үү.` };
  }
  const numLimit = limit as number;
  if (numLimit === -1) return { allowed: true, current: currentCount, limit: -1 };
  if (currentCount >= numLimit) {
    return { allowed: false, current: currentCount, limit: numLimit, message: `${plan.name} багцын хязгаарт хүрлээ (${currentCount}/${numLimit}). Багцаа шинэчлэнэ үү.` };
  }
  return { allowed: true, current: currentCount, limit: numLimit };
}

export function canAddProduct(): CheckResult { return checkLimit('maxProducts', getSubscription().productsCount); }
export function canAddStaff(): CheckResult { return checkLimit('maxStaff', getSubscription().staffCount); }
export function canUseAI(): CheckResult { return checkLimit('aiCredits', getSubscription().aiCreditsUsed); }
export function canAddBranch(): CheckResult { return checkLimit('maxBranches', getSubscription().branchesCount); }

export function getRemainingDays(expiresAt?: string | null): number {
  const end = expiresAt ? new Date(expiresAt) : new Date(getSubscription().endDate);
  const diff = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export function getUsagePercent(field: 'products' | 'staff' | 'storage' | 'aiCredits'): number {
  const sub = getSubscription();
  const plan = getCurrentPlan();
  const map: Record<string, [number, number]> = {
    products: [sub.productsCount, plan.limits.maxProducts],
    staff: [sub.staffCount, plan.limits.maxStaff],
    storage: [sub.storageUsed, plan.limits.maxStorage],
    aiCredits: [sub.aiCreditsUsed, plan.limits.aiCredits],
  };
  const [current, limit] = map[field] || [0, 1];
  // -1 = хязгааргүй. Өмнө нь 0 буцааж байсан тул 0% ашиглалт "Хязгааргүй" гэж,
  // limit=0 (жишээ нь үнэгүй багцын AI кредит) үед 0/0 = "NaN%" гэж харагдаж байв.
  if (limit === -1) return -1;
  if (!limit || limit <= 0) return current > 0 ? 100 : 0;
  return Math.min(100, Math.round((current / limit) * 100));
}

export function getPlanById(id: string): Plan { return PLANS[id] ?? PLANS.free; }
