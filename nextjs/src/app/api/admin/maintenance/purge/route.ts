import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdminDB } from '@/lib/api-auth';

// ══════════════════════════════════════════════════════════════
// POST /api/admin/maintenance/purge — платформыг "цэвэрхэн" эхлүүлэх
//
// Устгана: БҮХ дэлгүүр, БҮХ бараа, admin/superadmin-аас бусад БҮХ хэрэглэгч,
// мөн тэдгээрт холбогдсон бүх бичлэг (захиалга, түрийвч, чат, профайл,
// агент/компани, хэрэглэгчийн оноо г.м.) — Prisma-ийн схемээс автоматаар олно.
//
//  - Зөвхөн superadmin.
//  - { dryRun: true } (default) → юу ч устгахгүй, загвар тус бүрийн тоог буцаана.
//  - { dryRun: false, confirm: 'УСТГА' } → бодитоор устгана. Буцаах боломжгүй.
//  - AdminLog хадгалагдана; purge өөрөө AdminLog-д бичигдэнэ.
// ══════════════════════════════════════════════════════════════

const KEEP_ROLES = ['admin', 'superadmin', 'super_admin'];
// entityId-аар эзэмшигчээ заадаг (relation-гүй) загварууд. Эзэн нь байхгүй бол өнчин.
// Banner-ыг админ гараар тохируулдаг тул энд оруулаагүй.
const ENTITY_OWNED = ['FeedItem', 'PreOrderProduct', 'StoreLocation', 'Promotion', 'Segment', 'AutomationFlow', 'Campaign'];
const ENTITY_OWNERS = ['User', 'Shop', 'Agent', 'Company', 'AutoDealer', 'ServiceProvider', 'PartnerCompany', 'PartnerAgent'];
const NEVER_DELETE = new Set(['AdminLog', 'PlatformConfig']);
const CHUNK = 500;

// Relation-гүй (зөвхөн ObjectId string) гадаад түлхүүрүүдийг нэрээр нь таана
function looseTarget(field: string): string | null {
  if (/^(shop|store)Id$/.test(field)) return 'Shop';
  if (/^productId$/.test(field)) return 'Product';
  if (/^orderId$/.test(field)) return 'Order';
  if (/^feedItemId$/.test(field)) return 'FeedItem';
  if (/^(user|owner|buyer|seller|customer|driver|referrer|referred|affiliate|sender|author|creator|recipient)Id$/.test(field)) return 'User';
  return null;
}

type Edge = { model: string; fk: string; target: string };

function buildEdges(): Edge[] {
  const edges: Edge[] = [];
  for (const m of Prisma.dmmf.datamodel.models) {
    const relFks = new Set<string>();
    for (const f of m.fields) {
      if (f.kind !== 'object' || !f.relationFromFields?.length) continue;
      const fk = f.relationFromFields[0];
      relFks.add(fk);
      const scalar = m.fields.find((s) => s.name === fk);
      if (scalar?.isList) continue;
      edges.push({ model: m.name, fk, target: f.type });
    }
    for (const f of m.fields) {
      if (f.kind !== 'scalar' || f.isList || relFks.has(f.name)) continue;
      const target = looseTarget(f.name);
      if (target) edges.push({ model: m.name, fk: f.name, target });
    }
  }
  return edges;
}

function delegate(model: string) {
  const key = model.charAt(0).toLowerCase() + model.slice(1);
  return (prisma as unknown as Record<string, {
    findMany: (args: unknown) => Promise<{ id: string }[]>;
    deleteMany: (args: unknown) => Promise<{ count: number }>;
  }>)[key];
}

function chunks<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function POST(req: NextRequest) {
  const admin = await requireAdminDB(req);
  if (admin instanceof NextResponse) return admin;
  if (!['superadmin', 'super_admin'].includes(admin.role)) {
    return NextResponse.json({ success: false, error: 'Зөвхөн superadmin' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const dryRun = body?.dryRun !== false;
  if (!dryRun && body?.confirm !== 'УСТГА') {
    return NextResponse.json({ success: false, error: 'Баталгаажуулахын тулд confirm: "УСТГА" илгээнэ үү' }, { status: 400 });
  }

  // 1) Үндсэн багц
  const keptAdminIds = new Set(
    (await prisma.user.findMany({ where: { role: { in: KEEP_ROLES } }, select: { id: true } })).map((u) => u.id),
  );
  if (keptAdminIds.size === 0) {
    return NextResponse.json({ success: false, error: 'Admin данс олдсонгүй — устгал цуцлагдлаа' }, { status: 409 });
  }
  const toDelete = new Map<string, Set<string>>();
  const add = (model: string, ids: string[]) => {
    if (NEVER_DELETE.has(model)) return 0;
    // Admin данс хэзээ ч устгагдахгүй (referral г.м. холбоосоор давталтаар орж ирж болно)
    if (model === 'User') ids = ids.filter((id) => !keptAdminIds.has(id));
    const set = toDelete.get(model) ?? new Set<string>();
    let added = 0;
    for (const id of ids) if (!set.has(id)) { set.add(id); added++; }
    toDelete.set(model, set);
    return added;
  };

  const [users, shops, products] = await Promise.all([
    prisma.user.findMany({ where: { role: { notIn: KEEP_ROLES } }, select: { id: true } }),
    prisma.shop.findMany({ select: { id: true } }),
    prisma.product.findMany({ select: { id: true } }),
  ]);
  add('User', users.map((u) => u.id));
  add('Shop', shops.map((s) => s.id));
  add('Product', products.map((p) => p.id));

  // 2) Холбоотой бүх бичлэгийг давталттайгаар цуглуулна (агент → агентын зар г.м.)
  const edges = buildEdges();
  const errors: string[] = [];
  const expand = async () => {
    for (let round = 0; round < 6; round++) {
      let changed = 0;
      for (const e of edges) {
        const parents = toDelete.get(e.target);
        if (!parents?.size || NEVER_DELETE.has(e.model)) continue;
        const d = delegate(e.model);
        if (!d) continue;
        for (const part of chunks([...parents], CHUNK)) {
          try {
            const rows = await d.findMany({ where: { [e.fk]: { in: part } }, select: { id: true } });
            changed += add(e.model, rows.map((r) => r.id));
          } catch (err) {
            errors.push(`${e.model}.${e.fk}: ${(err as Error).message.slice(0, 120)}`);
            break;
          }
        }
      }
      if (!changed) break;
    }
  };
  await expand();

  // 2b) entityId-аар эзэмшигдсэн өнчин бичлэг (эзэн нь устсан/устах) — зар, урьдчилсан захиалга г.м.
  const liveOwners = new Set<string>();
  for (const m of ENTITY_OWNERS) {
    const d = delegate(m);
    if (!d) continue;
    const doomed = toDelete.get(m);
    for (const r of await d.findMany({ select: { id: true } })) if (!doomed?.has(r.id)) liveOwners.add(r.id);
  }
  for (const m of ENTITY_OWNED) {
    const d = delegate(m) as unknown as { findMany: (a: unknown) => Promise<{ id: string; entityId: string | null }[]> } | undefined;
    if (!d) continue;
    try {
      const rows = await d.findMany({ select: { id: true, entityId: true } });
      add(m, rows.filter((r) => !r.entityId || !liveOwners.has(r.entityId)).map((r) => r.id));
    } catch (err) {
      errors.push(`${m}.entityId: ${(err as Error).message.slice(0, 120)}`);
    }
  }
  await expand();

  const counts = Object.fromEntries([...toDelete.entries()].map(([m, s]) => [m, s.size]).filter(([, n]) => (n as number) > 0));

  if (dryRun) {
    return NextResponse.json({
      success: true,
      dryRun: true,
      keptAdmins: keptAdminIds.size,
      counts,
      errors,
    });
  }

  // 3) Бодит устгал — хүүхэд бичлэгээс эхэлж, эцэг рүү. Prisma (MongoDB) required
  // relation-ийг өөрөө шалгадаг тул саад болсон багцыг дараагийн давталтад дахин оролдоно.
  const depth = new Map<string, number>();
  const parentsOf = new Map<string, Set<string>>();
  for (const e of edges) {
    if (e.model === e.target) continue;
    const s = parentsOf.get(e.model) ?? new Set<string>();
    s.add(e.target);
    parentsOf.set(e.model, s);
  }
  const depthOf = (m: string, seen = new Set<string>()): number => {
    if (depth.has(m)) return depth.get(m)!;
    if (seen.has(m)) return 0;
    seen.add(m);
    let d = 0;
    for (const p of parentsOf.get(m) ?? []) if (toDelete.has(p)) d = Math.max(d, depthOf(p, seen) + 1);
    depth.set(m, d);
    return d;
  };
  const order = [...toDelete.keys()].sort((a, b) => depthOf(b) - depthOf(a));

  const remaining = new Map<string, string[]>(order.map((m) => [m, [...toDelete.get(m)!]]));
  const deleted: Record<string, number> = {};
  const relationOf = (msg: string) => {
    const m = msg.replace(/\s+/g, ' ').match(/relation '?`?([\w]+)`?'? between the `?(\w+)`? and `?(\w+)`? models/);
    return m ? `${m[1]} (${m[2]} ↔ ${m[3]})` : msg.replace(/\s+/g, ' ').slice(-160);
  };
  const lastErr = new Map<string, string>();

  for (let pass = 0; pass < 8; pass++) {
    let progress = 0;
    for (const model of order) {
      const ids = remaining.get(model);
      const d = delegate(model);
      if (!d || !ids?.length) continue;
      const left: string[] = [];
      for (const part of chunks(ids, CHUNK)) {
        try {
          const r = await d.deleteMany({ where: { id: { in: part } } });
          deleted[model] = (deleted[model] ?? 0) + r.count;
          progress += r.count;
        } catch {
          // Багц бүхэлдээ унасан — нэг нэгээр нь оролдож, саадтайг нь ялгана
          for (const id of part) {
            try {
              const r = await d.deleteMany({ where: { id } });
              deleted[model] = (deleted[model] ?? 0) + r.count;
              progress += r.count;
            } catch (err) {
              left.push(id);
              lastErr.set(model, relationOf((err as Error).message));
            }
          }
        }
      }
      remaining.set(model, left);
    }
    if (!progress) break;
  }
  const blocked = Object.fromEntries(
    [...remaining.entries()].filter(([, ids]) => ids.length).map(([m, ids]) => [m, { count: ids.length, reason: lastErr.get(m) }]),
  );
  if (Object.keys(blocked).length) errors.push(`Устгагдаагүй үлдсэн: ${JSON.stringify(blocked)}`);

  await prisma.adminLog.create({
    data: {
      adminId: admin.id,
      action: 'platform.purge',
      after: deleted as Prisma.InputJsonValue,
      note: 'Бүх дэлгүүр, бараа, admin-аас бусад хэрэглэгчийг устгав',
    },
  }).catch(() => null);

  return NextResponse.json({ success: true, dryRun: false, deleted, blocked, errors });
}
