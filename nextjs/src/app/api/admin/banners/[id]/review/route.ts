import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminDB } from '@/lib/api-auth';
import { DAY_MS } from '@/lib/bannerAds';

// POST /api/admin/banners/:id/review { action: 'approve' | 'reject' | 'pause' | 'resume' }
// Төлбөр орсон (PENDING) баннерыг шалгаж нийтэлнэ. Батлах үед хугацаа өнөөдрөөс (эсвэл захиалсан өдрөөс) эхэлнэ.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminDB(req);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) return NextResponse.json({ error: 'Буруу ID' }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || '');

  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) return NextResponse.json({ error: 'Олдсонгүй' }, { status: 404 });

  if (action === 'approve') {
    if (banner.status !== 'PENDING' && banner.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Зөвхөн шалгагдаж буй баннерыг батална' }, { status: 409 });
    }
    const plan = banner.planId ? await prisma.bannerPlan.findUnique({ where: { id: banner.planId } }) : null;
    const now = new Date();
    const startsAt = banner.startsAt > now ? banner.startsAt : now;
    const days = plan?.durationDays || Math.max(1, Math.round((banner.endsAt.getTime() - banner.startsAt.getTime()) / DAY_MS));
    const updated = await prisma.banner.update({
      where: { id },
      data: { status: 'ACTIVE', startsAt, endsAt: new Date(startsAt.getTime() + days * DAY_MS) },
    });
    return NextResponse.json({ success: true, data: updated });
  }
  if (action === 'reject') {
    const updated = await prisma.banner.update({ where: { id }, data: { status: 'REJECTED' } });
    return NextResponse.json({ success: true, data: updated });
  }
  if (action === 'pause' || action === 'resume') {
    const updated = await prisma.banner.update({ where: { id }, data: { status: action === 'pause' ? 'PAUSED' : 'ACTIVE' } });
    return NextResponse.json({ success: true, data: updated });
  }
  return NextResponse.json({ error: 'action: approve|reject|pause|resume' }, { status: 400 });
}
