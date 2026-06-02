/**
 * eseller.mn — End-to-end Smoke Test
 * Usage: npx tsx scripts/smoke-test.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import jwt from 'jsonwebtoken';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'eseller-jwt-secret-key-change-in-production-2026';

interface Result {
  url: string;
  status: number;
  ok: boolean;
  label: string;
}

const SELLER_BFF_ROUTES = [
  '/api/seller/me',
  '/api/seller/dashboard',
  '/api/seller/wallet-summary',
  '/api/seller/referral-summary',
  '/api/seller/lead-summary',
  '/api/seller/commission-summary',
];

const ROUTES = [
  // Нийтийн хуудас
  { url: '/', label: 'Нүүр хуудас' },
  { url: '/store', label: 'Дэлгүүр' },
  { url: '/feed', label: 'Зарын булан' },
  { url: '/shops', label: 'Бүх дэлгүүр' },
  { url: '/about', label: 'Бидний тухай' },
  { url: '/privacy', label: 'Нууцлал' },
  { url: '/terms', label: 'Нөхцөл' },
  { url: '/help', label: 'Тусламж' },
  { url: '/contact', label: 'Холбоо барих' },
  { url: '/partner', label: 'Хамтрах' },
  { url: '/cart', label: 'Сагс' },
  { url: '/register', label: 'Бүртгэл' },
  { url: '/register?redirect=/become-seller', label: 'Register redirect to seller onboarding' },
  { url: '/login?redirect=/become-seller', label: 'Login redirect to seller onboarding' },
  { url: '/gold', label: 'Gold' },
  { url: '/search', label: 'Хайлт' },
  { url: '/compare', label: 'Харьцуулалт' },
  { url: '/products', label: 'Products alias' },
  { url: '/listings', label: 'Listings alias' },
  { url: '/zar', label: 'Zar alias' },
  { url: '/admin', label: 'Admin alias' },

  // Onboarding
  { url: '/open-shop', label: 'Дэлгүүр нээх' },
  { url: '/become-seller', label: 'Борлуулагч болох' },
  { url: '/become-driver', label: 'Жолооч болох' },

  // Dashboard (redirect to /login if not authed — 200 is ok)
  { url: '/dashboard', label: 'Dashboard' },
  { url: '/dashboard/admin', label: 'Admin dashboard' },
  { url: '/dashboard/admin/revenue', label: 'Admin revenue' },

  // API endpoints
  { url: '/api/stats', label: 'API stats' },
  { url: '/api/stores', label: 'API stores' },
  { url: '/api/health', label: 'API health' },
];

const PUBLIC_COPY_ROUTES = ['/', '/store', '/feed', '/checkout', '/help', '/contact', '/privacy', '/terms'];

const FORBIDDEN_PUBLIC_COPY = [
  { pattern: 'QPay & Карт', reason: 'card payment is not launched' },
  { pattern: 'QPay & Card', reason: 'card payment is not launched' },
  { pattern: 'QPay, Visa, Mastercard', reason: 'card payment is not launched' },
  { pattern: 'дебит/кредит карт', reason: 'card payment is not launched' },
  { pattern: 'Visa / Mastercard', reason: 'card payment is not launched' },
  { pattern: 'SocialPay', reason: 'payment method is not launched' },
  { pattern: 'MonPay', reason: 'payment method is not launched' },
  { pattern: 'StorePay', reason: 'payment method is not launched' },
  { pattern: '7XXX-XXXX', reason: 'placeholder phone number' },
  { pattern: '7700-XXXX', reason: 'placeholder phone number' },
  { pattern: '7700XXXX', reason: 'placeholder phone number' },
  { pattern: '10,000+ бараа', reason: 'inflated product count claim' },
  { pattern: '10,000+ products', reason: 'inflated product count claim' },
  { pattern: 'E2E Test Product', reason: 'test product leaked' },
];

async function testRoute(route: typeof ROUTES[0]): Promise<Result> {
  try {
    const res = await fetch(`${BASE}${route.url}`, {
      redirect: 'follow',
      headers: { 'User-Agent': 'eseller-smoke-test' },
    });
    return { url: route.url, status: res.status, ok: res.status < 400, label: route.label };
  } catch {
    return { url: route.url, status: 0, ok: false, label: route.label };
  }
}

async function testPublicCopyRoutes(): Promise<number> {
  let failures = 0;

  console.log(`\nPUBLIC COPY audit smoke:`);
  for (const route of PUBLIC_COPY_ROUTES) {
    const res = await fetch(`${BASE}${route}`, {
      redirect: 'follow',
      headers: { 'User-Agent': 'eseller-smoke-test' },
    });
    const body = await res.text();
    const hit = FORBIDDEN_PUBLIC_COPY.find((item) => body.includes(item.pattern));
    const ok = res.status < 400 && !hit;
    if (!ok) failures += 1;
    console.log(
      `  ${ok ? 'ok' : 'FAIL'} ${String(res.status).padStart(3)} ${route}${hit ? ` - ${hit.pattern} (${hit.reason})` : ''}`
    );
  }

  return failures;
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function isLocalBaseUrl(): boolean {
  try {
    const url = new URL(BASE);
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  } catch {
    return false;
  }
}

function getSellerSmokeToken(): string | null {
  if (process.env.SELLER_SMOKE_TOKEN) return process.env.SELLER_SMOKE_TOKEN;
  if (!isLocalBaseUrl()) return null;

  return jwt.sign(
    {
      id: '000000000000000000000001',
      role: 'seller',
      email: 'seller-smoke@example.invalid',
      name: 'Seller Smoke',
    },
    JWT_SECRET,
    { expiresIn: '10m' }
  );
}

function validateSellerSuccessEnvelope(route: string, body: unknown): string | null {
  if (!body || typeof body !== 'object') return `${route} returned a non-object body`;
  const envelope = body as Record<string, unknown>;
  if (envelope.success === true) return `${route} returned legacy { success: true }`;
  if (envelope.ok !== true) return `${route} did not return ok: true`;
  if (!('data' in envelope)) return `${route} is missing data`;
  if (!envelope.correlationId) return `${route} is missing correlationId`;
  if (envelope.responseVersion !== 'seller-dashboard.v1') return `${route} has wrong responseVersion`;
  if (envelope.bff !== 'sarana-eseller') return `${route} has wrong bff`;
  if (!envelope.upstream) return `${route} is missing upstream`;
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

async function testMobileConfigRoute(): Promise<number> {
  console.log(`\nMOBILE CONFIG smoke:`);
  const route = '/api/config/mobile';
  const res = await fetch(`${BASE}${route}`, {
    headers: { 'User-Agent': 'eseller-smoke-test' },
  });
  const body = await readJson(res);
  const envelope = isRecord(body) ? body : {};
  const data = isRecord(envelope.data) ? envelope.data : {};
  const sellerNetwork = isRecord(data.sellerNetwork) ? data.sellerNetwork : {};
  const serialized = JSON.stringify(body);
  const ok =
    res.status === 200 &&
    envelope.success === true &&
    isRecord(data.malchnaas) &&
    typeof sellerNetwork.enabled === 'boolean' &&
    !serialized.includes('ESELLER_S2S_INTEGRATION_KEY') &&
    !serialized.includes('NEGD_INTERNAL_BASE_URL');

  console.log(
    `  ${ok ? 'ok' : 'FAIL'} ${String(res.status).padStart(3)} ${route} sellerNetwork.enabled=${String(sellerNetwork.enabled)}`
  );
  return ok ? 0 : 1;
}

function findForbiddenSellerMutationRoutes(): string[] {
  const sellerApiDir = path.join(process.cwd(), 'src', 'app', 'api', 'seller');
  if (!fs.existsSync(sellerApiDir)) return [];

  const forbidden: string[] = [];
  const visit = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
        continue;
      }
      if (entry.name !== 'route.ts') continue;

      const relative = path.relative(sellerApiDir, fullPath);
      const segments = relative.split(path.sep).slice(0, -1);
      if (segments.some(segment => ['payout', 'withdraw', 'wallet', 'ledger'].includes(segment))) {
        forbidden.push(path.join('src', 'app', 'api', 'seller', relative));
      }
    }
  };

  visit(sellerApiDir);
  return forbidden;
}

async function testSellerBffRoutes(): Promise<number> {
  let failures = 0;

  console.log(`\nSELLER BFF smoke:`);
  for (const route of SELLER_BFF_ROUTES) {
    const res = await fetch(`${BASE}${route}`, {
      headers: { 'User-Agent': 'eseller-smoke-test' },
    });
    const body = await readJson(res);
    const legacySuccess = !!(body && typeof body === 'object' && (body as Record<string, unknown>).success === true);
    const ok = res.status === 401 && !legacySuccess;
    if (!ok) failures += 1;
    console.log(`  ${ok ? 'ok' : 'FAIL'} unauth ${String(res.status).padStart(3)} ${route}`);
  }

  const token = getSellerSmokeToken();
  if (!token) {
    console.log('  skip authenticated seller BFF checks (set SELLER_SMOKE_TOKEN or use localhost BASE_URL)');
  } else {
    for (const route of SELLER_BFF_ROUTES) {
      const res = await fetch(`${BASE}${route}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'eseller-smoke-test',
        },
      });
      const body = await readJson(res);
      const envelopeError = res.status === 200 ? validateSellerSuccessEnvelope(route, body) : `${route} returned ${res.status}`;
      const ok = !envelopeError;
      if (!ok) failures += 1;
      console.log(
        `  ${ok ? 'ok' : 'FAIL'} auth   ${String(res.status).padStart(3)} ${route}${envelopeError ? ` - ${envelopeError}` : ''}`
      );
    }
  }

  const forbiddenRoutes = findForbiddenSellerMutationRoutes();
  if (forbiddenRoutes.length > 0) {
    failures += forbiddenRoutes.length;
    console.log('  FAIL forbidden seller mutation routes found:');
    forbiddenRoutes.forEach(route => console.log(`    ${route}`));
  } else {
    console.log('  ok no seller payout/withdraw/wallet/ledger mutation routes found');
  }

  return failures;
}

async function main() {
  console.log(`\n══════════════════════════════`);
  console.log(`eseller.mn SMOKE TEST — ${new Date().toISOString().split('T')[0]}`);
  console.log(`Base: ${BASE}`);
  console.log(`══════════════════════════════\n`);

  const results: Result[] = [];

  for (const route of ROUTES) {
    const result = await testRoute(route);
    results.push(result);

    const icon = result.status === 0 ? '💀' : result.ok ? '✅' : result.status >= 500 ? '⚠️' : '❌';
    console.log(`${icon} ${String(result.status).padStart(3)}  ${result.url.padEnd(35)} ${result.label}`);
  }

  const ok = results.filter(r => r.ok).length;
  const fail404 = results.filter(r => r.status >= 400 && r.status < 500).length;
  const fail500 = results.filter(r => r.status >= 500).length;
  const dead = results.filter(r => r.status === 0).length;

  console.log(`\n──────────────────────────────`);
  console.log(`Нийт: ${results.length} | ✅ ${ok} | ❌ ${fail404} | ⚠️ ${fail500} | 💀 ${dead}`);
  console.log(`──────────────────────────────`);

  // API stats check
  console.log(`\nAPI STATS шалгалт:`);
  try {
    const statsRes = await fetch(`${BASE}/api/stats`);
    const stats = await statsRes.json();
    console.log(`  products=${stats.productCount} shops=${stats.shopCount} users=${stats.userCount} orders=${stats.orderCount}`);
  } catch {
    console.log(`  ❌ /api/stats хандаж чадсангүй`);
  }

  const mobileConfigFailures = await testMobileConfigRoute();
  const sellerBffFailures = await testSellerBffRoutes();
  const publicCopyFailures = await testPublicCopyRoutes();

  // Failed routes
  const failed = results.filter(r => !r.ok);
  if (failed.length > 0) {
    console.log(`\n❌ АЛДААТАЙ ROUTE-УУД:`);
    failed.forEach(r => console.log(`  ${r.status} ${r.url} — ${r.label}`));
  } else {
    console.log(`\n✅ Бүх route амжилттай!`);
  }

  console.log(`\n══════════════════════════════\n`);
  process.exit(
    failed.length > 0 || mobileConfigFailures > 0 || sellerBffFailures > 0 || publicCopyFailures > 0 ? 1 : 0
  );
}

main();
