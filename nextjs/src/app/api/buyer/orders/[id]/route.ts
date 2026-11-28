import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';

// GET /api/buyer/orders/[id] — order detail for current buyer
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
  });

  if (!order) return errorJson('Захиалга олдсонгүй', 404);

  // Driver info if assigned
  let driver = null;
  if (order.driverId) {
    driver = await prisma.user.findUnique({
      where: { id: order.driverId },
      select: { id: true, name: true, phone: true, avatar: true },
    });
  }

  // Shop info
  let shop = null;
  if (order.shopId) {
    shop = await prisma.shop.findUnique({
      where: { id: order.shopId },
      select: { id: true, name: true, phone: true, logo: true },
    });
  }

  // Дундын дансны төлөв — "Хүлээн авсан" товч, автомат шилжих хугацааг харуулна
  const escrow = await prisma.escrowTransaction.findUnique({
    where: { orderId: order.id },
    select: { status: true, autoReleaseAt: true, amount: true },
  });
  const delivered = order.status === 'delivered';
  const pendingReturn = await prisma.returnRequest.findFirst({ where: { orderId: order.id, status: 'PENDING' }, select: { id: true } });

  return json({
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      items: order.items,
      delivery: order.delivery,
      deliveryAddress: order.deliveryAddress,
      paymentMethod: order.paymentMethod,
      paymentId: order.paymentId,
      driverLat: order.driverLat,
      driverLng: order.driverLng,
      trackingEvents: order.trackingEvents,
      createdAt: order.createdAt,
      driver,
      shop,
      confirmedByBuyer: !!order.confirmedByBuyer,
      escrow: escrow
        ? {
            status: escrow.status,
            amount: escrow.amount,
            autoReleaseAt: delivered && escrow.status === 'HOLDING' ? escrow.autoReleaseAt : null,
          }
        : null,
      canConfirmReceipt: !order.confirmedByBuyer && ['delivering', 'delivered'].includes(order.status) && (!escrow || escrow.status === 'HOLDING'),
      canRequestReturn: !pendingReturn && !['pending', 'cancelled', 'refunded'].includes(order.status) && (escrow ? escrow.status === 'HOLDING' : false),
      returnPending: !!pendingReturn,
    },
  });
}
