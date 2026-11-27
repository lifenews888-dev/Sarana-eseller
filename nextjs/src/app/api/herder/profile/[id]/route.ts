import { NextRequest } from 'next/server';
import { json, errorJson } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { herderStats, isActiveHerder, toHerderSummary } from '@/lib/herder';

type Ctx = { params: Promise<{ id: string }> };

const LIVESTOCK_KEYS = ['horse', 'cow', 'sheep', 'goat', 'camel'];

// GET /api/herder/profile/[id] — id нь HerderShop.id эсвэл Shop.id
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!/^[a-f\d]{24}$/i.test(id)) return errorJson('Малчин олдсонгүй', 404);

  const herder = await prisma.herderShop.findFirst({
    where: { OR: [{ id }, { shopId: id }] },
    include: { shop: { select: { logo: true } } },
  });
  if (!herder || !isActiveHerder(herder)) return errorJson('Малчин олдсонгүй', 404);

  const [stats, productCount] = await Promise.all([
    herderStats([herder.id], [herder.shopId]),
    prisma.product.count({ where: { shopId: herder.shopId, isActive: true } }),
  ]);

  // Мал сүргийн тоо — зөвхөн тоон утгууд (хувийн мэдээлэл биш)
  const raw = herder.livestock && typeof herder.livestock === 'object' ? (herder.livestock as Record<string, unknown>) : {};
  const livestock: Record<string, number> = {};
  for (const key of LIVESTOCK_KEYS) {
    const n = Number(raw[key]);
    if (n > 0) livestock[key] = Math.floor(n);
  }

  const rating = stats.rating.get(herder.id);
  return json({
    ...toHerderSummary(herder, { rating: rating?.avg, orderCount: stats.orders.get(herder.shopId) }),
    bio: herder.description || undefined,
    joinedAt: herder.createdAt.toISOString(),
    livestock,
    avatar: herder.shop?.logo || undefined,
    reviewCount: rating?.count ?? 0,
    stats: { productCount },
  });
}
