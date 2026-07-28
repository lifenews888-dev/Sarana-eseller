import { NextRequest } from 'next/server';
import { json, errorJson } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { HERDER_PROVINCES, HERDER_CATEGORIES } from '@/lib/herder-delivery';

// GET /api/herder/products?province=AKH&category=мах&page=1&limit=20
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const province = sp.get('province');
  const category = sp.get('category');
  const page = Math.max(1, Number(sp.get('page') || '1'));
  const limit = Math.min(50, Number(sp.get('limit') || '20'));
  const search = sp.get('search');

  try {
    // Build herder shop filter
    const herderWhere: Record<string, unknown> = {};
    if (province) {
      const valid = HERDER_PROVINCES.find(p => p.code === province || p.name === province);
      if (!valid) return errorJson('Буруу аймгийн код');
      herderWhere.province = valid.code;
    }

    // Get herder shops matching province filter
    const herderShops = await prisma.herderShop.findMany({
      where: herderWhere,
      select: { shopId: true, province: true, district: true, herderName: true, isVerified: true, livestockType: true },
    });

    if (herderShops.length === 0) {
      return json({ products: [], total: 0, page, pages: 0 });
    }

    const shopIds = herderShops.map(h => h.shopId);
    const herderMap = new Map(herderShops.map(h => [h.shopId, h]));

    // Build product filter
    const productWhere: Record<string, unknown> = {
      isActive: true,
      shopId: { in: shopIds },
    };

    if (category && (HERDER_CATEGORIES as readonly string[]).includes(category)) {
      productWhere.category = category;
    }

    if (search) {
      productWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: productWhere,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          shop: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.product.count({ where: productWhere }),
    ]);

    // Attach herder context to each product
    const enriched = products.map(p => {
      const shopId = p.shopId || p.shop?.id;
      const herder = shopId ? herderMap.get(shopId) : null;
      return {
        ...p,
        herder: herder
          ? {
              herderName: herder.herderName,
              province: herder.province,
              provinceName: HERDER_PROVINCES.find(pr => pr.code === herder.province)?.name || herder.province,
              district: herder.district,
              isVerified: herder.isVerified,
              livestockType: herder.livestockType,
            }
          : null,
      };
    });

    return json({
      products: enriched,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('[herder/products]', err);
    return errorJson('Малчны бүтээгдэхүүн авахад алдаа гарлаа', 500);
  }
}
