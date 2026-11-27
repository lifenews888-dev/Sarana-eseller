import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/banner-orders/:id — төлбөр хүлээж буй баннерын QR-ийг дахин харуулна
export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;
  if (!/^[a-f\d]{24}$/i.test(id)) return errorJson('Буруу ID', 400);
  const banner = await prisma.banner.findFirst({ where: { id, createdById: auth.id } });
  if (!banner) return errorJson('Олдсонгүй', 404);
  const tx = await prisma.paymentTransaction.findFirst({ where: { orderId: id, method: 'qpay' }, orderBy: { createdAt: 'desc' } });
  return json({
    status: banner.status,
    amount: banner.price,
    invoiceId: tx?.invoiceId || null,
    qrImage: tx?.qrImage || null,
    qrText: tx?.qrText || null,
    demo: Boolean((tx?.metadata as { demo?: boolean } | null)?.demo),
  });
}

// DELETE /api/banner-orders/:id — төлөөгүй захиалгыг цуцална
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;
  if (!/^[a-f\d]{24}$/i.test(id)) return errorJson('Буруу ID', 400);
  const r = await prisma.banner.deleteMany({ where: { id, createdById: auth.id, status: 'AWAITING_PAYMENT', isPaid: false } });
  return r.count ? json({ deleted: true }) : errorJson('Зөвхөн төлөөгүй захиалгыг цуцална', 409);
}
