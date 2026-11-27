import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { buildOwnedFeedWhere } from '@/lib/feedOwnership';
import { createInvoice } from '@/lib/qpay';
import { FEED_VIP_DAYS, FEED_VIP_PRICE } from '@/lib/payment/settle';

type Ctx = { params: Promise<{ id: string }> };

const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);

// GET /api/feed/:id/promote — үнэ, одоогийн төлөв
export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return errorJson('Буруу зарын ID', 400);

  const ownedWhere = await buildOwnedFeedWhere(auth.id);
  const item = await prisma.feedItem.findFirst({
    where: { id, AND: [ownedWhere] },
    select: { id: true, title: true, tier: true, tierExpiresAt: true, status: true },
  });
  if (!item) return errorJson('Зар олдсонгүй эсвэл эрх хүрэхгүй байна', 404);
  return json({ item, price: FEED_VIP_PRICE, days: FEED_VIP_DAYS });
}

// POST /api/feed/:id/promote — VIP байрлалын QPay нэхэмжлэл үүсгэнэ.
// Төлбөр QPay-ээр баталгаажмагц (lib/payment/settle.ts) зар 7 хоног VIP болно.
export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return errorJson('Буруу зарын ID', 400);

  const ownedWhere = await buildOwnedFeedWhere(auth.id);
  const item = await prisma.feedItem.findFirst({
    where: { id, AND: [ownedWhere] },
    select: { id: true, title: true, status: true },
  });
  if (!item) return errorJson('Зар олдсонгүй эсвэл эрх хүрэхгүй байна', 404);
  if (item.status !== 'active') return errorJson('Идэвхтэй зарыг л VIP болгох боломжтой', 409);

  try {
    const invoice = await createInvoice(item.id, FEED_VIP_PRICE, `eseller.mn VIP зар (${FEED_VIP_DAYS} хоног)`);
    await prisma.paymentTransaction.create({
      data: {
        orderId: item.id,
        method: 'qpay',
        invoiceId: invoice.invoiceId,
        amount: FEED_VIP_PRICE,
        status: 'PENDING',
        qrImage: invoice.qrImage || null,
        qrText: invoice.qrText,
        metadata: { kind: 'feed_vip', vipDays: FEED_VIP_DAYS, userId: auth.id, demo: invoice.demo } as object,
      },
    });
    return json({
      invoiceId: invoice.invoiceId,
      qrImage: invoice.qrImage,
      qrText: invoice.qrText,
      shortUrl: invoice.shortUrl,
      urls: invoice.urls,
      demo: invoice.demo,
      amount: FEED_VIP_PRICE,
      days: FEED_VIP_DAYS,
    });
  } catch (e) {
    console.error('[feed promote] invoice failed:', e);
    return errorJson('QPay нэхэмжлэл үүсгэж чадсангүй. Дахин оролдоно уу.', 502);
  }
}
