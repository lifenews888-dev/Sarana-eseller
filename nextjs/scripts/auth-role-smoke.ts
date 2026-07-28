/**
 * Auth role matrix smoke against a live/base URL.
 *
 * Usage:
 *   BASE_URL=https://eseller.mn npx tsx scripts/auth-role-smoke.ts
 */
const BASE = (process.env.BASE_URL || 'https://eseller.mn').replace(/\/+$/, '');
const ROLES = ['buyer', 'seller', 'affiliate', 'delivery'] as const;
const PW = 'TestPass123!';

type Envelope<T> = { success?: boolean; data?: T; error?: string; token?: string; user?: unknown };

async function post<T>(path: string, body: unknown): Promise<{ status: number; json: Envelope<T> }> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as Envelope<T>;
  return { status: res.status, json };
}

async function getMe(token: string) {
  const res = await fetch(`${BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function main() {
  const ts = Date.now();
  let failed = 0;
  console.log(`Auth smoke → ${BASE}\n`);

  for (const role of ROLES) {
    const email = `smoke.${role}.${ts}@eseller-test.mn`;
    const phone = `9${String(ts).slice(-7)}${ROLES.indexOf(role)}`.slice(0, 8);

    const reg = await post<{ token: string; user: { role: string; shops?: unknown[] } }>(
      '/api/auth/register',
      { name: `Smoke ${role}`, email, phone, password: PW, role },
    );
    const token = reg.json.data?.token || reg.json.token;
    const regOk = reg.status >= 200 && reg.status < 300 && !!token;

    const loginEmail = await post<{ token: string; user: { role: string; shops?: unknown[] } }>(
      '/api/auth/login',
      { email, password: PW },
    );
    const loginPhone = await post('/api/auth/login', { phone, password: PW });
    const loginBad = await post('/api/auth/login', { email, password: 'wrong-pass' });
    const me = token ? await getMe(String(token)) : { status: 0, json: {} };

    const loginToken = loginEmail.json.data?.token || loginEmail.json.token;
    const shops = (loginEmail.json.data as { user?: { shops?: unknown[] } } | undefined)?.user?.shops
      ?? (loginEmail.json as { user?: { shops?: unknown[] } }).user?.shops
      ?? [];

    const row = {
      role,
      reg: reg.status,
      regOk,
      loginEmail: loginEmail.status,
      loginPhone: loginPhone.status,
      loginBad: loginBad.status,
      me: me.status,
      shops: Array.isArray(shops) ? shops.length : 0,
      err: reg.json.error || loginEmail.json.error || '',
    };

    const ok =
      regOk &&
      loginEmail.status === 200 &&
      !!loginToken &&
      loginPhone.status === 200 &&
      loginBad.status === 401 &&
      me.status === 200 &&
      (role !== 'seller' || row.shops >= 1);

    if (!ok) failed++;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${JSON.stringify(row)}`);
  }

  console.log(failed === 0 ? '\nAll roles passed.' : `\n${failed} role(s) failed.`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
