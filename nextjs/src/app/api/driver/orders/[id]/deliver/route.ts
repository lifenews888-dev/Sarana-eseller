import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { notifyUser } from '@/lib/notify';

// POST /api/driver/orders/[id]/deliver
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, driverId: user.id },
  });
  if (!order) return errorJson('Захиалга олдсонгүй', 404);

  await prisma.order.update({
    where: { id },
    data: { status: 'delivered' },
  });

  // Escrow release → seller wallet (minus 5% commission)
  if (order.shopId && order.total) {
    const shop = await prisma.shop.findUnique({
      where: { id: order.shopId },
      select: { userId: true, user: { select: { pushToken: true } } },
    });
    if (shop?.userId) {
      const amount = order.total * 0.95;
      await prisma.wallet.upsert({
        where: { userId: shop.userId },
        update: { balance: { increment: amount } },
        create: { userId: shop.userId, balance: amount },
      });
      // Push seller — wallet income
      await notifyUser(shop.userId, {
        type: 'wallet',
        title: '💰 Орлого нэмэгдлээ!',
        body: `${Math.floor(amount).toLocaleString()}₮ таны хэтэвчид орлоо`,
        data: { screen: 'wallet' },
      });
    }
  }

  // Push buyer
  await notifyUser(order.userId, {
    type: 'delivery',
    title: '📦 Захиалга хүргэгдлээ!',
    body: 'Хүлээн авсан бол баталгаажуулна уу',
    data: { orderId: id, action: 'confirm' },
  });

  return json({ success: true });
}
