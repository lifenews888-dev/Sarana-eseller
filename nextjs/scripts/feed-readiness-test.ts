/**
 * eseller.mn feed/store readiness smoke.
 *
 * This is a focused launch guard for the marketplace browsing flow:
 * feed filters, featured tier links, empty category -> post prefill, and store entry pages.
 *
 * Usage:
 *   BASE_URL=http://127.0.0.1:3007 npm run test:feed
 */

import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

type FeedTier = 'vip' | 'featured' | 'discounted' | 'normal';
type FeedItem = {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  tier?: string;
  district?: string;
  province?: string;
  metadata?: Record<string, unknown> | null;
};
type FeedData = Record<FeedTier, FeedItem[]> & {
  meta?: { total?: number; page?: number; hasMore?: boolean };
};
type CheckResult = {
  label: string;
  ok: boolean;
  detail?: string;
};

const FEED_GROUPS: FeedTier[] = ['vip', 'featured', 'discounted', 'normal'];
const PAGE_ROUTES = [
  { url: '/feed', label: 'feed landing' },
  { url: '/feed?category=vehicles-toyota-land-cruiser', label: 'feed nested category' },
  { url: '/feed?tier=featured', label: 'feed featured tier' },
  { url: '/feed?province=arkhangai', label: 'feed province fallback' },
  { url: '/feed/post?category=vehicles-toyota-land-cruiser', label: 'post category prefill page' },
  { url: '/store', label: 'store landing' },
  { url: '/store?category=vehicles', label: 'store category landing' },
];

function repoPath(...parts: string[]) {
  return path.join(process.cwd(), ...parts);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function unwrapData(body: unknown): unknown {
  if (!isRecord(body)) return null;
  if ('success' in body && 'data' in body) return body.data;
  return body;
}

function feedItems(data: FeedData): FeedItem[] {
  return FEED_GROUPS.flatMap((group) => (Array.isArray(data[group]) ? data[group] : []));
}

function validateFeedEnvelope(body: unknown): string | null {
  if (!isRecord(body)) return 'response body is not an object';
  if (body.success !== true) return 'response is missing success:true';

  const data = unwrapData(body);
  if (!isRecord(data)) return 'data is not an object';
  for (const group of FEED_GROUPS) {
    if (!Array.isArray(data[group])) return `data.${group} is not an array`;
  }
  if (!isRecord(data.meta)) return 'data.meta is missing';
  if (typeof data.meta.total !== 'number') return 'data.meta.total is not a number';
  return null;
}

async function checkPage(route: { url: string; label: string }): Promise<CheckResult> {
  try {
    const res = await fetch(`${BASE}${route.url}`, {
      redirect: 'follow',
      headers: { 'User-Agent': 'eseller-feed-readiness' },
    });
    return {
      label: route.label,
      ok: res.status < 400,
      detail: `${res.status} ${route.url}`,
    };
  } catch (error) {
    return {
      label: route.label,
      ok: false,
      detail: error instanceof Error ? error.message : 'request failed',
    };
  }
}

async function checkFeedApi(url: string, label: string, validate?: (data: FeedData) => string | null): Promise<CheckResult> {
  try {
    const res = await fetch(`${BASE}${url}`, {
      headers: { 'User-Agent': 'eseller-feed-readiness' },
    });
    const body = await readJson(res);
    const envelopeError = validateFeedEnvelope(body);
    if (res.status >= 400 || envelopeError) {
      return { label, ok: false, detail: `${res.status} ${url}${envelopeError ? ` - ${envelopeError}` : ''}` };
    }

    const data = unwrapData(body) as FeedData;
    const validationError = validate?.(data);
    return {
      label,
      ok: !validationError,
      detail: validationError || `${feedItems(data).length} item(s), total=${data.meta?.total ?? 0}`,
    };
  } catch (error) {
    return {
      label,
      ok: false,
      detail: error instanceof Error ? error.message : 'request failed',
    };
  }
}

function allItemsHaveTier(expectedTier: FeedTier) {
  return (data: FeedData): string | null => {
    const wrong = feedItems(data).filter((item) => item.tier && item.tier !== expectedTier);
    return wrong.length > 0 ? `found non-${expectedTier} item(s): ${wrong.map((item) => item.id || item.title).join(', ')}` : null;
  };
}

function allItemsMatchNestedVehicleCategory(data: FeedData): string | null {
  const items = feedItems(data);
  const wrong = items.filter((item) => {
    const metadata = isRecord(item.metadata) ? item.metadata : {};
    const selection = String(metadata.categorySelection || item.subcategory || item.category || '');
    const root = String(metadata.categoryRoot || item.category || '');
    return ![
      'vehicles-toyota-land-cruiser',
      'vehicles-toyota',
      'vehicles',
      'auto-moto',
    ].includes(selection) && !['vehicles', 'auto-moto'].includes(root);
  });

  return wrong.length > 0 ? `category filter leaked item(s): ${wrong.map((item) => item.id || item.title).join(', ')}` : null;
}

function allItemsMatchProvince(expectedProvince: string) {
  return (data: FeedData): string | null => {
    const wrong = feedItems(data).filter((item) => item.province && item.province !== expectedProvince);
    return wrong.length > 0 ? `province filter leaked item(s): ${wrong.map((item) => item.id || item.title).join(', ')}` : null;
  };
}

function allItemsMatchDistrict(expectedDistrict: string) {
  return (data: FeedData): string | null => {
    const wrong = feedItems(data).filter((item) => item.district && item.district !== expectedDistrict);
    return wrong.length > 0 ? `district filter leaked item(s): ${wrong.map((item) => item.id || item.title).join(', ')}` : null;
  };
}

function checkSourceContract(file: string, label: string, requiredSnippets: string[]): CheckResult {
  const fullPath = repoPath(file);
  if (!fs.existsSync(fullPath)) return { label, ok: false, detail: `${file} not found` };

  const source = fs.readFileSync(fullPath, 'utf8');
  const missing = requiredSnippets.filter((snippet) => !source.includes(snippet));
  return {
    label,
    ok: missing.length === 0,
    detail: missing.length === 0 ? file : `missing: ${missing.join(' | ')}`,
  };
}

async function main() {
  const results: CheckResult[] = [];

  console.log('\n══════════════════════════════');
  console.log(`eseller.mn FEED READINESS — ${new Date().toISOString().split('T')[0]}`);
  console.log(`Base: ${BASE}`);
  console.log('══════════════════════════════\n');

  for (const route of PAGE_ROUTES) {
    results.push(await checkPage(route));
  }

  results.push(await checkFeedApi('/api/feed', 'api feed envelope'));
  results.push(await checkFeedApi('/api/feed?tier=featured', 'api featured tier filter', allItemsHaveTier('featured')));
  results.push(await checkFeedApi('/api/feed?category=vehicles-toyota-land-cruiser', 'api nested category filter', allItemsMatchNestedVehicleCategory));
  results.push(await checkFeedApi('/api/feed?province=arkhangai', 'api province filter', allItemsMatchProvince('arkhangai')));
  results.push(await checkFeedApi('/api/feed?district=%D0%A1%D0%A5%D0%94', 'api district filter', allItemsMatchDistrict('СХД')));

  results.push(checkSourceContract('src/app/feed/FeedPageClient.tsx', 'feed empty/category actions source', [
    '/feed/post?category=',
    'tier=featured',
    'onClearLocation',
    'data-feed-featured-businesses',
    'featuredBusinessUsedLocationFallback',
    'Баталгаатай',
    'Бүх байршил',
    'hasLocationFilter',
    'visibleFeedItems',
    'canRelaxLocationFilter ? filteredWithoutLocation : filtered',
    "relaxedParams.delete('district')",
    "relaxedParams.delete('province')",
  ]));
  results.push(checkSourceContract('src/app/feed/post/page.tsx', 'post prefill/readiness source', [
    'data-feed-post-prefill-notice',
    'data-feed-post-sticky-readiness',
    'metadata.categoryPathLabel',
  ]));
  results.push(checkSourceContract('src/components/store/ProductCard.tsx', 'store product card action source', [
    'aria-pressed',
    'type="button"',
    'Дэлгэрэнгүй',
  ]));

  for (const result of results) {
    console.log(`${result.ok ? '✅' : '❌'} ${result.label.padEnd(36)} ${result.detail || ''}`);
  }

  const failures = results.filter((result) => !result.ok);
  console.log('\n──────────────────────────────');
  console.log(`Нийт: ${results.length} | ✅ ${results.length - failures.length} | ❌ ${failures.length}`);
  console.log('──────────────────────────────\n');

  if (failures.length > 0) {
    process.exit(1);
  }
}

main();
