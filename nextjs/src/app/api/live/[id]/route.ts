import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { getSafeImageList } from '@/lib/image-url';

// GET /api/live/[id] — stream detail
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  try {
    const stream = await prisma.liveStream.findUnique({
      where: { id },
      include: {
        shop: { select: { id: true, name: true, logo: true, slug: true } },
        host: { select: { id: true, name: true } },
        products: {
          orderBy: [{ isPinned: 'desc' }, { order: 'asc' }],
          include: {
            product: {
              select: { id: true, name: true, price: true, salePrice: true, images: true, stock: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!stream) return errorJson('Live олдсонгүй', 404);

    return json({
      ...stream,
      products: stream.products.map((linked) => ({
        ...linked,
        product: linked.product ? { ...linked.product, images: getSafeImageList(linked.product.images) } : null,
      })),
    });
  } catch (e: unknown) {
    return errorJson((e as Error).message, 500);
  }
}

// PUT /api/live/[id] — update stream status
export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { id } = await ctx.params;

  try {
    const body = await req.json();
    const { status } = body as { status: string };

    if (!['LIVE', 'ENDED', 'SCHEDULED'].includes(status)) {
      return errorJson('Буруу статус', 400);
    }

    const stream = await prisma.liveStream.findUnique({ where: { id } });
    if (!stream) return errorJson('Live олдсонгүй', 404);
    if (stream.hostId !== user.id) return errorJson('Зөвхөн хост өөрчлөх боломжтой', 403);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { status };
    if (status === 'LIVE') updateData.startedAt = new Date();
    if (status === 'ENDED') updateData.endedAt = new Date();

    const updated = await prisma.liveStream.update({
      where: { id },
      data: updateData,
    });

    return json(updated);
  } catch (e: unknown) {
    return errorJson((e as Error).message, 500);
  }
}
