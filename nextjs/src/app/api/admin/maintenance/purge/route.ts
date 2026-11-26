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
const ROOTS = ['User', 'Shop', 'Product'] as const;
const NEVER_DELETE = new Set(['AdminLog', 'PlatformConfig']);
const CHUNK = 500;

// Relation-гүй (зөвхөн ObjectId string) гадаад түлхүүрүүдийг нэрээр нь таана
function looseTarget(field: string): string | null {
  if (/^(shop|store)Id$/.test(field)) return 'Shop';
  if (/^productId$/.test(field)) return 'Product';
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

  // 3) Бодит устгал
  const deleted: Record<string, number> = {};
  for (const [model, ids] of toDelete) {
    const d = delegate(model);
    if (!d || !ids.size) continue;
    let total = 0;
    for (const part of chunks([...ids], CHUNK)) {
      try {
        const r = await d.deleteMany({ where: { id: { in: part } } });
        total += r.count;
      } catch (err) {
        errors.push(`delete ${model}: ${(err as Error).message.slice(0, 120)}`);
      }
    }
    deleted[model] = total;
  }

  await prisma.adminLog.create({
    data: {
      adminId: admin.id,
      action: 'platform.purge',
      after: deleted as Prisma.InputJsonValue,
      note: 'Бүх дэлгүүр, бараа, admin-аас бусад хэрэглэгчийг устгав',
    },
  }).catch(() => null);

  return NextResponse.json({ success: true, dryRun: false, deleted, errors });
}
