import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireDriver, json, errorJson } from '@/lib/api-auth';
import { notifyUser } from '@/lib/notify';
import { markDelivered } from '@/lib/escrow';

// POST /api/driver/orders/[id]/deliver
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireDriver(req);
  if (user instanceof NextResponse) return user;

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, driverId: user.id },
  });
  if (!order) return errorJson('Захиалга олдсонгүй', 404);
  if (order.status === 'delivered') return json({ success: true });
  // Төлбөр төлөгдөөгүй/цуцлагдсан захиалгыг хүргэсэн болгож дэлгүүрт мөнгө шилжүүлэхгүй
  if (['pending', 'cancelled', 'refunded'].includes(order.status)) {
    return errorJson('Энэ захиалгыг хүргэсэн болгох боломжгүй');
  }

  // Нэг л удаа: давхар дарсан ч дэлгүүрт хоёр удаа мөнгө орохгүй
  const marked = await prisma.order.updateMany({
    where: { id, driverId: user.id, status: { not: 'delivered' } },
    data: { status: 'delivered' },
  });
  if (marked.count === 0) return json({ success: true });

  // Төлбөр дундын дансанд үлдэнэ: худалдан авагч баталгаажуулах эсвэл 72 цагийн дараа дэлгүүрт шилжинэ
  await markDelivered(id).catch((e) => console.error('[driver/deliver] escrow:', e));

  const shop = order.shopId ? await prisma.shop.findUnique({ where: { id: order.shopId }, select: { userId: true } }) : null;
  if (shop?.userId) {
    await notifyUser(shop.userId, {
      type: 'order_status',
      title: '📦 Захиалга хүргэгдлээ',
      body: 'Худалдан авагч баталгаажуулсны дараа (эсвэл 72 цагийн дотор) орлого хэтэвчид орно',
      data: { orderId: id },
    });
  }

  return json({ success: true });
}
