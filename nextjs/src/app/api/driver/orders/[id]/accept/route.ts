import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireDriver, json, errorJson } from '@/lib/api-auth';
import { notifyUser } from '@/lib/notify';

// POST /api/driver/orders/[id]/accept
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireDriver(req);
  if (user instanceof NextResponse) return user;

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, status: 'ready', driverId: null },
  });
  if (!order) return errorJson('Захиалга авах боломжгүй', 400);

  // Хоёр жолооч зэрэг дарвал зөвхөн нэг нь авна
  const taken = await prisma.order.updateMany({
    where: { id, status: 'ready', driverId: null },
    data: { driverId: user.id, status: 'delivering' },
  });
  if (taken.count === 0) return errorJson('Захиалгыг өөр жолооч авсан', 409);
  const updated = (await prisma.order.findUnique({ where: { id } }))!;

  // Push buyer
  await notifyUser(order.userId, {
    type: 'delivery',
    title: 'Жолооч таны захиалгыг авлаа',
    body: 'Хүргэлт замдаа гарлаа',
    data: { orderId: id },
  });

  return json({ order: updated });
}
