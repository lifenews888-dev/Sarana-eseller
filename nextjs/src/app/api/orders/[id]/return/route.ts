import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { sanitizeImageUrls } from '@/lib/image-url';

// POST /api/orders/[id]/return — buyer requests return
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;
  const { id } = await params;

  const { reason, description, images = [] } = await req.json();
  if (!reason) return errorJson('Шалтгаан шаардлагатай');

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return errorJson('Захиалга олдсонгүй', 404);
  if (order.userId !== user.id) return errorJson('Зөвшөөрөлгүй', 403);

  // Check 3-day window
  if (order.confirmedAt) {
    const days = (Date.now() - new Date(order.confirmedAt).getTime()) / 86400000;
    if (days > 3) return errorJson('3 хоногийн буцаалтын хугацаа дууссан');
  }

  // Check existing return
  const existing = await prisma.returnRequest.findFirst({ where: { orderId: id, status: 'PENDING' } });
  if (existing) return errorJson('Буцаалтын хүсэлт аль хэдийн илгээгдсэн');

  // Update escrow to DISPUTED
  await prisma.escrowTransaction.updateMany({ where: { orderId: id }, data: { status: 'DISPUTED' } });
  await prisma.order.update({ where: { id }, data: { escrowStatus: 'DISPUTED' } });

  // Create return request
  const ret = await prisma.returnRequest.create({
    data: { orderId: id, buyerId: user.id, reason, description, images: sanitizeImageUrls(images) },
  });

  return json({ message: 'Буцаалтын хүсэлт илгээгдлээ', id: ret.id });
}
