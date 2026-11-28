import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { sanitizeImageUrls } from '@/lib/image-url';
import { freezeEscrow } from '@/lib/escrow';

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

  if (['pending', 'cancelled', 'refunded'].includes(order.status)) return errorJson('Энэ захиалгад буцаалт хүсэх боломжгүй');
  // Төлбөр дундын дансанд байх хугацаанд л буцаалт хүснэ (хүлээн авснаа баталгаажуулах эсвэл 72 цаг өнгөрөхөөс өмнө)
  const escrow = await prisma.escrowTransaction.findUnique({ where: { orderId: id }, select: { status: true } });
  if (escrow && escrow.status !== 'HOLDING') return errorJson('Төлбөр дэлгүүрт шилжсэн тул буцаалтын хугацаа дууссан');
  if (!escrow && order.confirmedAt) {
    const days = (Date.now() - new Date(order.confirmedAt).getTime()) / 86400000;
    if (days > 3) return errorJson('3 хоногийн буцаалтын хугацаа дууссан');
  }

  // Check existing return
  const existing = await prisma.returnRequest.findFirst({ where: { orderId: id, status: 'PENDING' } });
  if (existing) return errorJson('Буцаалтын хүсэлт аль хэдийн илгээгдсэн');

  // Шийдвэр гарах хүртэл дэлгүүрт автоматаар шилжихгүй
  await freezeEscrow(id);

  // Create return request
  const ret = await prisma.returnRequest.create({
    data: { orderId: id, buyerId: user.id, reason, description, images: sanitizeImageUrls(images) },
  });

  return json({ message: 'Буцаалтын хүсэлт илгээгдлээ', id: ret.id });
}
