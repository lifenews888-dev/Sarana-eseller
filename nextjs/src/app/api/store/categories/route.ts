import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSeller, json, errorJson } from '@/lib/api-auth';

// GET /api/store/categories — get shop's selected categories
export async function GET(req: NextRequest) {
  const user = requireSeller(req);
  if (user instanceof Response) return user;

  const shop = await prisma.shop.findFirst({ where: { userId: user.id },
    select: { categoryIds: true },
  });

  if (!shop) return errorJson('Дэлгүүр олдсонгүй', 404);

  // Fetch full category details
  const categories = shop.categoryIds.length > 0
    ? await prisma.category.findMany({
        where: { id: { in: shop.categoryIds } },
        select: { id: true, name: true, slug: true, icon: true, level: true, parentId: true },
        orderBy: { sortOrder: 'asc' },
      })
    : [];

  return json(categories);
}

// POST /api/store/categories — save shop's selected categories
export async function POST(req: NextRequest) {
  const user = requireSeller(req);
  if (user instanceof Response) return user;

  const { categoryIds } = await req.json();
  if (!Array.isArray(categoryIds)) return errorJson('categoryIds array шаардлагатай');

  const shop = await prisma.shop.findFirst({ where: { userId: user.id } });
  if (!shop) return errorJson('Дэлгүүр олдсонгүй', 404);

  try {
    await prisma.shop.update({
      where: { id: shop.id },
      data: { categoryIds },
    });
    return json({ message: 'Ангилалууд хадгалагдлаа', count: categoryIds.length });
  } catch (e) {
    return errorJson('Хадгалж чадсангүй: ' + (e as Error).message, 500);
  }
}
