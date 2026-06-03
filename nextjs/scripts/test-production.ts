/**
 * Smoke test against a live environment (production or preview).
 *
 * Run:
 *   TEST_EMAIL=foo@eseller.mn TEST_PASSWORD=xxx \
 *     npx tsx scripts/test-production.ts
 *
 * Override base URL:
 *   BASE=https://preview.eseller.mn npx tsx scripts/test-production.ts
 *
 * CI-safe: exits non-zero when any test fails.
 */

const BASE = process.env.BASE || 'https://eseller.mn';
const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error('❌ TEST_EMAIL, TEST_PASSWORD env variables шаардлагатай');
  process.exit(1);
}

interface Test {
  name: string;
  url: string;
  method: 'GET' | 'POST';
  auth?: boolean;
  body?: unknown;
  expectStatus?: number[];
}

async function main() {
  console.log(`\neseller.mn production smoke test → ${BASE}\n`);

  // 1. Login to get a JWT
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!loginRes.ok) {
    console.error(`❌ Login failed: ${loginRes.status}`);
    process.exit(1);
  }
  const loginBody = await loginRes.json();
  const token: string | undefined = loginBody.token || loginBody.data?.token;
  if (!token) {
    console.error('❌ Login response has no token');
    console.error(loginBody);
    process.exit(1);
  }
  const authHeader = { Authorization: `Bearer ${token}` };

  const tests: Test[] = [
    // Public
    { name: 'GET /api/stats', url: `${BASE}/api/stats`, method: 'GET' },
    { name: 'GET /api/marketplace', url: `${BASE}/api/marketplace`, method: 'GET' },

    // Wallet
    { name: 'GET /api/wallet', url: `${BASE}/api/wallet`, method: 'GET', auth: true },
    {
      name: 'GET /api/wallet/transactions',
      url: `${BASE}/api/wallet/transactions`,
      method: 'GET',
      auth: true,
    },
    {
      name: 'POST /api/wallet/topup',
      url: `${BASE}/api/wallet/topup`,
      method: 'POST',
      auth: true,
      body: { amount: 1000, method: 'qpay', reference: 'TEST_REF_001' },
    },

    // Loyalty
    { name: 'GET /api/loyalty', url: `${BASE}/api/loyalty`, method: 'GET', auth: true },
    {
      name: 'POST /api/loyalty/redeem-cash',
      url: `${BASE}/api/loyalty/redeem-cash`,
      method: 'POST',
      auth: true,
      body: { points: 500 },
      expectStatus: [200, 400, 404], // 400/404 — insufficient points / no account
    },

    // Auth hardening: /api/loyalty/redeem without a token must 401
    {
      name: 'POST /api/loyalty/redeem (no auth → 401)',
      url: `${BASE}/api/loyalty/redeem`,
      method: 'POST',
      body: { userId: 'hacker', points: 999, type: 'discount' },
      expectStatus: [401],
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    const start = Date.now();
    try {
      const res = await fetch(t.url, {
        method: t.method,
        headers: {
          'Content-Type': 'application/json',
          ...(t.auth ? authHeader : {}),
        },
        ...(t.body ? { body: JSON.stringify(t.body) } : {}),
      });
      const ms = Date.now() - start;
      const expected = t.expectStatus ?? [200, 201];
      const ok = expected.includes(res.status);
      console.log(
        `${ok ? '✅' : '❌'} ${ms.toString().padStart(4)}ms  ${t.name}  → ${res.status}`,
      );
      if (ok) {
        passed++;
      } else {
        failed++;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`❌ ERROR  ${t.name}  → ${msg}`);
      failed++;
    }
  }

  console.log('\n══════════════════════════════');
  console.log(`✅ ${passed} passed  ❌ ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
