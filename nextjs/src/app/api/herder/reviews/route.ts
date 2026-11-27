import { NextRequest, NextResponse } from 'next/server';
import { json, errorJson, requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

function maskName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'Худалдан авагч';
  const first = trimmed.split(/\s+/)[0];
  return first.length <= 2 ? first : `${first.slice(0, 2)}***`;
}

// POST /api/herder/reviews { orderId, rating 1-5, text? } — хүргэгдсэн захиалгад нэг удаа
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => ({}));
  const orderId = typeof body.orderId === 'string' ? body.orderId : '';
  const rating = Math.round(Number(body.rating));
  const text = typeof body.text === 'string' ? body.text.trim().slice(0, 500) : '';

  if (!/^[a-f\d]{24}$/i.test(orderId)) return errorJson('Захиалга олдсонгүй', 404);
  if (!(rating >= 1 && rating <= 5)) return errorJson('Үнэлгээ 1-5 одтой байна');

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== auth.id) return errorJson('Захиалга олдсонгүй', 404);
  if (order.status !== 'delivered') return errorJson('Зөвхөн хүргэгдсэн захиалгад үнэлгээ өгнө');
  if (!order.shopId) return errorJson('Малчны захиалга биш байна');

  const herder = await prisma.herderShop.findUnique({ where: { shopId: order.shopId }, select: { id: true } });
  if (!herder) return errorJson('Малчны захиалга биш байна');

  const existing = await prisma.herderReview.findUnique({ where: { orderId } });
  if (existing) return errorJson('Энэ захиалгад аль хэдийн үнэлгээ өгсөн байна', 409);

  const user = await prisma.user.findUnique({ where: { id: auth.id }, select: { name: true } });
  const review = await prisma.herderReview.create({
    data: {
      herderShopId: herder.id,
      orderId,
      buyerId: auth.id,
      buyerName: maskName(user?.name || ''),
      rating,
      text,
    },
  });

  return json({
    id: review.id,
    rating: review.rating,
    text: review.text,
    createdAt: review.createdAt.toISOString(),
    buyerName: review.buyerName,
  }, 201);
}
