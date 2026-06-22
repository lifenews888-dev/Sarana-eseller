import { test, expect } from '@playwright/test';

const BASE = 'https://eseller.mn';

const PUBLIC_PAGES = [
  { url: '/',                    name: 'Нүүр хуудас' },
  { url: '/store',               name: 'Дэлгүүр' },
  { url: '/feed',                name: 'Зарын булан' },
  { url: '/shops',               name: 'Дэлгүүрүүд' },
  { url: '/s/sarana-fashion',    name: 'Shop /s/ route' },
  { url: '/sarana-fashion',      name: 'Shop [slug] route' },
  { url: '/s/demo-salon',         name: 'Service shop /s/ route' },
  { url: '/s/demo',               name: 'Service shop demo alias' },
  { url: '/login',               name: 'Нэвтрэх' },
  { url: '/become-seller',       name: 'Seller болох' },
  { url: '/terms',               name: 'Нөхцөл' },
  { url: '/gold',                name: 'Gold membership' },
];

const DASHBOARD_PAGES = [
  { url: '/dashboard',                    name: 'Buyer dashboard' },
  { url: '/dashboard/store',              name: 'Store dashboard' },
  { url: '/dashboard/affiliate',          name: 'Affiliate dashboard' },
  { url: '/dashboard/delivery',           name: 'Driver dashboard' },
  { url: '/dashboard/store/products',     name: 'Бараа' },
  { url: '/dashboard/store/orders',       name: 'Захиалга' },
  { url: '/dashboard/store/sellers',      name: 'Борлуулагчид' },
  { url: '/dashboard/store/commissions',  name: 'Commission' },
  { url: '/dashboard/store/settings',     name: 'Дэлгүүр тохиргоо' },
  { url: '/dashboard/store/chat',         name: 'Чат' },
  { url: '/dashboard/affiliate/verify',   name: 'ESL verify' },
  { url: '/dashboard/orders',             name: 'Захиалгын түүх' },
  { url: '/dashboard/wishlist',           name: 'Wishlist' },
  { url: '/dashboard/settings',           name: 'Хэрэглэгч тохиргоо' },
  { url: '/dashboard/addresses',          name: 'Хаяг' },
];

for (const { url, name } of PUBLIC_PAGES) {
  test(`PUBLIC: ${name} (${url})`, async ({ page }) => {
    const res = await page.goto(BASE + url, { waitUntil: 'domcontentloaded' });
    const status = res?.status() ?? 0;
    expect(status, `${name} returned ${status}`).not.toBe(404);
    expect(status, `${name} returned ${status}`).not.toBe(500);
    // Check page title is not generic Next.js 404
    const title = await page.title();
    expect(title, `${name} has 404 title: "${title}"`).not.toMatch(/^404/);
  });
}

for (const { url, name } of DASHBOARD_PAGES) {
  test(`DASH: ${name} (${url})`, async ({ page }) => {
    const res = await page.goto(BASE + url, { waitUntil: 'domcontentloaded' });
    const status = res?.status() ?? 0;
    expect(status, `${name} returned ${status}`).not.toBe(404);
    expect(status, `${name} returned ${status}`).not.toBe(500);
  });
}
