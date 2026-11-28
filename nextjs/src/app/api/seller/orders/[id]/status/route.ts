import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSeller, errorJson } from '@/lib/api-auth';
import { calculateOrderCommission } from '@/lib/commission';
import { recordRevenue } from '@/lib/revenue';
import { notifyUser } from '@/lib/notify';
import { ensureEscrow, markDelivered, refundEscrow } from '@/lib/escrow';

const STATUS_MSG: Record<string, { title: string; body: string }> = {
  preparing: {
    title: '🔄 Захиалга бэлтгэгдэж байна',
    body: 'Таны захиалгыг бэлтгэж эхэллээ',
  },
  ready: {
    title: '✅ Захиалга бэлэн боллоо',
    body: 'Жолоочид шилжүүлж байна',
  },
  handed_to_driver: {
    title: '🚚 Жолооч захиалгыг авлаа',
    body: 'Удахгүй хүргэгдэнэ',
  },
};

type Ctx = { params: Promise<{ id: string }> };

const SELLER_STATUSES = ['confirmed', 'preparing', 'ready', 'handed_to_driver', 'delivering', 'delivered', 'cancelled'];

// PATCH /api/seller/orders/[id]/status — update order status
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = requireSeller(req);
  if (user instanceof NextResponse) return user;

  const { id } = await ctx.params;
  const body = await req.json();
  const { status, note } = body;

  if (!/^[a-f\d]{24}$/i.test(id)) return errorJson('Захиалга олдсонгүй', 404);
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return errorJson('Захиалга олдсонгүй', 404);

  // Аюулгүй байдал: зөвхөн тухайн захиалгын дэлгүүрийн эзэн өөрчилнө (өмнө нь нэвтэрсэн хэн ч болдог байв)
  const ownsShop = order.shopId
    ? await prisma.shop.findFirst({ where: { id: order.shopId, userId: user.id }, select: { id: true } })
    : null;
  if (!ownsShop) return errorJson('Захиалга олдсонгүй', 404);

  if (!SELLER_STATUSES.includes(status)) return errorJson('Төлөв буруу байна');
  if (order.status === status) return NextResponse.json({ success: true, status });
  if (['delivered', 'cancelled', 'refunded', 'completed'].includes(order.status)) {
    return errorJson('Дууссан захиалгын төлвийг өөрчлөх боломжгүй');
  }
  // Төлбөр төлөгдөөгүй захиалгыг зөвхөн цуцлах боломжтой
  if (order.status === 'pending' && status !== 'cancelled') {
    return errorJson('Төлбөр төлөгдөөгүй захиалга байна');
  }

  // Update order
  await prisma.order.update({
    where: { id },
    data: { status },
  });

  // Log event
  await prisma.orderEvent.create({
    data: { orderId: id, status, note: note || null, updatedBy: user.id },
  });

  // On delivery completion, calculate commission
  if (status === 'delivered' && order.total && order.shopId) {
    const hasAffiliate = !!order.referralCode;
    const comm = await calculateOrderCommission(order.shopId, order.total, hasAffiliate);

    await prisma.order.update({
      where: { id },
      data: {
        platformAmount: comm.platformAmount,
        sellerAmount: comm.sellerAmount,
        affiliateAmount: comm.affiliateAmount,
      },
    });

    await recordRevenue('commission', comm.platformAmount, { orderId: id, shopId: order.shopId });
    await markDelivered(id).catch((e) => console.error('[seller/status] escrow:', e));
  }

  // Төлөгдсөн захиалгыг дэлгүүр цуцалбал мөнгийг худалдан авагчид буцаана
  if (status === 'cancelled' && order.status !== 'pending') {
    await ensureEscrow(id).then(() => refundEscrow(id, 'Дэлгүүр захиалгыг цуцалсан')).catch((e) => console.error('[seller/status] refund:', e));
  }

  // Push buyer — status change
  const msg = STATUS_MSG[status];
  if (msg && order.userId) {
    await notifyUser(order.userId, { type: 'order_status', title: msg.title, body: msg.body, data: { orderId: id } });
  }

  return NextResponse.json({ success: true, status });
}

// Mobile client uses PUT — alias to PATCH
export const PUT = PATCH;
