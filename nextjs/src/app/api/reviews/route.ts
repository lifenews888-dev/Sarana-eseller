import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/api-auth';
import { sanitizeImageUrls } from '@/lib/image-url';

// GET /api/reviews?productId=xxx
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('productId');
  if (!productId) return NextResponse.json({ reviews: [], stats: null });

  const [reviews, stats] = await Promise.all([
    prisma.review.findMany({ where: { productId, status: 'APPROVED' }, orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.review.aggregate({ where: { productId, status: 'APPROVED' }, _avg: { rating: true }, _count: true }),
  ]);

  const dist = [1, 2, 3, 4, 5].map(r => ({ rating: r, count: reviews.filter(rv => rv.rating === r).length }));

  return NextResponse.json({ reviews, stats: { avg: stats._avg.rating || 0, count: stats._count }, distribution: dist });
}

// POST /api/reviews
export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Нэвтрэх шаардлагатай' }, { status: 401 });

  const { productId, rating, title, comment, images = [], orderId } = await req.json();
  if (!productId || !rating || rating < 1 || rating > 5) return NextResponse.json({ error: 'productId + rating (1-5) шаардлагатай' }, { status: 400 });

  const existing = await prisma.review.findFirst({ where: { productId, buyerId: user.id } });
  if (existing) return NextResponse.json({ error: 'Та аль хэдийн үнэлгээ өгсөн' }, { status: 400 });

  let isVerified = false;
  if (orderId) { const order = await prisma.order.findFirst({ where: { id: orderId, userId: user.id, status: 'delivered' } }); isVerified = !!order; }

  const review = await prisma.review.create({
    data: { productId, buyerId: user.id, buyerName: user.name, orderId, rating, title, comment, images: sanitizeImageUrls(images), isVerified, status: 'APPROVED' },
  });

  // Update product rating
  const agg = await prisma.review.aggregate({ where: { productId, status: 'APPROVED' }, _avg: { rating: true }, _count: true });
  await prisma.product.update({ where: { id: productId }, data: { rating: agg._avg.rating || 0, reviewCount: agg._count } });

  return NextResponse.json(review, { status: 201 });
}
