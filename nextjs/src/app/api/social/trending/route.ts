import { prisma } from '@/lib/prisma';
import { ok } from '@/lib/api-envelope';
import { getSafeImageList } from '@/lib/image-url';

// GET /api/social/trending — top liked posts in last 24h
export async function GET() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const posts = await prisma.socialPost.findMany({
    where: { createdAt: { gte: since } },
    orderBy: [{ shares: 'desc' }, { createdAt: 'desc' }],
    take: 20,
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      products: {
        include: {
          product: {
            select: {
              id: true, name: true, price: true, salePrice: true, images: true,
            },
          },
        },
      },
      _count: { select: { likes: true, comments: true } },
    },
  });

  // Sort by likes count
  const sorted = posts.sort((a, b) => b._count.likes - a._count.likes);

  return ok({
    posts: sorted.map((post) => ({
      ...post,
      products: post.products.map((linked) => ({
        ...linked,
        product: linked.product ? { ...linked.product, images: getSafeImageList(linked.product.images) } : null,
      })),
    })),
  });
}
