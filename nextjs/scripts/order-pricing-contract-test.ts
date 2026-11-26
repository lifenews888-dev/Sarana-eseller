/**
 * Server-side order pricing contract — client-supplied price/total must be ignored.
 * Run: npx tsx scripts/order-pricing-contract-test.ts
 */
import assert from 'node:assert/strict';

const TV = { id: 'a'.repeat(24), name: 'Samsung Smart TV 55"', description: '4K', price: 1_650_000, salePrice: 1_450_000, stock: 100, images: [], isActive: true, isDemo: false, shopId: null };
const SHOE = { id: 'b'.repeat(24), name: 'Nike Air Max 270', description: '', price: 320_000, salePrice: 280_000, stock: 2, images: [], isActive: true, isDemo: false, shopId: null };
const CHEAP = { id: 'c'.repeat(24), name: 'Үзэг', description: '', price: 2_000, salePrice: null, stock: 0, images: [], isActive: true, isDemo: false, shopId: null };
const TEST = { id: 'd'.repeat(24), name: 'E2E Test Product', description: '', price: 25_000, salePrice: null, stock: 5, images: [], isActive: true, isDemo: false, shopId: null };
const rows = [TV, SHOE, CHEAP, TEST];

// DB-гүйгээр ажиллуулахын тулд @/lib/prisma-ийн global singleton-ийг хуурамчаар солино.
(globalThis as unknown as { prisma: unknown }).prisma = {
  product: {
    findMany: async ({ where }: { where: { id: { in: string[] } } }) => rows.filter((r) => where.id.in.includes(r.id)),
  },
  coupon: {
    findUnique: async ({ where }: { where: { code: string } }) =>
      where.code === 'SALE10'
        ? { code: 'SALE10', isActive: true, usageLimit: null, usageCount: 0, expiresAt: null, minOrderAmount: 0, discountType: 'PERCENT', discountValue: 10, maxDiscount: 50_000 }
        : null,
  },
};

type Mods = {
  priceOrder: typeof import('@/lib/order-pricing').priceOrder;
  OrderPricingError: typeof import('@/lib/order-pricing').OrderPricingError;
  isPublicShopName: typeof import('@/lib/product-visibility').isPublicShopName;
};
let priceOrder: Mods['priceOrder'];
let OrderPricingError: Mods['OrderPricingError'];
let isPublicShopName: Mods['isPublicShopName'];

async function rejects(promise: Promise<unknown>, pattern: RegExp) {
  await assert.rejects(promise, (e: unknown) => e instanceof OrderPricingError && pattern.test(e.message));
}

async function main() {
  ({ priceOrder, OrderPricingError } = await import('@/lib/order-pricing'));
  ({ isPublicShopName } = await import('@/lib/product-visibility'));
  // 1. Client sends price 1₮ and total 1₮ → server uses sale price
  const a = await priceOrder({ items: [{ product: TV.id, price: 1, quantity: 2 }], loyaltyPoints: 0 });
  assert.equal(a.items[0].price, 1_450_000);
  assert.equal(a.subtotal, 2_900_000);
  assert.equal(a.deliveryFee, 0);
  assert.equal(a.total, 2_900_000);

  // 2. Sale price applied (the cart bug: 320k vs 280k)
  const b = await priceOrder({ items: [{ productId: SHOE.id, qty: 1 }] });
  assert.equal(b.total, 280_000);

  // 3. Delivery fee below threshold
  const c = await priceOrder({ items: [{ id: CHEAP.id, quantity: 3 }] });
  assert.equal(c.subtotal, 6_000);
  assert.equal(c.deliveryFee, 3_000);
  assert.equal(c.total, 9_000);

  // 4. Points capped at 30% and 1500 points
  const d = await priceOrder({ items: [{ product: CHEAP.id, quantity: 3 }], loyaltyPoints: 99_999 });
  assert.equal(d.loyaltyPoints, Math.floor((9_000 * 0.3) / 5));
  assert.equal(d.total, 9_000 - d.pointsDiscount);
  const d2 = await priceOrder({ items: [{ product: TV.id }], loyaltyPoints: 99_999 });
  assert.equal(d2.loyaltyPoints, 1500);

  // 5. Coupon validated server-side, capped by maxDiscount
  const e = await priceOrder({ items: [{ product: TV.id }], couponCode: 'sale10' });
  assert.equal(e.couponDiscount, 50_000);
  await rejects(priceOrder({ items: [{ product: TV.id }], couponCode: 'FAKE' }), /Купон/);

  // 6. Stock, unknown/test/demo items rejected
  await rejects(priceOrder({ items: [{ product: SHOE.id, quantity: 3 }] }), /үлдэгдэл/);
  await rejects(priceOrder({ items: [{ product: TEST.id }] }), /худалдаанаас/);
  await rejects(priceOrder({ items: [{ product: 'e'.repeat(24) }] }), /худалдаанаас/);
  await rejects(priceOrder({ items: [{ product: 'demo-1' }] }), /Сагсаа шинэчилнэ/);
  await rejects(priceOrder({ items: [] }), /шаардлагатай/);

  // 7. Shop name guard
  assert.equal(isPublicShopName('Test Shop 1785222791'), false);
  assert.equal(isPublicShopName('Дижитал Shop 1785218241'), false);
  assert.equal(isPublicShopName('E2E дэлгүүр'), false);
  assert.equal(isPublicShopName('Тест дэлгүүр'), false);
  assert.equal(isPublicShopName('Говь малгай'), true);
  assert.equal(isPublicShopName('AURORA 🎀'), true);
  assert.equal(isPublicShopName('Sara fanshion&Mom'), true);
  assert.equal(isPublicShopName('Contest Store'), true);

  console.log('order-pricing contract: all checks passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
