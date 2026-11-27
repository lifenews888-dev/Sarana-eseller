import { NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { json, errorJson } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { HERDER_CATEGORIES } from '@/lib/herder-delivery';
import { PUBLIC_HERDER_WHERE, findProvince, herderStats, pageParams, pagesFor, toHerderProduct } from '@/lib/herder';

// GET /api/herder/products?province=AKH&category=мах&herderId=&search=&page=1&limit=20
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const { page, limit, skip } = pageParams(sp);
  const category = sp.get('category');
  const search = sp.get('search') || sp.get('q');
  const herderId = sp.get('herderId');

  try {
    const herderWhere: Prisma.HerderShopWhereInput = { AND: [PUBLIC_HERDER_WHERE] };
    const provinceParam = sp.get('province');
    if (provinceParam) {
      const valid = findProvince(provinceParam);
      if (!valid) return errorJson('Буруу аймгийн код');
      herderWhere.province = valid.code;
    }
    if (herderId && /^[a-f\d]{24}$/i.test(herderId)) {
      herderWhere.OR = [{ id: herderId }, { shopId: herderId }];
    }

    const herderShops = await prisma.herderShop.findMany({ where: herderWhere });
    if (herderShops.length === 0) return json({ products: [], total: 0, page, pages: 0 });

    const shopIds = herderShops.map((h) => h.shopId);
    const herderMap = new Map(herderShops.map((h) => [h.shopId, h]));

    const productWhere: Prisma.ProductWhereInput = { isActive: true, shopId: { in: shopIds } };
    if (category && (HERDER_CATEGORIES as readonly string[]).includes(category)) productWhere.category = category;
    if (search) {
      productWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total, stats] = await Promise.all([
      prisma.product.findMany({ where: productWhere, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.product.count({ where: productWhere }),
      herderStats(herderShops.map((h) => h.id), shopIds),
    ]);

    return json({
      products: products.map((p) => {
        const herder = p.shopId ? herderMap.get(p.shopId) : undefined;
        return toHerderProduct(p, herder, herder ? {
          rating: stats.rating.get(herder.id)?.avg,
          orderCount: stats.orders.get(herder.shopId),
        } : undefined);
      }),
      total,
      page,
      pages: pagesFor(total, limit),
    });
  } catch (err) {
    console.error('[herder/products]', err);
    return errorJson('Малчны бүтээгдэхүүн авахад алдаа гарлаа', 500);
  }
}
