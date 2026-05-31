/**
 * Login redirect contract checks.
 *
 * Protects `/login?redirect=/become-seller` and OAuth return flows while
 * preventing open redirects from auth surfaces.
 */

import fs from 'node:fs';
import path from 'node:path';
import { safeRelativeRedirect } from '../src/lib/safe-redirect';

type Check = {
  label: string;
  ok: boolean;
  detail: string;
};

const loginPage = path.join(process.cwd(), 'src', 'app', 'login', 'page.tsx');
const googleRoute = path.join(process.cwd(), 'src', 'app', 'api', 'auth', 'google', 'route.ts');
const googleCallback = path.join(process.cwd(), 'src', 'app', 'api', 'auth', 'google', 'callback', 'route.ts');

function read(filePath: string): string {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

const redirectCases = [
  { input: '/become-seller', expected: '/become-seller' },
  { input: '/dashboard/store?tab=products', expected: '/dashboard/store?tab=products' },
  { input: 'https://evil.example', expected: '' },
  { input: '//evil.example', expected: '' },
  { input: '/\\evil.example', expected: '' },
  { input: '/dashboard\\evil', expected: '' },
  { input: '/login\nSet-Cookie:x=y', expected: '' },
  { input: '', expected: '' },
  { input: null, expected: '' },
];

function main() {
  const loginSource = read(loginPage);
  const googleSource = read(googleRoute);
  const callbackSource = read(googleCallback);

  const checks: Check[] = [
    {
      label: 'safe redirect cases',
      ok: redirectCases.every((item) => safeRelativeRedirect(item.input) === item.expected),
      detail: `${redirectCases.length} accepted/rejected cases`,
    },
    {
      label: 'login page reads redirect',
      ok: loginSource.includes("params.get('redirect') || params.get('next')"),
      detail: 'legacy next and redirect params are preserved',
    },
    {
      label: 'login uses safe helper',
      ok: loginSource.includes('safeRelativeRedirect(target)'),
      detail: 'client redirect is sanitized before router.push',
    },
    {
      label: 'already logged-in redirect',
      ok: loginSource.includes('if (isLoggedIn && user) router.replace(getRedirectTarget(user.role))'),
      detail: 'authenticated users return to the requested flow',
    },
    {
      label: 'email login redirect',
      ok: loginSource.includes('router.push(getRedirectTarget(data.user.role))'),
      detail: 'password login preserves /become-seller target',
    },
    {
      label: 'register redirect',
      ok: loginSource.includes('const data = await AuthAPI.register') &&
        loginSource.includes('router.push(getRedirectTarget(data.user.role))'),
      detail: 'new account registration preserves /become-seller target',
    },
    {
      label: 'google links preserve redirect',
      ok: loginSource.includes("buildAuthHref('/api/auth/google', {}, redirectTarget)") &&
        loginSource.includes("buildAuthHref('/api/auth/google', { role }, redirectTarget)"),
      detail: 'OAuth login/register buttons carry redirect',
    },
    {
      label: 'google start uses safe helper',
      ok: googleSource.includes('safeRelativeRedirect('),
      detail: 'OAuth redirect cookie is sanitized',
    },
    {
      label: 'google callback uses safe helper',
      ok: callbackSource.includes('safeRelativeRedirect('),
      detail: 'OAuth callback reuses sanitized redirect cookie',
    },
    {
      label: 'google callback preserves redirect',
      ok: callbackSource.includes("redirectUrl.searchParams.set('redirect', redirectTarget)"),
      detail: 'login hash handler receives the original internal target',
    },
  ];

  console.log('\n══════════════════════════════');
  console.log(`eseller.mn LOGIN REDIRECT CONTRACT — ${new Date().toISOString().split('T')[0]}`);
  console.log('══════════════════════════════\n');

  for (const check of checks) {
    console.log(`${check.ok ? '✅' : '❌'} ${check.label.padEnd(34)} ${check.detail}`);
  }

  const failures = checks.filter((check) => !check.ok);
  console.log('\n──────────────────────────────');
  console.log(`Нийт: ${checks.length} | ✅ ${checks.length - failures.length} | ❌ ${failures.length}`);
  console.log('──────────────────────────────\n');

  if (failures.length > 0) process.exit(1);
}

main();
