import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { json, errorJson, requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { HERDER_TRANSITIONS, fromHerderOrderStatus, getMyHerderShop, toMyHerderOrder } from '@/lib/herder';
import { loadOrderContext } from '@/lib/herderOrders';
import { notifyUser } from '@/lib/notify';
import { ensureEscrow, markDelivered, refundEscrow } from '@/lib/escrow';

type Ctx = { params: Promise<{ id: string }> };

// PUT /api/herder/my/orders/[id]/status { status: preparing|shipped|delivered|cancelled, note? }
export async function PUT(req: NextRequest, ctx: Ctx) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const herder = await getMyHerderShop(auth.id);
  if (!herder) return errorJson('Малчны бүртгэл олдсонгүй', 404);

  const { id } = await ctx.params;
  if (!/^[a-f\d]{24}$/i.test(id)) return errorJson('Захиалга олдсонгүй', 404);
  const order = await prisma.order.findFirst({ where: { id, shopId: herder.shopId } });
  if (!order) return errorJson('Захиалга олдсонгүй', 404);

  const body = await req.json().catch(() => ({}));
  const next = fromHerderOrderStatus(String(body.status || ''));
  if (!next) return errorJson('Төлөв буруу байна');
  if (order.status === 'pending') return errorJson('Төлбөр төлөгдөөгүй захиалга байна');
  const allowed = HERDER_TRANSITIONS[order.status] || [];
  if (!allowed.includes(next)) return errorJson('Энэ төлөв рүү шилжүүлэх боломжгүй');

  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 300) : '';
  const history = (order.statusHistory as Prisma.JsonArray | null) || [];
  const entry = { status: next, timestamp: new Date().toISOString(), byRole: 'herder', ...(note ? { note } : {}) };

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: next,
      statusHistory: [...history, entry] as Prisma.InputJsonValue[],
    },
  });
  // Дундын данс: хүргэгдсэн → 72ц хугацаа эхэлнэ; төлөгдсөн захиалга цуцлагдвал худалдан авагчид буцаана
  if (next === 'delivered') await markDelivered(updated.id, { notifyBuyer: false }).catch((e) => console.error('[herder/status] escrow:', e));
  if (next === 'cancelled') await ensureEscrow(updated.id).then(() => refundEscrow(updated.id, 'Малчин захиалгыг цуцалсан')).catch((e) => console.error('[herder/status] refund:', e));

  const HERDER_STATUS_MSG: Record<string, string> = {
    preparing: 'Малчин таны захиалгыг бэлтгэж байна',
    delivering: 'Таны захиалга илгээгдлээ',
    delivered: 'Захиалга хүргэгдлээ. Хүлээн авсан бол баталгаажуулна уу — 72 цагийн дотор гомдол гаргаагүй бол төлбөр малчинд шилжинэ',
    cancelled: 'Малчин захиалгыг цуцаллаа. Төлсөн мөнгө таны хэтэвчид буцаагдана',
  };
  if (HERDER_STATUS_MSG[next]) {
    await notifyUser(updated.userId, {
      type: 'order_status',
      title: `Захиалга #${updated.orderNumber || updated.id.slice(-6).toUpperCase()}`,
      body: HERDER_STATUS_MSG[next],
      data: { orderId: updated.id },
    });
  }
  const ctxData = await loadOrderContext([updated]);
  return json(toMyHerderOrder(updated, ctxData.buyers.get(updated.userId) || null, ctxData.coldChain(updated)));
}
