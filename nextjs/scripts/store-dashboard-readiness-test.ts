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

function main() {
  const checks: Check[] = [];
  const layoutSource = fs.existsSync(dashboardLayout) ? fs.readFileSync(dashboardLayout, 'utf8') : '';

  checks.push({
    label: 'dashboard layout exists',
    ok: !!layoutSource,
    detail: 'src/app/dashboard/layout.tsx',
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
