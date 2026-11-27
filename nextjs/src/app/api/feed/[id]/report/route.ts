import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { REPORT_REASONS } from '@/lib/listingReports';

type Ctx = { params: Promise<{ id: string }> };
const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);


// POST /api/feed/:id/report { reason, note } — зарын талаар гомдол илгээх
export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return errorJson('Буруу зарын ID', 400);

  const body = await req.json().catch(() => ({}));
  const reason = String(body?.reason || '');
  if (!REPORT_REASONS[reason]) return errorJson('Шалтгаанаа сонгоно уу', 400);
  const note = String(body?.note || '').trim().slice(0, 500) || null;

  const item = await prisma.feedItem.findUnique({ where: { id }, select: { id: true } });
  if (!item) return errorJson('Зар олдсонгүй', 404);

  // Нэг хэрэглэгч нэг зарт нээлттэй нэг л гомдол
  const dup = await prisma.listingReport.findFirst({
    where: { feedItemId: id, reporterId: auth.id, status: 'open' },
    select: { id: true },
  });
  if (dup) return json({ id: dup.id, duplicate: true });

  const report = await prisma.listingReport.create({
    data: { feedItemId: id, reporterId: auth.id, reason, note },
  });
  return json({ id: report.id });
}
