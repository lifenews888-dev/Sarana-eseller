import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { getSafeImageList } from '@/lib/image-url';

// POST /api/live/[id]/products — add product to stream
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
    if (stream.hostId !== user.id) return errorJson('Зөвхөн хост нэмэх боломжтой', 403);

    const body = await req.json();
    const { productId, flashPrice, flashStock } = body as {
      productId: string;
      flashPrice?: number;
      flashStock?: number;
    };

    if (!productId) return errorJson('Бүтээгдэхүүн шаардлагатай', 400);

    const existing = await prisma.liveProduct.findFirst({
      where: { streamId, productId },
    });
    if (existing) return errorJson('Бүтээгдэхүүн аль хэдийн нэмэгдсэн', 400);

    const count = await prisma.liveProduct.count({ where: { streamId } });

    const liveProduct = await prisma.liveProduct.create({
      data: {
        streamId,
        productId,
        flashPrice: flashPrice ?? null,
        flashStock: flashStock ?? null,
        order: count,
      },
      include: {
        product: { select: { id: true, name: true, price: true, images: true } },
      },
    });

    return json({
      ...liveProduct,
      product: liveProduct.product ? { ...liveProduct.product, images: getSafeImageList(liveProduct.product.images) } : null,
    }, 201);
  } catch (e: unknown) {
    return errorJson((e as Error).message, 500);
  }
}

// DELETE /api/live/[id]/products — remove product from stream
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { id: streamId } = await ctx.params;

  try {
    const stream = await prisma.liveStream.findUnique({ where: { id: streamId } });
    if (!stream) return errorJson('Live олдсонгүй', 404);
    if (stream.hostId !== user.id) return errorJson('Зөвхөн хост устгах боломжтой', 403);

    const body = await req.json();
    const { productId } = body as { productId: string };
    if (!productId) return errorJson('Бүтээгдэхүүн шаардлагатай', 400);

    const liveProduct = await prisma.liveProduct.findFirst({
      where: { streamId, productId },
    });
    if (!liveProduct) return errorJson('Бүтээгдэхүүн олдсонгүй', 404);

    await prisma.liveProduct.delete({ where: { id: liveProduct.id } });

    return json({ deleted: true });
  } catch (e: unknown) {
    return errorJson((e as Error).message, 500);
  }
}
