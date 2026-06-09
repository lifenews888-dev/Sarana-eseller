/**
 * Store owner dashboard readiness checks.
 *
 * Guards the seller-owner management shortcuts shown in dashboard/layout.tsx.
 * These are source-level checks because protected dashboard routes can redirect
 * before Next reaches a missing page in unauthenticated smoke tests.
 */

import fs from 'node:fs';
import path from 'node:path';

type Check = {
  label: string;
  ok: boolean;
  detail: string;
};

const dashboardLayout = path.join(process.cwd(), 'src', 'app', 'dashboard', 'layout.tsx');
const sidebarComponent = path.join(process.cwd(), 'src', 'components', 'dashboard', 'Sidebar.tsx');
const scanRoots = [
  path.join(process.cwd(), 'src', 'app', 'dashboard'),
  path.join(process.cwd(), 'src', 'components', 'dashboard'),
  path.join(process.cwd(), 'src', 'components', 'store'),
];
const storeRouteRoot = path.join(process.cwd(), 'src', 'app', 'dashboard', 'store');

const requiredStoreRoutes = [
  { url: '/dashboard/store', route: '' },
  { url: '/dashboard/store/products', route: 'products' },
  { url: '/dashboard/store/categories', route: 'categories' },
  { url: '/dashboard/store/orders', route: 'orders' },
  { url: '/dashboard/store/listings', route: 'listings' },
  { url: '/dashboard/store/listings/new', route: path.join('listings', 'new') },
  { url: '/dashboard/store/projects', route: 'projects' },
  { url: '/dashboard/store/vehicles', route: 'vehicles' },
  { url: '/dashboard/store/services', route: 'services' },
  { url: '/dashboard/store/downloads', route: 'downloads' },
  { url: '/dashboard/store/domain', route: 'domain' },
  { url: '/dashboard/store/store-settings', route: 'store-settings' },
  { url: '/dashboard/store/settings', route: 'settings' },
  { url: '/dashboard/store/tracking', route: 'tracking' },
  { url: '/dashboard/store/profile', route: 'profile' },
  { url: '/dashboard/store/pricing', route: 'pricing' },
  { url: '/dashboard/store/files', route: 'files' },
];

function routePageExists(route: string): boolean {
  const pagePath = route
    ? path.join(storeRouteRoot, route, 'page.tsx')
    : path.join(storeRouteRoot, 'page.tsx');
  return fs.existsSync(pagePath);
}

function hasRedirectTarget(route: string, target: string): boolean {
  const pagePath = path.join(storeRouteRoot, route, 'page.tsx');
  if (!fs.existsSync(pagePath)) return false;
  return fs.readFileSync(pagePath, 'utf8').includes(`redirect('${target}')`);
}

function walkTsFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkTsFiles(fullPath));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry.name)) files.push(fullPath);
  }
  return files;
}

function findStoreDashboardLinks(): Map<string, Set<string>> {
  const links = new Map<string, Set<string>>();
  const pattern = /\/dashboard\/store(?:\/[A-Za-z0-9_-]+)*(?:\?[A-Za-z0-9_=&%-]+)?/g;

  for (const root of scanRoots) {
    for (const file of walkTsFiles(root)) {
      const source = fs.readFileSync(file, 'utf8');
      for (const match of source.matchAll(pattern)) {
        const url = match[0].split('?')[0].replace(/\/$/, '');
        if (!links.has(url)) links.set(url, new Set());
        links.get(url)?.add(path.relative(process.cwd(), file));
      }
    }
  }

  return links;
}

function routeExistsForUrl(url: string): boolean {
  const relative = url.replace(/^\/dashboard\/store\/?/, '');
  if (!relative) return routePageExists('');

  const segments = relative.split('/').filter(Boolean);
  return routeSegmentsExist(storeRouteRoot, segments);
}

function routeSegmentsExist(currentDir: string, segments: string[]): boolean {
  if (segments.length === 0) return fs.existsSync(path.join(currentDir, 'page.tsx'));

  const [segment, ...rest] = segments;
  const literalPath = path.join(currentDir, segment);
  if (fs.existsSync(literalPath) && routeSegmentsExist(literalPath, rest)) return true;

  const dynamicDirs = fs
    .readdirSync(currentDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\[.+\]$/.test(entry.name));

  return dynamicDirs.some((entry) => routeSegmentsExist(path.join(currentDir, entry.name), rest));
}

function main() {
  const checks: Check[] = [];
  const layoutSource = fs.existsSync(dashboardLayout) ? fs.readFileSync(dashboardLayout, 'utf8') : '';
  const sidebarSource = fs.existsSync(sidebarComponent) ? fs.readFileSync(sidebarComponent, 'utf8') : '';

  checks.push({
    label: 'dashboard layout exists',
    ok: !!layoutSource,
    detail: 'src/app/dashboard/layout.tsx',
  });

  checks.push({
    label: 'store switcher component exists',
    ok: sidebarSource.includes('onStoreChange') && sidebarSource.includes('Дэлгүүр сонгох'),
    detail: 'src/components/dashboard/Sidebar.tsx',
  });

  checks.push({
    label: 'dashboard loads owned stores',
    ok: layoutSource.includes("fetch('/api/seller/my-stores'") && layoutSource.includes('setStores(nextStores)'),
    detail: 'src/app/dashboard/layout.tsx',
  });

  checks.push({
    label: 'active store persists',
    ok: layoutSource.includes("localStorage.setItem('eseller_active_store_id'") && layoutSource.includes("localStorage.setItem('eseller_active_store_type'"),
    detail: 'active store survives dashboard refresh',
  });

  checks.push({
    label: 'active store controls tools',
    ok: layoutSource.includes('activeStore?.entityType') && layoutSource.includes('activeStore?.storeType') && layoutSource.includes('getSellerSections(effectiveShopType, userEntityType)'),
    detail: 'sidebar sections follow selected store type',
  });

  for (const item of requiredStoreRoutes) {
    checks.push({
      label: item.url,
      ok: routePageExists(item.route),
      detail: item.route ? `src/app/dashboard/store/${item.route}/page.tsx` : 'src/app/dashboard/store/page.tsx',
    });
  }

  const redirectChecks = [
    { route: 'tracking', target: '/dashboard/store/orders' },
    { route: 'profile', target: '/dashboard/store/settings' },
    { route: 'pricing', target: '/dashboard/store/specs' },
    { route: 'files', target: '/dashboard/store/downloads' },
  ];

  for (const item of redirectChecks) {
    checks.push({
      label: `redirect ${item.route}`,
      ok: hasRedirectTarget(item.route, item.target),
      detail: `/dashboard/store/${item.route} -> ${item.target}`,
    });
  }

  const sidebarUrls = [
    '/dashboard/store/tracking',
    '/dashboard/store/profile',
    '/dashboard/store/pricing',
    '/dashboard/store/files',
  ];

  for (const url of sidebarUrls) {
    checks.push({
      label: `sidebar includes ${url}`,
      ok: layoutSource.includes(url),
      detail: 'src/app/dashboard/layout.tsx',
    });
  }

  const discoveredLinks = findStoreDashboardLinks();
  checks.push({
    label: 'dynamic link sweep found links',
    ok: discoveredLinks.size > 0,
    detail: `${discoveredLinks.size} store dashboard link(s) discovered`,
  });

  for (const [url, files] of [...discoveredLinks.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    checks.push({
      label: `link route ${url}`.slice(0, 38),
      ok: routeExistsForUrl(url),
      detail: [...files].slice(0, 2).join(', '),
    });
  }

  console.log('\n══════════════════════════════');
  console.log(`eseller.mn STORE DASHBOARD READINESS — ${new Date().toISOString().split('T')[0]}`);
  console.log('══════════════════════════════\n');

  for (const check of checks) {
    console.log(`${check.ok ? '✅' : '❌'} ${check.label.padEnd(38)} ${check.detail}`);
  }

  const failures = checks.filter((check) => !check.ok);
  console.log('\n──────────────────────────────');
  console.log(`Нийт: ${checks.length} | ✅ ${checks.length - failures.length} | ❌ ${failures.length}`);
  console.log('──────────────────────────────\n');

  if (failures.length > 0) process.exit(1);
}

main();
