import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { getSafeImageList } from '@/lib/image-url';

// POST /api/live/[id]/purchase — buy a live product
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { id: streamId } = await ctx.params;

  try {
    const stream = await prisma.liveStream.findUnique({ where: { id: streamId } });
    if (!stream) return errorJson('Live олдсонгүй', 404);
    if (stream.status !== 'LIVE') return errorJson('Live дуусссан', 400);

    const body = await req.json();
    const { productId, quantity } = body as { productId: string; quantity?: number };
    if (!productId) return errorJson('Бүтээгдэхүүн шаардлагатай', 400);

    const qty = quantity ?? 1;
    if (qty < 1) return errorJson('Тоо ширхэг буруу', 400);

    const liveProduct = await prisma.liveProduct.findFirst({
      where: { streamId, productId },
      include: {
        product: { select: { id: true, name: true, price: true, images: true } },
      },
    });
    if (!liveProduct) return errorJson('Бүтээгдэхүүн live-д олдсонгүй', 404);

    // Check flash stock
    if (liveProduct.flashStock !== null) {
      const remaining = liveProduct.flashStock - liveProduct.soldCount;
      if (remaining < qty) {
        return errorJson(`Үлдэгдэл хүрэлцэхгүй (${remaining} ширхэг)`, 400);
      }
    }

    const unitPrice = liveProduct.flashPrice ?? liveProduct.product.price;
    const total = unitPrice * qty;
    const productImages = getSafeImageList(liveProduct.product.images);

    // Create order + update soldCount in transaction
    const [order] = await prisma.$transaction([
      prisma.order.create({
        data: {
          userId: user.id,
          shopId: stream.shopId,
          total,
          status: 'pending',
          items: [
            {
              productId: liveProduct.product.id,
              name: liveProduct.product.name,
              price: unitPrice,
              quantity: qty,
              image: productImages[0] || null,
              liveStreamId: streamId,
            },
          ],
        },
      }),
      prisma.liveProduct.update({
        where: { id: liveProduct.id },
        data: { soldCount: { increment: qty } },
      }),
    ]);

    // Post purchase message
    await prisma.liveMessage.create({
      data: {
        streamId,
        userId: user.id,
        content: `${liveProduct.product.name} x${qty} худалдан авлаа!`,
        type: 'PURCHASE',
      },
    });

    return json(order, 201);
  } catch (e: unknown) {
    return errorJson((e as Error).message, 500);
  }
}
