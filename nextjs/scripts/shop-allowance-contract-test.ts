/**
 * Олон дэлгүүрийн эрх: үнэгүй = 1, Стандарт = 2, Алтимэйт = 5; хугацаа дууссан багц тооцогдохгүй.
 * Run: npx tsx scripts/shop-allowance-contract-test.ts
 */
import assert from 'node:assert/strict';

type Sub = { planKey: string; status: string; expiresAt: Date | null } | null;
let shops: { id: string; subscription: Sub }[] = [];
(globalThis as unknown as { prisma: unknown }).prisma = {
  shop: { findMany: async () => shops },
  product: { count: async () => 0 },
  shopSubscription: { findUnique: async () => null },
  platformConfig: { findUnique: async () => null },
};

async function main() {
  const { getOwnerShopAllowance } = await import('@/lib/subscription-server');
  const future = new Date(Date.now() + 86400000);
  const past = new Date(Date.now() - 86400000);

  shops = [];
  assert.deepEqual(await getOwnerShopAllowance('u'), { used: 0, maxShops: 1, planKey: 'free', canCreate: true });

  shops = [{ id: 'a', subscription: null }];
  let r = await getOwnerShopAllowance('u');
  assert.equal(r.canCreate, false, 'үнэгүй хэрэглэгч 2 дахь дэлгүүр нээх ёсгүй');

  shops = [{ id: 'a', subscription: { planKey: 'standard', status: 'active', expiresAt: future } }];
  r = await getOwnerShopAllowance('u');
  assert.equal(r.maxShops, 2); assert.equal(r.canCreate, true);

  shops.push({ id: 'b', subscription: null });
  r = await getOwnerShopAllowance('u');
  assert.equal(r.canCreate, false, 'Стандарт = 2 дэлгүүр');

  shops = [{ id: 'a', subscription: { planKey: 'ultimate', status: 'active', expiresAt: past } }];
  r = await getOwnerShopAllowance('u');
  assert.equal(r.maxShops, 1, 'хугацаа дууссан багц тооцогдохгүй');

  shops = [{ id: 'a', subscription: { planKey: 'ultimate', status: 'cancelled', expiresAt: null } }];
  assert.equal((await getOwnerShopAllowance('u')).maxShops, 1);

  shops = [{ id: 'a', subscription: { planKey: 'ultimate', status: 'active', expiresAt: null } }, { id: 'b', subscription: null }];
  r = await getOwnerShopAllowance('u');
  assert.equal(r.maxShops, 5); assert.equal(r.canCreate, true);

  console.log('shop-allowance contract: all checks passed');
}
main().catch((e) => { console.error(e); process.exit(1); });
