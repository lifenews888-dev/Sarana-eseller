import { prisma } from '../src/lib/prisma';

const BASE = process.env.E2E_BASE_URL || 'https://eseller.mn';

async function runE2ETest() {
  console.log(`\n🧪 eseller.mn END-TO-END ТЕСТ — ${BASE}\n`);
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`❌ ${name}: ${msg}`);
      failed++;
    }
  }

  async function loginAs(phone: string): Promise<string | null> {
    try {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: 'test1234' }),
      });
      const d = await res.json();
      return d.token || d.data?.token || null;
    } catch {
      return null;
    }
  }

  const pickArray = (d: unknown): unknown[] => {
    if (Array.isArray(d)) return d;
    if (d && typeof d === 'object') {
      const o = d as Record<string, unknown>;
      if (Array.isArray(o.orders)) return o.orders;
      if (Array.isArray(o.items)) return o.items;
      if (Array.isArray(o.products)) return o.products;
      if (Array.isArray(o.data)) return o.data;
      if (o.data && typeof o.data === 'object') return pickArray(o.data);
    }
    return [];
  };

  // ━━━ AUTH ━━━
  const buyerToken = await loginAs('99000001');
  await test('Buyer нэвтрэх', async () => {
    if (!buyerToken) throw new Error('Token байхгүй');
  });

  const sellerToken = await loginAs('99000002');
  await test('Seller нэвтрэх', async () => {
    if (!sellerToken) throw new Error('Token байхгүй');
  });

  const driverToken = await loginAs('99000003');
  await test('Driver нэвтрэх', async () => {
    if (!driverToken) throw new Error('Token байхгүй');
  });

  const affiliateToken = await loginAs('99000004');
  await test('Affiliate нэвтрэх', async () => {
    if (!affiliateToken) throw new Error('Token байхгүй');
  });

  const buyerHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${buyerToken ?? ''}`,
  };
  const sellerHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${sellerToken ?? ''}`,
  };
  const driverHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${driverToken ?? ''}`,
  };

  // ━━━ PRODUCTS ━━━
  await test('Бараа жагсаалт', async () => {
    const res = await fetch(`${BASE}/api/products?limit=3`);
    const d = await res.json();
    const items = pickArray(d);
    if (!items.length) throw new Error('Бараа байхгүй');
  });

  // ━━━ BUYER ORDERS ━━━
  await test('Buyer захиалга жагсаалт', async () => {
    const res = await fetch(`${BASE}/api/buyer/orders`, { headers: buyerHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (!Array.isArray(pickArray(d))) throw new Error('Массив биш');
  });

  // ━━━ SELLER ORDERS ━━━
  await test('Seller захиалга жагсаалт', async () => {
    const res = await fetch(`${BASE}/api/seller/orders`, { headers: sellerHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (!Array.isArray(pickArray(d))) throw new Error('Массив биш');
  });

  // ━━━ DRIVER ORDERS ━━━
  await test('Driver available орд', async () => {
    const res = await fetch(`${BASE}/api/driver/orders?type=available`, {
      headers: driverHeaders,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (!Array.isArray(pickArray(d))) throw new Error('Массив биш');
  });

  await test('Driver mine орд', async () => {
    const res = await fetch(`${BASE}/api/driver/orders?type=mine`, {
      headers: driverHeaders,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    if (!Array.isArray(pickArray(d))) throw new Error('Массив биш');
  });

  // ━━━ RESULT ━━━
  console.log('\n════════════════════════════');
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📊 Total:  ${passed + failed}`);
  console.log('════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

runE2ETest()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
