import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { getSafeImageList, sanitizeImageUrls } from '@/lib/image-url';

function serializePost<
  T extends {
    images: unknown;
    products: Array<{ product: ({ images: unknown } & Record<string, unknown>) | null }>;
  },
>(post: T) {
  return {
    ...post,
    images: getSafeImageList(post.images),
    products: post.products.map((linked) => ({
      ...linked,
      product: linked.product ? { ...linked.product, images: getSafeImageList(linked.product.images) } : null,
    })),
  };
}

// GET /api/social/feed?page=1&limit=20
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get('page') || '1'));
  const limit = Math.min(50, Number(sp.get('limit') || '20'));
  const skip = (page - 1) * limit;

  try {
    const [posts, total] = await Promise.all([
      prisma.socialPost.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  salePrice: true,
                  images: true,
                },
              },
            },
          },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      prisma.socialPost.count(),
    ]);

    return json({
      posts: posts.map(serializePost),
      meta: { total, page, limit, hasMore: page * limit < total },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorJson('Feed load failed: ' + message, 500);
  }
}

// POST /api/social/feed - create new social post
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;

  try {
    const body = await req.json();
    const { content, images, productIds } = body as {
      content?: string;
      images?: string[];
      productIds?: string[];
    };
    const safeImages = sanitizeImageUrls(images);

    if (!content && safeImages.length === 0) {
      return errorJson('Content or image is required');
    }

    const post = await prisma.socialPost.create({
      data: {
        userId: auth.id,
        content: content || null,
        images: safeImages,
        products:
          productIds && productIds.length > 0
            ? {
                create: productIds.map((pid: string) => ({
                  productId: pid,
                })),
              }
            : undefined,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                salePrice: true,
                images: true,
              },
            },
          },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });

    return json(serializePost(post), 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorJson('Post create failed: ' + message, 500);
  }
}
