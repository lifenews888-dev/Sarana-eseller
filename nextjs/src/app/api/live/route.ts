import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getShopForUser, json, errorJson } from '@/lib/api-auth';
import { canCreateLive, LiveScope } from '@/lib/live-plans';
import { getSafeImageList } from '@/lib/image-url';

// GET /api/live — list streams (?my=1 for seller's own streams including ended)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isMy = searchParams.get('my') === '1';
    const scopeFilter = searchParams.get('scope');
    const statusFilter = searchParams.get('status');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let where: any = { status: { in: ['LIVE', 'SCHEDULED'] } };

    if (statusFilter) {
      where.status = statusFilter;
    }

    if (scopeFilter) {
      where.scope = scopeFilter;
    }

    if (isMy) {
      const user = requireAuth(req);
      if (user instanceof NextResponse) return user;
      const shopId = await getShopForUser(user.id);
      if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);
      where = { ...where, shopId };
      // For seller's own streams, show all statuses
      if (!statusFilter) {
        delete where.status;
      }
    }

    const streams = await prisma.liveStream.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        shop: { select: { id: true, name: true, logo: true } },
        host: { select: { id: true, name: true } },
        products: {
          include: {
            product: { select: { id: true, name: true, price: true, images: true } },
          },
        },
        _count: { select: { products: true } },
      },
    });

    const result = streams.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      thumbnailUrl: s.thumbnailUrl,
      youtubeUrl: s.youtubeUrl,
      facebookUrl: s.facebookUrl,
      muxPlaybackId: s.muxPlaybackId,
      embedType: s.embedType,
      streamKey: isMy ? s.streamKey : undefined,
      status: s.status,
      scope: s.scope,
      planRequired: s.planRequired,
      viewerCount: s.viewerCount,
      scheduledAt: s.scheduledAt,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      createdAt: s.createdAt,
      shop: s.shop,
      host: { id: s.host.id, name: s.host.name },
      products: isMy
        ? s.products.map((p) => ({
            id: p.id,
            soldCount: p.soldCount,
            flashPrice: p.flashPrice,
            product: p.product ? { ...p.product, images: getSafeImageList(p.product.images) } : null,
          }))
        : undefined,
      productCount: s._count.products,
    }));

    return json(result);
  } catch (e: unknown) {
    return errorJson((e as Error).message, 500);
  }
}

// POST /api/live — create new stream
export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  try {
    const shopId = await getShopForUser(user.id);
    if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);

    const body = await req.json();
    const { title, description, scheduledAt, productIds, youtubeUrl, facebookUrl, embedType, scope, productId } = body as {
      title: string;
      description?: string;
      scheduledAt?: string;
      productIds?: string[];
      youtubeUrl?: string;
      facebookUrl?: string;
      embedType?: string;
      scope?: string;
      productId?: string;
    };

    if (!title) return errorJson('Гарчиг шаардлагатай', 400);

    const liveScope: LiveScope = (['PUBLIC', 'SHOP', 'PRODUCT'].includes(scope || '') ? scope : 'PUBLIC') as LiveScope;

    if (liveScope === 'PRODUCT' && !productId) {
      return errorJson('PRODUCT scope-д бараа сонгох шаардлагатай', 400);
    }

    // Get shop and check plan limits
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { livePlan: true, liveCount: true, liveResetAt: true },
    });

    if (!shop) return errorJson('Дэлгүүр олдсонгүй', 404);

    const check = canCreateLive({ livePlan: shop.livePlan, liveCount: shop.liveCount }, liveScope);
    if (!check.allowed) {
      return errorJson(check.reason || 'Live үүсгэх боломжгүй', 403);
    }

    // Determine plan required based on scope
    const planRequired = liveScope === 'PRODUCT' ? 'PRO' : liveScope === 'SHOP' ? 'STANDARD' : 'BASIC';

    // Use transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      const stream = await tx.liveStream.create({
        data: {
          shopId,
          hostId: user.id,
          title,
          description: description || null,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          youtubeUrl: youtubeUrl || null,
          facebookUrl: facebookUrl || null,
          embedType: embedType || (youtubeUrl ? 'YOUTUBE' : facebookUrl ? 'FACEBOOK' : 'CUSTOM'),
          scope: liveScope,
          productId: liveScope === 'PRODUCT' && productId ? productId : null,
          planRequired,
          products: productIds?.length
            ? {
                create: productIds.map((pid, i) => ({
                  productId: pid,
                  order: i,
                })),
              }
            : undefined,
        },
        include: {
          products: { include: { product: { select: { id: true, name: true, price: true, images: true } } } },
        },
      });

      // Increment shop live count
      await tx.shop.update({
        where: { id: shopId },
        data: { liveCount: { increment: 1 } },
      });

      // If product scope, mark product as live
      if (liveScope === 'PRODUCT' && productId) {
        await tx.product.update({
          where: { id: productId },
          data: { isLive: true, currentLiveId: stream.id },
        });
      }

      return stream;
    });

    return json({
      ...result,
      products: result.products.map((linked) => ({
        ...linked,
        product: linked.product ? { ...linked.product, images: getSafeImageList(linked.product.images) } : null,
      })),
    }, 201);
  } catch (e: unknown) {
    return errorJson((e as Error).message, 500);
  }
}
