import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { notifyUser } from '@/lib/notify';

// POST /api/driver/orders/[id]/accept
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, status: 'ready', driverId: null },
  });
  if (!order) return errorJson('Захиалга авах боломжгүй', 400);

  const updated = await prisma.order.update({
    where: { id },
    data: { driverId: user.id, status: 'delivering' },
  });

  // Push buyer
  await notifyUser(order.userId, {
    type: 'delivery',
    title: 'Жолооч таны захиалгыг авлаа',
    body: 'Хүргэлт замдаа гарлаа',
    data: { orderId: id },
  });

  return json({ order: updated });
}
