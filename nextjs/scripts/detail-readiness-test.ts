/**
 * eseller.mn detail/entity readiness smoke.
 *
 * Covers the pages that previously showed the most launch risk:
 * product detail, feed detail, entity profiles, and stale image URL read paths.
 *
 * Usage:
 *   BASE_URL=https://eseller.mn npm run test:details
 */

import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

type CheckResult = {
  label: string;
  ok: boolean;
  detail?: string;
};

const DETAIL_PAGES = [
  {
    url: '/product/d1',
    label: 'demo product detail',
    snippets: ['eseller.mn'],
  },
  {
    url: '/feed/v1',
    label: 'vehicle feed detail',
    snippets: ['Toyota Land Cruiser', 'AutoCity'],
  },
  {
    url: '/feed/l1',
    label: 'agent listing detail',
    snippets: ['3 өрөө байр', 'Ривер Гарден'],
  },
  {
    url: '/feed/p3?unit=3+%D3%A9%D1%80%D3%A9%D3%A9+88%D0%BC%C2%B2',
    label: 'project unit detail',
    snippets: ['Green Valley', '3 өрөө'],
  },
  {
    url: '/entity/auto_dealer/autocity',
    label: 'auto dealer entity profile',
    snippets: ['AutoCity Mongolia', 'Toyota Land Cruiser'],
  },
  {
    url: '/entity/company/mongolian-properties',
    label: 'company entity profile',
    snippets: ['Монголиан Пропертиз', 'Zaisan Heights'],
  },
  {
    url: '/entity/agent/erdenbat',
    label: 'agent entity profile',
    snippets: ['Б. Эрдэнэбат', '3 өрөө байр'],
  },
  {
    url: '/entity/service/techpro',
    label: 'service entity profile',
    snippets: ['TechPro', 'Вэбсайт'],
  },
];

const PRODUCT_API_ROUTES = [
  '/api/products?limit=20',
  '/api/marketplace',
];

const PUBLIC_IMAGE_API_ROUTES = [
  '/api/feed',
  '/api/homepage/config',
  '/api/search?q=Samsung',
  '/api/search/suggest?q=Samsung',
  '/api/group-buy',
  '/api/stories',
  '/api/social/trending',
  '/api/live',
];

const HIDDEN_AUDIT_PRODUCT_ROUTES = [
  '/product/69e1b41bba8282843ef58e30',
  '/api/products/69e1b41bba8282843ef58e30',
];

const FORBIDDEN_IMAGE_PREFIXES = [
  'file:',
  'content:',
  'data:',
  'blob:',
  'javascript:',
  '/data/',
  'C:\\',
  'C:/',
];

function repoPath(...parts: string[]) {
  return path.join(process.cwd(), ...parts);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

async function readBody(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '';
  }
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function imageUrlProblem(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  const forbidden = FORBIDDEN_IMAGE_PREFIXES.find((prefix) => lower.startsWith(prefix.toLowerCase()));
  if (forbidden) return `forbidden image URL prefix ${forbidden}: ${trimmed.slice(0, 80)}`;
  return null;
}

function collectImageValue(value: unknown, urls: string[]): void {
  if (typeof value === 'string') {
    urls.push(value);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectImageValue(item, urls);
    return;
  }

  if (isRecord(value)) {
    for (const nested of Object.values(value)) collectImageValue(nested, urls);
  }
}

function collectImageUrls(value: unknown, urls: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) collectImageUrls(item, urls);
    return urls;
  }

  if (!isRecord(value)) return urls;

  for (const [key, nested] of Object.entries(value)) {
    const lowerKey = key.toLowerCase();
    if (typeof nested === 'string' && (
      lowerKey === 'image'
      || lowerKey === 'images'
      || lowerKey === 'url'
      || lowerKey === 'thumbnail'
      || lowerKey.endsWith('image')
      || lowerKey.endsWith('imageurl')
    )) {
      urls.push(nested);
      continue;
    }
    if (
      lowerKey === 'image'
      || lowerKey === 'images'
      || lowerKey === 'url'
      || lowerKey === 'thumbnail'
      || lowerKey.endsWith('image')
      || lowerKey.endsWith('imageurl')
    ) {
      collectImageValue(nested, urls);
      continue;
    }
    collectImageUrls(nested, urls);
  }

  return urls;
}

function publicProductProblem(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const problem = publicProductProblem(item);
      if (problem) return problem;
    }
    return null;
  }

  if (!isRecord(value)) return null;

  const name = typeof value.name === 'string' ? value.name : typeof value.title === 'string' ? value.title : '';
  const price = typeof value.price === 'number' ? value.price : null;
  if (name && price !== null) {
    const lowerName = name.toLowerCase();
    if (['e2e', 'test', 'тест', 'dummy', 'placeholder'].some((pattern) => lowerName.includes(pattern))) {
      return `test product leaked: ${name}`;
    }
    if (price <= 1) return `zero/one price product leaked: ${name}`;
  }

  for (const nested of Object.values(value)) {
    const problem = publicProductProblem(nested);
    if (problem) return problem;
  }
  return null;
}

async function checkPage(route: typeof DETAIL_PAGES[number]): Promise<CheckResult> {
  try {
    const res = await fetch(`${BASE}${route.url}`, {
      redirect: 'follow',
      headers: { 'User-Agent': 'eseller-detail-readiness' },
    });
    const body = await readBody(res);
    const missing = route.snippets.filter((snippet) => !body.includes(snippet));
    const forbiddenUrl = collectImageUrlsFromHtml(body).map(imageUrlProblem).find(Boolean);
    const ok = res.status < 400 && missing.length === 0 && !forbiddenUrl;
    return {
      label: route.label,
      ok,
      detail: `${res.status} ${route.url}${missing.length ? ` missing: ${missing.join(', ')}` : ''}${forbiddenUrl ? ` ${forbiddenUrl}` : ''}`,
    };
  } catch (error) {
    return {
      label: route.label,
      ok: false,
      detail: error instanceof Error ? error.message : 'request failed',
    };
  }
}

function collectImageUrlsFromHtml(html: string): string[] {
  const urls: string[] = [];
  const patterns = [
    /\bsrc=["']([^"']+)["']/gi,
    /\bimages?["']?\s*:\s*["']([^"']+)["']/gi,
  ];
  for (const pattern of patterns) {
    let match = pattern.exec(html);
    while (match) {
      urls.push(match[1]);
      match = pattern.exec(html);
    }
  }
  return urls;
}

function unwrapData(body: unknown): unknown {
  if (!isRecord(body)) return null;
  if ('data' in body) return body.data;
  return body;
}

async function checkProductApi(route: string): Promise<CheckResult> {
  try {
    const res = await fetch(`${BASE}${route}`, {
      headers: { 'User-Agent': 'eseller-detail-readiness' },
    });
    const body = await readJson(res);
    const data = unwrapData(body);
    const urls = collectImageUrls(data);
    const problem = urls.map(imageUrlProblem).find(Boolean);
    const productProblem = publicProductProblem(data);
    const envelopeOk = isRecord(body) && body.success === true && !!data;
    return {
      label: `product API images ${route}`,
      ok: res.status < 400 && envelopeOk && !problem && !productProblem,
      detail: `${res.status} urls=${urls.length}${problem ? ` ${problem}` : ''}${productProblem ? ` ${productProblem}` : ''}${!envelopeOk ? ' bad envelope' : ''}`,
    };
  } catch (error) {
    return {
      label: `product API images ${route}`,
      ok: false,
      detail: error instanceof Error ? error.message : 'request failed',
    };
  }
}

async function checkPublicImageApi(route: string): Promise<CheckResult> {
  try {
    const res = await fetch(`${BASE}${route}`, {
      headers: { 'User-Agent': 'eseller-detail-readiness' },
    });
    const body = await readJson(res);
    const urls = collectImageUrls(body);
    const problem = urls.map(imageUrlProblem).find(Boolean);
    return {
      label: `public API image leak ${route}`,
      ok: res.status < 400 && !problem,
      detail: `${res.status} urls=${urls.length}${problem ? ` ${problem}` : ''}`,
    };
  } catch (error) {
    return {
      label: `public API image leak ${route}`,
      ok: false,
      detail: error instanceof Error ? error.message : 'request failed',
    };
  }
}

async function checkHiddenAuditProduct(route: string): Promise<CheckResult> {
  try {
    const res = await fetch(`${BASE}${route}`, {
      redirect: 'manual',
      headers: { 'User-Agent': 'eseller-detail-readiness' },
    });
    return {
      label: `hidden audit product ${route}`,
      ok: res.status === 404,
      detail: `${res.status} expected 404`,
    };
  } catch (error) {
    return {
      label: `hidden audit product ${route}`,
      ok: false,
      detail: error instanceof Error ? error.message : 'request failed',
    };
  }
}

function checkSourceContract(file: string, label: string, snippets: string[]): CheckResult {
  const fullPath = repoPath(file);
  if (!fs.existsSync(fullPath)) return { label, ok: false, detail: `${file} not found` };

  const source = fs.readFileSync(fullPath, 'utf8');
  const missing = snippets.filter((snippet) => !source.includes(snippet));
  return {
    label,
    ok: missing.length === 0,
    detail: missing.length === 0 ? file : `missing: ${missing.join(' | ')}`,
  };
}

async function main() {
  const results: CheckResult[] = [];

  console.log('\n══════════════════════════════');
  console.log(`eseller.mn DETAIL READINESS — ${new Date().toISOString().split('T')[0]}`);
  console.log(`Base: ${BASE}`);
  console.log('══════════════════════════════\n');

  for (const route of DETAIL_PAGES) {
    results.push(await checkPage(route));
  }

  for (const route of PRODUCT_API_ROUTES) {
    results.push(await checkProductApi(route));
  }

  for (const route of PUBLIC_IMAGE_API_ROUTES) {
    results.push(await checkPublicImageApi(route));
  }

  for (const route of HIDDEN_AUDIT_PRODUCT_ROUTES) {
    results.push(await checkHiddenAuditProduct(route));
  }

  results.push(checkSourceContract('src/lib/image-url.ts', 'image URL validation library', [
    'ALLOWED_PROTOCOLS',
    'sanitizeImageUrls',
    'getSafeImageList',
  ]));
  results.push(checkSourceContract('src/app/api/products/route.ts', 'product list safe image read path', [
    'getSafeImageList',
  ]));
  results.push(checkSourceContract('src/app/api/products/[id]/route.ts', 'product detail safe image read path', [
    'getSafeImageList',
  ]));
  results.push(checkSourceContract('src/app/product/[id]/page.tsx', 'product page safe image read path', [
    'getSafeImageList',
    'getSafeImageUrl',
  ]));
  results.push(checkSourceContract('src/app/feed/[id]/page.tsx', 'feed detail safe image read path', [
    'getSafeImageList',
    'getSafeImageUrl',
  ]));
  results.push(checkSourceContract('src/components/product/ProductDetailClient.tsx', 'product detail client image filter', [
    'isValidPublicImageUrl',
  ]));
  results.push(checkSourceContract('src/app/api/feed/route.ts', 'feed write safe media path', [
    'sanitizeImageUrls(normalizeMediaUrls(images))',
    'sanitizeImageUrls([cleanString(virtualTourUrl)])',
    'sanitizeImageUrls([cleanString(floorPlanUrl)])',
  ]));
  results.push(checkSourceContract('src/app/api/reviews/route.ts', 'review write safe image path', [
    'sanitizeImageUrls(images)',
  ]));
  results.push(checkSourceContract('src/app/api/admin/banners/route.ts', 'banner write safe image path', [
    'isValidPublicImageUrl(imageUrl)',
  ]));

  for (const result of results) {
    console.log(`${result.ok ? '✅' : '❌'} ${result.label.padEnd(42)} ${result.detail || ''}`);
  }

  const failures = results.filter((result) => !result.ok);
  console.log('\n──────────────────────────────');
  console.log(`Нийт: ${results.length} | ✅ ${results.length - failures.length} | ❌ ${failures.length}`);
  console.log('──────────────────────────────\n');

  if (failures.length > 0) process.exit(1);
}

main();
