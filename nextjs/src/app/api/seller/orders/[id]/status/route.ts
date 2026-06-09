import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSeller, getShopForRequest, errorJson } from '@/lib/api-auth';
import { calculateOrderCommission } from '@/lib/commission';
import { recordRevenue } from '@/lib/revenue';
import { sendExpoPush } from '@/lib/push';

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

// PATCH /api/seller/orders/[id]/status — update order status
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = requireSeller(req);
  if (user instanceof NextResponse) return user;

  const { id } = await ctx.params;
  const body = await req.json();
  const { status, note } = body;
  const shopId = await getShopForRequest(req, user.id);
  if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);

  const order = await prisma.order.findFirst({ where: { id, shopId } });
  if (!order) return errorJson('Захиалга олдсонгүй', 404);

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
  }

  // Push buyer — status change
  const msg = STATUS_MSG[status];
  if (msg && order.userId) {
    try {
      const buyer = await prisma.user.findUnique({
        where: { id: order.userId },
        select: { pushToken: true },
      });
      if (buyer?.pushToken) {
        await sendExpoPush(buyer.pushToken, {
          title: msg.title,
          body: msg.body,
          data: { orderId: id },
        });
      }
    } catch (e) {
      console.error('Status push failed:', e);
    }
  }

  return NextResponse.json({ success: true, status });
}

// Mobile client uses PUT — alias to PATCH
export const PUT = PATCH;
