import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminDB } from '@/lib/api-auth';

// Админы зар (FeedItem) хяналт.
// GET  /api/admin/feed?q=&status=&seed=1   — жагсаалт
// DELETE /api/admin/feed  { ids?: string[], seed?: true } — сонгосон эсвэл seed жишээ зарыг устгана
//   (холбоотой медиа, партнерын комиссыг хамт). AdminLog-д бичигдэнэ.

const OBJECT_ID = /^[a-f0-9]{24}$/i;

export async function GET(req: NextRequest) {
  const admin = await requireAdminDB(req);
  if (admin instanceof NextResponse) return admin;
  const sp = req.nextUrl.searchParams;
  const q = (sp.get('q') || '').trim();
  const status = sp.get('status') || undefined;
  const seed = sp.get('seed') === '1';
  const items = await prisma.feedItem.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(seed ? { refId: { startsWith: 'seed-' } } : {}),
      ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: { id: true, refId: true, title: true, price: true, status: true, entityType: true, entityId: true, createdAt: true },
  });
  return NextResponse.json({ success: true, data: { items, total: items.length } });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdminDB(req);
  if (admin instanceof NextResponse) return admin;
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((v: unknown): v is string => typeof v === 'string' && OBJECT_ID.test(v)) : [];

  const where = body?.seed === true
    ? { refId: { startsWith: 'seed-' } }
    : ids.length ? { id: { in: ids.slice(0, 500) } } : null;
  if (!where) return NextResponse.json({ success: false, error: 'ids эсвэл seed: true шаардлагатай' }, { status: 400 });

  const targets = (await prisma.feedItem.findMany({ where, select: { id: true } })).map((r) => r.id);
  if (!targets.length) return NextResponse.json({ success: true, data: { deleted: 0 } });

  await prisma.entityMedia.deleteMany({ where: { feedItemId: { in: targets } } });
  await prisma.partnerCommission.deleteMany({ where: { feedItemId: { in: targets } } }).catch(() => null);
  const r = await prisma.feedItem.deleteMany({ where: { id: { in: targets } } });

  await prisma.adminLog.create({
    data: { adminId: admin.id, action: 'feed.delete', after: { count: r.count, seed: body?.seed === true }, note: 'Админ зар устгав' },
  }).catch(() => null);

  return NextResponse.json({ success: true, data: { deleted: r.count } });
}
