// ══════════════════════════════════════════════════════════════
// Малчнаас шууд — серверийн туслах функцууд
// Мобайлын src/features/herder/types.ts гэрээтэй тааруулсан хэлбэрүүд.
// Мөнгөн дүн бүхэлдээ MNT (integer).
// ══════════════════════════════════════════════════════════════

import type { HerderShop, Order, Prisma, Product } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { HERDER_PROVINCES } from '@/lib/herder-delivery';

export const HERDER_COMMISSION_RATE = 0.02; // checkout-ийн платформын шимтгэлтэй ижил

export const APPLICATION_STATUSES = ['pending', 'under_review', 'approved', 'rejected'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const COLD_CHAIN_CATEGORIES = ['мах', 'сүү', 'бяслаг', 'аарц', 'тараг'];

const ADMIN_ROLES = ['admin', 'superadmin', 'super_admin'];

export function provinceName(code?: string | null): string {
  if (!code) return '';
  return HERDER_PROVINCES.find((p) => p.code === code)?.name || code;
}

export function findProvince(value?: string | null) {
  if (!value) return undefined;
  const v = String(value).trim();
  return HERDER_PROVINCES.find((p) => p.code === v.toUpperCase() || p.name === v);
}

/** Хуучин (status-гүй) бичлэгүүдийг идэвхтэй гэж үзнэ. */
export function isActiveHerder(h: Pick<HerderShop, 'status'>): boolean {
  return !h.status || h.status === 'approved';
}

/** Олон нийтэд харагдах малчдын шүүлт */
export const PUBLIC_HERDER_WHERE: Prisma.HerderShopWhereInput = {
  OR: [{ status: 'approved' }, { status: { isSet: false } }, { status: null }],
};

export function intMnt(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

// ── Нэвтэрсэн хэрэглэгчийн малчны дэлгүүр ─────────────────────

export async function getMyHerderShop(userId: string) {
  const shops = await prisma.shop.findMany({
    where: { userId },
    select: { id: true },
  });
  if (!shops.length) return null;
  return prisma.herderShop.findFirst({
    where: { shopId: { in: shops.map((s) => s.id) } },
    include: { shop: { select: { id: true, name: true, slug: true, logo: true, userId: true } } },
  });
}

// ── Координаторын хамрах хүрээ ───────────────────────────────

export type CoordinatorScope = { all: true } | { all: false; provinces: string[] };

export async function getCoordinatorScope(user: { id: string; role: string }): Promise<CoordinatorScope | null> {
  if (ADMIN_ROLES.includes(user.role)) return { all: true };
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
  if (dbUser && ADMIN_ROLES.includes(dbUser.role)) return { all: true };
  const coordinator = await prisma.herderCoordinator.findUnique({ where: { userId: user.id } });
  if (!coordinator || !coordinator.isActive) return null;
  return { all: false, provinces: coordinator.provinces };
}

export function scopeWhere(scope: CoordinatorScope): Prisma.HerderShopWhereInput {
  return scope.all ? {} : { province: { in: scope.provinces } };
}

export function inScope(scope: CoordinatorScope, province: string): boolean {
  return scope.all || scope.provinces.includes(province);
}

// ── Хэлбэр хувиргалт ─────────────────────────────────────────

type HerderStats = { rating?: number; orderCount?: number };

export function toHerderSummary(h: HerderShop, stats: HerderStats = {}) {
  return {
    id: h.id,
    herderName: h.herderName,
    province: h.province,
    provinceName: provinceName(h.province),
    district: h.district,
    isVerified: h.isVerified,
    rating: stats.rating ?? 0,
    orderCount: stats.orderCount ?? 0,
  };
}

function productMeta(p: Product): Record<string, unknown> {
  return p.metadata && typeof p.metadata === 'object' && !Array.isArray(p.metadata)
    ? (p.metadata as Record<string, unknown>)
    : {};
}

export function requiresColdChain(p: Product): boolean {
  const meta = productMeta(p);
  if (typeof meta.requiresColdChain === 'boolean') return meta.requiresColdChain;
  return COLD_CHAIN_CATEGORIES.includes(p.category || '');
}

export function toHerderProduct(p: Product, herder?: HerderShop | null, stats?: HerderStats) {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    salePrice: p.salePrice ?? null,
    images: p.images || [],
    category: p.category ?? null,
    description: p.description ?? '',
    stock: p.stock ?? 0,
    requiresColdChain: requiresColdChain(p),
    herder: herder ? toHerderSummary(herder, stats) : null,
  };
}

export function toMyHerderProduct(p: Product, herder: HerderShop) {
  return {
    ...toHerderProduct(p, herder),
    isActive: p.isActive,
    province: herder.province,
    soldCount: p.soldUnits ?? 0,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

/** Захиалгын вэб төлөв ↔ мобайл малчны төлөв */
export function toHerderOrderStatus(status: string): string {
  switch (status) {
    case 'pending':
      return 'pending';
    case 'confirmed':
      return 'confirmed';
    case 'preparing':
    case 'ready':
      return 'preparing';
    case 'delivering':
    case 'shipped':
      return 'shipped';
    case 'delivered':
    case 'completed':
      return 'delivered';
    case 'cancelled':
    case 'refunded':
      return 'cancelled';
    default:
      return 'pending';
  }
}

/** Мобайлаас ирсэн төлөвийг вэбийн Order.status руу */
export function fromHerderOrderStatus(status: string): string | null {
  switch (status) {
    case 'confirmed':
      return 'confirmed';
    case 'preparing':
      return 'preparing';
    case 'shipped':
      return 'delivering';
    case 'delivered':
      return 'delivered';
    case 'cancelled':
      return 'cancelled';
    default:
      return null;
  }
}

/** Малчин өөрөө хийх боломжтой шилжилтүүд (вэбийн төлөвөөр) */
export const HERDER_TRANSITIONS: Record<string, string[]> = {
  confirmed: ['preparing', 'cancelled'],
  preparing: ['delivering', 'cancelled'],
  ready: ['delivering', 'cancelled'],
  delivering: ['delivered'],
};

export function paymentStatus(o: Order): 'pending' | 'paid' | 'failed' | 'refunded' {
  if (o.refundedAt || o.escrowStatus === 'REFUNDED') return 'refunded';
  if (o.status === 'pending') return 'pending';
  if (o.status === 'cancelled' && !o.escrowStatus) return 'failed';
  return 'paid';
}

type OrderItemJson = { productId?: string; name?: string; price?: number; quantity?: number; qty?: number };

export function toMyHerderOrder(
  o: Order,
  buyer: { id: string; name: string; phone?: string | null } | null,
  coldChain: boolean,
) {
  const items = ((o.items || []) as unknown as OrderItemJson[]).map((it) => {
    const price = Math.round(Number(it.price) || 0);
    const quantity = Math.max(1, Math.round(Number(it.quantity ?? it.qty) || 1));
    return { product: String(it.productId || ''), name: String(it.name || 'Бараа'), price, quantity, subtotal: price * quantity };
  });
  const subtotal = items.reduce((sum, it) => sum + it.subtotal, 0);
  const total = Math.round(Number(o.total) || subtotal);
  const history = ((o.statusHistory || []) as unknown as Array<{ status?: string; timestamp?: string; at?: string; note?: string; byRole?: string }>)
    .filter((h) => h && h.status)
    .map((h) => ({
      status: toHerderOrderStatus(String(h.status)),
      at: String(h.at || h.timestamp || o.updatedAt.toISOString()),
      ...(h.byRole ? { byRole: h.byRole } : {}),
      ...(h.note ? { note: h.note } : {}),
    }));
  const delivered = history.find((h) => h.status === 'delivered');
  const shipped = history.find((h) => h.status === 'shipped');
  return {
    _id: o.id,
    orderNumber: o.orderNumber || o.id.slice(-6).toUpperCase(),
    buyer: buyer ? { _id: buyer.id, name: buyer.name, ...(buyer.phone ? { phone: buyer.phone } : {}) } : null,
    items,
    subtotal,
    deliveryFee: Math.max(0, total - subtotal),
    total,
    status: toHerderOrderStatus(o.status),
    statusHistory: history,
    payment: {
      method: o.paymentMethod || 'qpay',
      status: paymentStatus(o),
    },
    delivery: {
      address: o.deliveryAddress ? { street: o.deliveryAddress } : undefined,
      phone: o.delivery?.phone || undefined,
      requiresColdChain: coldChain,
      shippedAt: shipped?.at,
      deliveredAt: delivered?.at || o.confirmedAt?.toISOString(),
      trackingCode: o.trackingCode || undefined,
    },
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

// ── Үнэлгээ, захиалгын статистик ─────────────────────────────

export async function herderStats(herderShopIds: string[], shopIds: string[]) {
  const [ratings, orders] = await Promise.all([
    prisma.herderReview.groupBy({
      by: ['herderShopId'],
      where: { herderShopId: { in: herderShopIds }, isHidden: false },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.order.groupBy({
      by: ['shopId'],
      where: { shopId: { in: shopIds }, status: { notIn: ['pending', 'cancelled'] } },
      _count: { _all: true },
    }),
  ]);
  return {
    rating: new Map(ratings.map((r) => [r.herderShopId, { avg: Math.round((r._avg.rating || 0) * 10) / 10, count: r._count._all }])),
    orders: new Map(orders.map((o) => [o.shopId || '', o._count._all])),
  };
}

export function pageParams(sp: URLSearchParams, maxLimit = 50) {
  const page = Math.max(1, Math.floor(Number(sp.get('page')) || 1));
  const limit = Math.min(maxLimit, Math.max(1, Math.floor(Number(sp.get('limit')) || 20)));
  return { page, limit, skip: (page - 1) * limit };
}

export function pagesFor(total: number, limit: number) {
  return Math.ceil(total / limit);
}
