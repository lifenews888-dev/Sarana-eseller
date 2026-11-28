/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
// MongoDB/Prisma-г санах ойд дуурайх хялбар давхарга (тест зориулалттай)
import crypto from 'crypto';
export const db: Record<string, any[]> = {};
const UNIQUE: Record<string, string[]> = {
  escrowTransaction: ['orderId'], wallet: ['userId'], loyaltyAccount: ['userId'], coupon: ['code'], user: ['email'], shop: [],
  paymentTransaction: [], sellerCommission: ['orderId'],
};
const DEFAULTS: Record<string, () => any> = {
  order: () => ({ status: 'pending', statusHistory: [], confirmedByBuyer: false, items: [], sellerAmount: 0, affiliateAmount: 0, platformAmount: 0, trackingEvents: [], loyaltyPointsUsed: 0, couponCode: null, escrowStatus: null, paymentId: null, paymentMethod: null, shopId: null, driverId: null }),
  wallet: () => ({ balance: 0, pending: 0, escrowHold: 0, history: [] }),
  loyaltyAccount: () => ({ balance: 0, lifetimeEarned: 0, lifetimeSpent: 0, tier: 'BRONZE' }),
  coupon: () => ({ usageCount: 0, isActive: true }),
  escrowTransaction: () => ({ releasedAt: null, refundedAt: null, note: null }),
  returnRequest: () => ({ status: 'PENDING' }),
  paymentTransaction: () => ({ metadata: null }),
};
const oid = () => crypto.randomBytes(12).toString('hex');
const tick = () => new Promise((r) => setImmediate(r));

function cmp(v: any, cond: any): boolean {
  if (cond === null) return v === null || v === undefined;
  if (cond instanceof Date) return v instanceof Date && v.getTime() === cond.getTime();
  if (typeof cond === 'object' && !Array.isArray(cond)) {
    const ops = Object.keys(cond);
    if (!ops.some((o) => ['in', 'notIn', 'not', 'gte', 'gt', 'lte', 'lt', 'equals', 'isSet', 'contains', 'startsWith'].includes(o))) return true; // холбоос шүүлтүүрийг алгасна
    for (const o of ops) {
      const c = cond[o];
      const val = v instanceof Date ? v.getTime() : v;
      const cv = c instanceof Date ? c.getTime() : c;
      if (o === 'in' && !c.includes(v)) return false;
      if (o === 'notIn' && c.includes(v)) return false;
      if (o === 'not' && (typeof c === 'object' && c !== null && !(c instanceof Date) ? cmp(v, c) : v === c || (c === null && (v === null || v === undefined)))) return false;
      if (o === 'equals' && v !== c) return false;
      if (o === 'gte' && !(val >= cv)) return false;
      if (o === 'gt' && !(val > cv)) return false;
      if (o === 'lte' && !(val <= cv)) return false;
      if (o === 'lt' && !(val < cv)) return false;
      if (o === 'isSet' && (c ? v === undefined : v !== undefined)) return false;
      if (o === 'contains' && !String(v ?? '').includes(c)) return false;
      if (o === 'startsWith' && !String(v ?? '').startsWith(c)) return false;
    }
    return true;
  }
  return v === cond;
}
export function match(row: any, where: any = {}): boolean {
  for (const [k, c] of Object.entries(where || {})) {
    if (c === undefined) continue;
    if (k === 'OR') { if (!(c as any[]).some((w) => match(row, w))) return false; continue; }
    if (k === 'AND') { if (!(c as any[]).every((w) => match(row, w))) return false; continue; }
    if (k === 'NOT') { if (match(row, c)) return false; continue; }
    if (!cmp(row[k], c)) return false;
  }
  return true;
}
function apply(row: any, data: any) {
  for (const [k, v] of Object.entries(data || {})) {
    if (v === undefined) continue;
    if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
      if ('increment' in v) { row[k] = (row[k] || 0) + (v as any).increment; continue; }
      if ('decrement' in v) { row[k] = (row[k] || 0) - (v as any).decrement; continue; }
      if ('push' in v) { const p = (v as any).push; row[k] = [...(row[k] || []), ...(Array.isArray(p) ? p : [p])]; continue; }
      if ('set' in v) { row[k] = (v as any).set; continue; }
    }
    row[k] = v;
  }
  row.updatedAt = new Date();
}
const clone = (r: any) => (r ? structuredClone(r) : r);
function sortTake(rows: any[], args: any) {
  let out = [...rows];
  const ob = args?.orderBy;
  if (ob) {
    const [[k, dir]] = Object.entries(Array.isArray(ob) ? ob[0] : ob) as any;
    out.sort((a, b) => ((a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * (dir === 'desc' ? -1 : 1)));
  }
  if (args?.take) out = out.slice(0, args.take);
  return out;
}
function model(name: string) {
  const rows = () => (db[name] ||= []);
  const uniqueCheck = (row: any, self?: any) => {
    for (const f of UNIQUE[name] || []) {
      if (row[f] != null && rows().some((r) => r !== self && r[f] === row[f])) throw Object.assign(new Error(`Unique constraint failed: ${name}.${f}`), { code: 'P2002' });
    }
  };
  return {
    async findUnique(a: any) { await tick(); return clone(rows().find((r) => match(r, a.where)) || null); },
    async findUniqueOrThrow(a: any) { const r = await this.findUnique(a); if (!r) throw new Error('not found'); return r; },
    async findFirst(a: any = {}) { await tick(); return clone(sortTake(rows().filter((r) => match(r, a.where)), a)[0] || null); },
    async findMany(a: any = {}) { await tick(); return sortTake(rows().filter((r) => match(r, a.where)), a).map(clone); },
    async count(a: any = {}) { await tick(); return rows().filter((r) => match(r, a.where)).length; },
    async create(a: any) { await tick(); const row = { id: oid(), createdAt: new Date(), updatedAt: new Date(), ...(DEFAULTS[name]?.() || {}) }; apply(row, a.data); uniqueCheck(row); rows().push(row); return clone(row); },
    async update(a: any) { await tick(); const row = rows().find((r) => match(r, a.where)); if (!row) throw Object.assign(new Error(`${name} not found`), { code: 'P2025' }); apply(row, a.data); return clone(row); },
    async updateMany(a: any) { await tick(); const hit = rows().filter((r) => match(r, a.where)); hit.forEach((r) => apply(r, a.data)); return { count: hit.length }; },
    async upsert(a: any) { await tick(); const row = rows().find((r) => match(r, a.where)); if (row) { apply(row, a.update); return clone(row); } const n = { id: oid(), createdAt: new Date(), updatedAt: new Date(), ...(DEFAULTS[name]?.() || {}) }; apply(n, a.create); uniqueCheck(n); rows().push(n); return clone(n); },
    async delete(a: any) { await tick(); const i = rows().findIndex((r) => match(r, a.where)); const [r] = rows().splice(i, 1); return r; },
    async deleteMany(a: any = {}) { await tick(); const keep = rows().filter((r) => !match(r, a.where)); const c = rows().length - keep.length; db[name] = keep; return { count: c }; },
    async aggregate() { return { _sum: {}, _count: 0 }; },
    async groupBy() { return []; },
  };
}
export const prisma: any = new Proxy({}, {
  get(_t, prop: string) {
    if (prop === '$transaction') return async (arg: any) => (Array.isArray(arg) ? Promise.all(arg) : arg(prisma));
    if (prop === 'then') return undefined;
    return model(prop);
  },
});
export default prisma;
