import { NextRequest } from 'next/server';
import { json, errorJson } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { herderStats, isActiveHerder, toHerderProduct } from '@/lib/herder';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/herder/products/[id]
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!/^[a-f\d]{24}$/i.test(id)) return errorJson('Бүтээгдэхүүн олдсонгүй', 404);

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || !product.isActive || !product.shopId) return errorJson('Бүтээгдэхүүн олдсонгүй', 404);

  const herder = await prisma.herderShop.findUnique({ where: { shopId: product.shopId } });
  if (!herder || !isActiveHerder(herder)) return errorJson('Бүтээгдэхүүн олдсонгүй', 404);

  const stats = await herderStats([herder.id], [herder.shopId]);
  return json(toHerderProduct(product, herder, {
    rating: stats.rating.get(herder.id)?.avg,
    orderCount: stats.orders.get(herder.shopId),
  }));
}
