import { NextRequest } from 'next/server';
import { json, errorJson } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { pageParams, pagesFor } from '@/lib/herder';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/herder/profile/[id]/reviews?page&limit
export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!/^[a-f\d]{24}$/i.test(id)) return errorJson('Малчин олдсонгүй', 404);
  const herder = await prisma.herderShop.findFirst({ where: { OR: [{ id }, { shopId: id }] }, select: { id: true } });
  if (!herder) return errorJson('Малчин олдсонгүй', 404);

  const { page, limit, skip } = pageParams(req.nextUrl.searchParams, 50);
  const where = { herderShopId: herder.id, isHidden: false };
  const [reviews, total] = await Promise.all([
    prisma.herderReview.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.herderReview.count({ where }),
  ]);

  return json({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      text: r.text,
      createdAt: r.createdAt.toISOString(),
      buyerName: r.buyerName,
    })),
    total,
    page,
    pages: pagesFor(total, limit),
  });
}
