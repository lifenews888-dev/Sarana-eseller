import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { createInvoice } from '@/lib/qpay';
import { isValidPublicImageUrl } from '@/lib/image-url';
import { AD_SLOTS, DAY_MS, isAdSlot } from '@/lib/bannerAds';

const isHttpUrl = (u: string) => /^https?:\/\/[^\s]+$/i.test(u) || /^\/[^\s]*$/.test(u);

// GET /api/banner-orders — миний захиалсан баннерууд (статус, үзэлт, даралт)
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const rows = await prisma.banner.findMany({ where: { createdById: auth.id }, orderBy: { createdAt: 'desc' }, take: 50 });
  // Төлбөр хүлээж буй баннерын сүүлийн нэхэмжлэлийг QR-ийг дахин харуулахад ашиглана
  const waiting = rows.filter((r) => r.status === 'AWAITING_PAYMENT').map((r) => r.id);
  const txs = waiting.length
    ? await prisma.paymentTransaction.findMany({ where: { orderId: { in: waiting }, method: 'qpay' }, orderBy: { createdAt: 'desc' } })
    : [];
  const invoiceOf = new Map<string, string>();
  for (const t of txs) if (t.invoiceId && !invoiceOf.has(t.orderId)) invoiceOf.set(t.orderId, t.invoiceId);
  return json(rows.map((r) => ({
    id: r.id, refId: r.refId, title: r.title, slot: r.slot, imageUrl: r.imageUrl, linkUrl: r.linkUrl,
    status: r.status, price: r.price, startsAt: r.startsAt, endsAt: r.endsAt,
    impressions: r.impressions, clicks: r.clicks, invoiceId: invoiceOf.get(r.id) || null,
  })));
}

// POST /api/banner-orders { planId, title, linkUrl, imageUrl, imageMobile?, startsAt? }
// Баннер үүсгээд QPay нэхэмжлэл буцаана. Төлбөр орсны дараа админ шалгаж идэвхжүүлнэ.
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const body = await req.json().catch(() => ({}));

  const planId = String(body?.planId || '');
  const title = String(body?.title || '').trim().slice(0, 80);
  const linkUrl = String(body?.linkUrl || '').trim().slice(0, 500);
  const imageUrl = String(body?.imageUrl || '').trim();
  const imageMobile = String(body?.imageMobile || '').trim();
  if (!/^[a-f\d]{24}$/i.test(planId)) return errorJson('Багц сонгоно уу', 400);
  if (title.length < 2) return errorJson('Баннерын нэр оруулна уу', 400);
  if (!isHttpUrl(linkUrl)) return errorJson('Холбоос буруу байна (https://... эсвэл /...)', 400);
  if (!isValidPublicImageUrl(imageUrl)) return errorJson('Баннерын зургаа оруулна уу', 400);
  if (imageMobile && !isValidPublicImageUrl(imageMobile)) return errorJson('Гар утасны зураг буруу байна', 400);

  const plan = await prisma.bannerPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive || !isAdSlot(plan.slot)) return errorJson('Энэ багц одоогоор боломжгүй', 404);

  const now = new Date();
  if (plan.maxPerPeriod != null) {
    const used = await prisma.banner.count({
      where: { slot: plan.slot, isPaid: true, status: { in: ['ACTIVE', 'PENDING', 'SCHEDULED'] }, endsAt: { gte: now } },
    });
    if (used >= plan.maxPerPeriod) return errorJson('Энэ байршил одоогоор дүүрсэн байна. Өөр байршил сонгоно уу.', 409);
  }

  const wanted = body?.startsAt ? new Date(body.startsAt) : now;
  const startsAt = Number.isFinite(wanted.getTime()) && wanted > now ? wanted : now;
  const endsAt = new Date(startsAt.getTime() + plan.durationDays * DAY_MS);

  const user = await prisma.user.findUnique({ where: { id: auth.id }, select: { name: true } });
  const banner = await prisma.banner.create({
    data: {
      refId: `AD-${Date.now().toString(36).toUpperCase()}`,
      title, slot: plan.slot, imageUrl, imageMobile: imageMobile || null, linkUrl, altText: title,
      entityName: user?.name || null, status: 'AWAITING_PAYMENT', startsAt, endsAt,
      isPaid: false, planId: plan.id, price: plan.price, createdById: auth.id,
    },
  });

  try {
    const invoice = await createInvoice(banner.id, plan.price, `eseller.mn баннер: ${AD_SLOTS[plan.slot].label} (${plan.durationDays} хоног)`);
    await prisma.paymentTransaction.create({
      data: {
        orderId: banner.id, method: 'qpay', invoiceId: invoice.invoiceId, amount: plan.price, status: 'PENDING',
        qrImage: invoice.qrImage || null, qrText: invoice.qrText,
        metadata: { kind: 'banner', userId: auth.id, planId: plan.id, demo: invoice.demo } as object,
      },
    });
    return json({
      bannerId: banner.id, invoiceId: invoice.invoiceId, qrImage: invoice.qrImage, qrText: invoice.qrText,
      shortUrl: invoice.shortUrl, urls: invoice.urls, demo: invoice.demo, amount: plan.price,
    });
  } catch (e) {
    console.error('[banner-orders] invoice failed:', e);
    await prisma.banner.delete({ where: { id: banner.id } }).catch(() => null);
    return errorJson('QPay нэхэмжлэл үүсгэж чадсангүй. Дахин оролдоно уу.', 502);
  }
}
