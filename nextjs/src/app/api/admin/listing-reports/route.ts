import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminDB } from '@/lib/api-auth';
import { REPORT_REASONS } from '@/lib/listingReports';

// GET /api/admin/listing-reports?status=open — гомдлын жагсаалт (зар бүрээр бүлэглэсэн)
export async function GET(req: NextRequest) {
  const admin = await requireAdminDB(req);
  if (admin instanceof NextResponse) return admin;

  const status = req.nextUrl.searchParams.get('status') || 'open';
  const reports = await prisma.listingReport.findMany({
    where: status === 'all' ? {} : { status },
    orderBy: { createdAt: 'desc' },
    take: 300,
  });
  const ids = [...new Set(reports.map((r) => r.feedItemId))];
  const items = ids.length
    ? await prisma.feedItem.findMany({
        where: { id: { in: ids } },
        select: { id: true, title: true, status: true, price: true, images: true, entityType: true, createdAt: true },
      })
    : [];
  const byId = new Map(items.map((i) => [i.id, i]));

  const grouped = ids.map((id) => {
    const rs = reports.filter((r) => r.feedItemId === id);
    return {
      feedItem: byId.get(id) || { id, title: '(устгагдсан зар)', status: 'deleted' },
      count: rs.length,
      reports: rs.map((r) => ({
        id: r.id,
        reason: r.reason,
        reasonLabel: REPORT_REASONS[r.reason] || r.reason,
        note: r.note,
        status: r.status,
        createdAt: r.createdAt,
      })),
    };
  });
  return NextResponse.json({ success: true, data: grouped });
}

// PATCH /api/admin/listing-reports { feedItemId, action: 'suspend' | 'dismiss' | 'restore' }
export async function PATCH(req: NextRequest) {
  const admin = await requireAdminDB(req);
  if (admin instanceof NextResponse) return admin;

  const body = await req.json().catch(() => ({}));
  const feedItemId = String(body?.feedItemId || '');
  const action = String(body?.action || '');
  if (!/^[a-f\d]{24}$/i.test(feedItemId) || !['suspend', 'dismiss', 'restore'].includes(action)) {
    return NextResponse.json({ success: false, error: 'feedItemId, action шаардлагатай' }, { status: 400 });
  }

  if (action === 'suspend' || action === 'restore') {
    await prisma.feedItem
      .update({ where: { id: feedItemId }, data: { status: action === 'suspend' ? 'suspended' : 'active' } })
      .catch(() => null);
  }
  if (action !== 'restore') {
    await prisma.listingReport.updateMany({
      where: { feedItemId, status: 'open' },
      data: { status: action === 'suspend' ? 'resolved' : 'dismissed', resolvedById: admin.id, resolvedAt: new Date() },
    });
  }
  await prisma.adminLog
    .create({ data: { adminId: admin.id, action: `listing.${action}`, after: { feedItemId }, note: 'Зарын гомдол шийдвэрлэв' } })
    .catch(() => null);

  return NextResponse.json({ success: true });
}
