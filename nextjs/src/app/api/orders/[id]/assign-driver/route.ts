import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, errorJson, json } from '@/lib/api-auth';
import { notifyUser } from '@/lib/notify';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getAuthUser(req);
  if (!user) return errorJson('Нэвтрэх шаардлагатай', 401);

  const { id } = await params;
  const { driverId } = await req.json();

  if (!driverId) return errorJson('driverId шаардлагатай', 400);

  // Find order and verify ownership
  const order = await prisma.order.findUnique({
    where: { id },
  });

  if (!order) return errorJson('Захиалга олдсонгүй', 404);

  // Verify the shop belongs to this user
  if (order.shopId) {
    const shop = await prisma.shop.findUnique({ where: { id: order.shopId } });
    if (!shop || shop.userId !== user.id) {
      return errorJson('Эрх байхгүй', 403);
    }
  }

  // Verify the driver exists and has delivery role
  const driver = await prisma.user.findUnique({
    where: { id: driverId },
    select: { id: true, name: true, role: true, pushToken: true },
  });

  if (!driver || driver.role !== 'delivery') {
    return errorJson('Жолооч олдсонгүй', 404);
  }

  // Update order with driver assignment
  const updated = await prisma.order.update({
    where: { id },
    data: {
      driverId,
      status: 'delivering',
      trackingEvents: {
        push: {
          status: 'PICKED_UP',
          description: `Жолооч ${driver.name} хуваарилагдлаа`,
          createdAt: new Date().toISOString(),
        },
      },
    },
  });

  // Send push notification to driver
  await notifyUser(driver.id, {
    type: 'delivery_assigned',
    title: 'Шинэ хүргэлт!',
    body: `Захиалга #${order.id.slice(-6)} танд хуваарилагдлаа`,
    data: { orderId: order.id, screen: 'driver-deliveries' },
  });

  return json({ order: updated });
}
