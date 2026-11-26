// ══════════════════════════════════════════════════════════════
// Server-side order pricing — never trust prices/totals from the client.
// Shared by /api/orders and /api/checkout/create-invoice.
// ══════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';
import { getEffectiveUnitPrice } from '@/lib/utils';
import { isSellableProduct, normalizePublicPricing } from '@/lib/product-visibility';

import {
  FREE_DELIVERY_THRESHOLD,
  DELIVERY_FEE,
  POINTS_TO_MNT,
  MAX_REDEEM_PERCENT,
  MAX_REDEEM_POINTS,
} from '@/lib/order-pricing-constants';

export { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE, POINTS_TO_MNT, MAX_REDEEM_PERCENT, MAX_REDEEM_POINTS };

export type PricedOrderItem = {
  productId: string;
  product: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  shopId: string | null;
};

export type PricedOrder = {
  items: PricedOrderItem[];
  subtotal: number;
  deliveryFee: number;
  couponDiscount: number;
  couponCode: string | null;
  pointsDiscount: number;
  loyaltyPoints: number;
  total: number;
};

export class OrderPricingError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const OBJECT_ID = /^[a-f\d]{24}$/i;

function itemProductId(item: Record<string, unknown>): string {
  const raw = item.productId ?? item.product ?? item.id ?? item._id;
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    return String(obj.id ?? obj._id ?? '');
  }
  return typeof raw === 'string' ? raw : '';
}

function itemQuantity(item: Record<string, unknown>): number {
  const q = Math.floor(Number(item.quantity ?? item.qty ?? 1));
  return Number.isFinite(q) && q > 0 ? Math.min(q, 999) : 1;
}

async function couponDiscountFor(code: string | null, subtotal: number) {
  if (!code) return { discount: 0, code: null as string | null };
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon || !coupon.isActive) throw new OrderPricingError('Купон хүчингүй байна');
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) throw new OrderPricingError('Купон дууссан');
  if (coupon.expiresAt && new Date() > coupon.expiresAt) throw new OrderPricingError('Купон хугацаа дууссан');
  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    throw new OrderPricingError(`Купоны доод дүн ${coupon.minOrderAmount.toLocaleString()}₮`);
  }
  let discount = coupon.discountType === 'PERCENT'
    ? subtotal * (coupon.discountValue / 100)
    : coupon.discountValue;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  return { discount: Math.max(0, Math.round(discount)), code: coupon.code };
}

/**
 * Re-price an order from the database. Throws OrderPricingError when an item
 * is missing, hidden or out of stock.
 */
export async function priceOrder(input: {
  items: unknown;
  couponCode?: unknown;
  loyaltyPoints?: unknown;
}): Promise<PricedOrder> {
  const rawItems = Array.isArray(input.items)
    ? input.items.filter((i): i is Record<string, unknown> => Boolean(i) && typeof i === 'object')
    : [];
  if (rawItems.length === 0) throw new OrderPricingError('Захиалгын бараа шаардлагатай');

  const ids = rawItems.map(itemProductId);
  if (ids.some((id) => !OBJECT_ID.test(id))) {
    throw new OrderPricingError('Сагсанд худалдах боломжгүй бараа байна. Сагсаа шинэчилнэ үү.');
  }

  const products = await prisma.product.findMany({ where: { id: { in: ids } } });
  const byId = new Map(products.map((p) => [p.id, p]));

  const items: PricedOrderItem[] = rawItems.map((raw, idx) => {
    const product = byId.get(ids[idx]);
    if (!product || !isSellableProduct(product)) {
      throw new OrderPricingError('Зарим бараа худалдаанаас гарсан байна. Сагсаа шинэчилнэ үү.');
    }
    const quantity = itemQuantity(raw);
    if (typeof product.stock === 'number' && product.stock > 0 && quantity > product.stock) {
      throw new OrderPricingError(`"${product.name}" үлдэгдэл ${product.stock} ширхэг байна`);
    }
    const priced = normalizePublicPricing(product);
    const images = Array.isArray(product.images) ? (product.images as unknown[]) : [];
    return {
      productId: product.id,
      product: product.id,
      name: product.name,
      price: getEffectiveUnitPrice(priced.price, priced.salePrice),
      quantity,
      image: typeof images[0] === 'string' ? (images[0] as string) : null,
      shopId: product.shopId ?? null,
    };
  });

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;

  const coupon = await couponDiscountFor(
    typeof input.couponCode === 'string' && input.couponCode.trim() ? input.couponCode.trim() : null,
    subtotal,
  );

  const requestedPoints = Math.max(0, Math.floor(Number(input.loyaltyPoints) || 0));
  const maxPoints = Math.min(
    MAX_REDEEM_POINTS,
    Math.floor(((subtotal + deliveryFee) * MAX_REDEEM_PERCENT) / POINTS_TO_MNT),
  );
  const loyaltyPoints = Math.min(requestedPoints, maxPoints);
  const pointsDiscount = loyaltyPoints * POINTS_TO_MNT;

  const total = Math.max(0, subtotal + deliveryFee - coupon.discount - pointsDiscount);

  return {
    items,
    subtotal,
    deliveryFee,
    couponDiscount: coupon.discount,
    couponCode: coupon.code,
    pointsDiscount,
    loyaltyPoints,
    total,
  };
}
