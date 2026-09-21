import { chromium, type Page } from 'playwright';

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3011').replace(/\/+$/, '');

const PUBLIC_ROUTES = [
  '/',
  '/store',
  '/feed',
  '/shops',
  '/zar',
  '/products',
  '/cart',
  '/login',
  '/register',
  '/open-shop',
  '/become-seller',
];

const PROTECTED_ROUTES = [
  '/dashboard',
  '/dashboard/store',
  '/dashboard/admin',
  '/dashboard/affiliate',
  '/dashboard/delivery',
];

type CheckResult = {
  name: string;
  url: string;
  status: number | null;
  finalUrl: string;
  bodyLength: number;
  overlay: boolean;
  failedResponses: string[];
  consoleErrors: string[];
  ok: boolean;
  note?: string;
};

function isInternal(url: string) {
  return url.startsWith(BASE_URL) || url.startsWith('/');
}

function shortUrl(url: string) {
  return url.replace(BASE_URL, '') || '/';
}

async function pageSignals(page: Page) {
  return page.evaluate(() => ({
    bodyLength: document.body.innerText.trim().length,
    overlay: Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-error-overlay, .vite-error-overlay')),
  }));
}

async function checkPage(page: Page, url: string, name = url): Promise<CheckResult> {
  const failedResponses: string[] = [];
  const consoleErrors: string[] = [];

  page.on('response', (response) => {
    const resUrl = response.url();
    const status = response.status();
    if (status >= 400 && isInternal(resUrl) && !resUrl.includes('/_next/static/')) {
      failedResponses.push(`${status} ${shortUrl(resUrl)}`);
    }
  });

  page.on('console', async (message) => {
    if (message.type() === 'error') {
      const text = message.text();
      if (!text.includes('Failed to load resource') || text.includes(BASE_URL)) {
        const args = await Promise.all(
          message.args().map(async (arg) => {
            try {
              return JSON.stringify(await arg.jsonValue());
            } catch {
              return '<unserializable>';
            }
          }),
        );
        consoleErrors.push(args.length > 0 ? `${text} args=${args.join(',')}` : text);
      }
    }
  });

  let status: number | null = null;
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    status = response?.status() ?? null;
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);
    const signals = await pageSignals(page);
    return {
      name,
      url,
      status,
      finalUrl: page.url(),
      bodyLength: signals.bodyLength,
      overlay: signals.overlay,
      failedResponses,
      consoleErrors,
      ok: status !== null && status < 400 && signals.bodyLength > 80 && !signals.overlay && failedResponses.length === 0,
    };
  } catch (error) {
    return {
      name,
      url,
      status,
      finalUrl: page.url(),
      bodyLength: 0,
      overlay: false,
      failedResponses,
      consoleErrors: [...consoleErrors, error instanceof Error ? error.message : String(error)],
      ok: false,
    };
  }
}

async function checkProtectedRedirect(page: Page, url: string): Promise<CheckResult> {
  const result = await checkPage(page, url, `protected ${url}`);
  const redirectedToLogin = result.finalUrl.includes('/login') && result.finalUrl.includes('redirect=');
  return {
    ...result,
    ok: redirectedToLogin && !result.overlay,
    note: redirectedToLogin ? 'redirected to login' : 'did not redirect to login',
  };
}

async function checkMobileStoreModal(page: Page): Promise<CheckResult> {
  const base = await checkPage(page, '/store', 'mobile /store product modal');
  if (!base.ok) return base;

  try {
    const clickable = page
      .locator('button[aria-label*="дэлгэрэнгүй харах"], button')
      .filter({ hasText: /дэлгэрэнгүй/i })
      .first();

    if ((await clickable.count()) === 0) {
      return { ...base, ok: false, note: 'no product/action button found on mobile store' };
    }

    await clickable.click({ timeout: 10000 });
    await page.waitForTimeout(700);

    const modalLike = await page.locator('[role="dialog"][aria-modal="true"], button:has-text("Сагсанд нэмэх")').count();
    const bottomNavCount = await page.locator('nav:has-text("Нүүр"), [class*="bottom"]').count();
    const signals = await pageSignals(page);

    return {
      ...base,
      finalUrl: page.url(),
      bodyLength: signals.bodyLength,
      overlay: signals.overlay,
      ok: modalLike > 0 && !signals.overlay,
      note: `modalLike=${modalLike}, bottomNav=${bottomNavCount}`,
    };
  } catch (error) {
    return {
      ...base,
      ok: false,
      note: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const desktop = await browser.newContext({ baseURL: BASE_URL, viewport: { width: 1440, height: 1000 } });
  const mobile = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });

  const results: CheckResult[] = [];

  for (const route of PUBLIC_ROUTES) {
    const page = await desktop.newPage();
    results.push(await checkPage(page, route));
    await page.close();
  }

  for (const route of PROTECTED_ROUTES) {
    const page = await desktop.newPage();
    results.push(await checkProtectedRedirect(page, route));
    await page.close();
  }

  const mobilePage = await mobile.newPage();
  results.push(await checkMobileStoreModal(mobilePage));
  await mobilePage.close();

  await browser.close();

  console.log(`\neseller.mn LAUNCH READINESS SMOKE -> ${BASE_URL}`);
  for (const item of results) {
    console.log(
      `${item.ok ? 'OK  ' : 'FAIL'} ${item.name} status=${item.status} body=${item.bodyLength} overlay=${item.overlay}${item.note ? ` (${item.note})` : ''}`,
    );
    if (item.finalUrl !== `${BASE_URL}${item.url}` && !item.name.startsWith('protected')) {
      console.log(`     final ${item.finalUrl}`);
    }
    for (const failure of item.failedResponses.slice(0, 6)) console.log(`     response ${failure}`);
    for (const error of item.consoleErrors.slice(0, 3)) console.log(`     console ${error.slice(0, 220)}`);
  }

  const failed = results.filter((item) => !item.ok);
  if (failed.length > 0) {
    console.log(`\nFailed checks: ${failed.map((item) => item.name).join(', ')}`);
    process.exit(1);
  }

  console.log('\nPublic pages, auth redirects, and mobile store modal passed launch smoke.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
