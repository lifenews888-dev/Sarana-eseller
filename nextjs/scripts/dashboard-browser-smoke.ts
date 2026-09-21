import { chromium, type Page } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3011';
const EMAIL = process.env.SMOKE_EMAIL || 'sarana@eseller.mn';
const PASSWORD = process.env.SMOKE_PASSWORD || 'password';

const ROUTES = [
  '/dashboard/store',
  '/dashboard/store/gallery',
  '/dashboard/store/inquiries',
  '/dashboard/store/queue',
  '/dashboard/store/settings/shop-type',
  '/dashboard/store/products',
  '/dashboard/store/orders',
];

type RouteResult = {
  route: string;
  status: number | null;
  title: string;
  bodyLength: number;
  overlay: boolean;
  failedResponses: string[];
  failedRequests: string[];
  consoleErrors: string[];
  ok: boolean;
};

async function login() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const json = await res.json();
  const token = json?.data?.token || json?.token;
  const user = json?.data?.user || json?.user;

  if (!res.ok || !token || !user) {
    throw new Error(`Login failed: ${res.status} ${JSON.stringify(json).slice(0, 300)}`);
  }

  return { token, user };
}

async function pageSignals(page: Page) {
  return page.evaluate(() => ({
    title: document.title,
    bodyLength: document.body.innerText.trim().length,
    overlay: Boolean(document.querySelector('[data-nextjs-dialog], .nextjs-error-overlay, .vite-error-overlay')),
  }));
}

async function main() {
  const { token, user } = await login();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width: 1440, height: 1100 },
  });

  await context.addCookies([
    {
      name: 'auth-token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);

  await context.addInitScript(({ tokenValue, userValue }) => {
    localStorage.setItem('token', tokenValue);
    localStorage.setItem('user', JSON.stringify(userValue));
    if (userValue?.store?.id) localStorage.setItem('activeShopId', userValue.store.id);
  }, { tokenValue: token, userValue: user });

  const results: RouteResult[] = [];

  for (const route of ROUTES) {
    const page = await context.newPage();
    const failedResponses: string[] = [];
    const failedRequests: string[] = [];
    const consoleErrors: string[] = [];

    page.on('response', (response) => {
      const url = response.url();
      const status = response.status();
      if (status >= 400 && !url.includes('/_next/static/')) {
        failedResponses.push(`${status} ${url.replace(BASE_URL, '')}`);
      }
    });

    page.on('requestfailed', (request) => {
      const failure = request.failure();
      failedRequests.push(`${failure?.errorText || 'failed'} ${request.url().replace(BASE_URL, '')}`);
    });

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    let status: number | null = null;
    try {
      const response = await page.goto(route, { waitUntil: 'networkidle', timeout: 45000 });
      status = response?.status() ?? null;
      await page.waitForTimeout(700);
      const signals = await pageSignals(page);
      const redirectedToLogin = page.url().includes('/login');
      results.push({
        route,
        status,
        title: signals.title,
        bodyLength: signals.bodyLength,
        overlay: signals.overlay,
        failedResponses,
        failedRequests,
        consoleErrors,
        ok: !redirectedToLogin && status !== null && status < 400 && signals.bodyLength > 100 && !signals.overlay && failedResponses.length === 0,
      });
    } catch (error) {
      results.push({
        route,
        status,
        title: '',
        bodyLength: 0,
        overlay: false,
        failedResponses,
        failedRequests,
        consoleErrors: [...consoleErrors, error instanceof Error ? error.message : String(error)],
        ok: false,
      });
    } finally {
      await page.close();
    }
  }

  await browser.close();

  console.log(`\neseller.mn DASHBOARD BROWSER SMOKE -> ${BASE_URL}`);
  console.log(`user: ${user.email || EMAIL} (${user.role})`);
  for (const item of results) {
    console.log(`${item.ok ? 'OK  ' : 'FAIL'} ${item.route} status=${item.status} body=${item.bodyLength} overlay=${item.overlay}`);
    for (const failure of item.failedResponses.slice(0, 5)) console.log(`     response ${failure}`);
    for (const failure of item.failedRequests.slice(0, 5)) console.log(`     request ${failure.slice(0, 220)}`);
    for (const error of item.consoleErrors.slice(0, 3)) console.log(`     console ${error.slice(0, 220)}`);
  }

  const failed = results.filter((item) => !item.ok);
  if (failed.length > 0) {
    console.log(`\nFailed routes: ${failed.map((item) => item.route).join(', ')}`);
    process.exit(1);
  }

  console.log('\nAll checked dashboard routes rendered without browser/API failures.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
