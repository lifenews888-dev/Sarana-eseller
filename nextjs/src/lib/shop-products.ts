import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Нэг дэлгүүрийн нийтэд харагдах барааны шүүлтүүр. Эзэн олон дэлгүүртэй үед
 * бараа бүр зөвхөн өөрийн дэлгүүрт харагдана; shopId-гүй хадгалагдсан хуучин
 * бараа эзний хамгийн анхны дэлгүүрт харагдана (өмнө нь userId-аар шүүдэг тул
 * бүх дэлгүүрт ижил бараа давхардаж харагддаг байв).
 */
export async function shopProductWhere(shop: { id: string; userId: string }): Promise<Prisma.ProductWhereInput> {
  const oldest = await prisma.shop.findFirst({
    where: { userId: shop.userId },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  const legacy: Prisma.ProductWhereInput[] = oldest?.id === shop.id
    ? [{ userId: shop.userId, shopId: { isSet: false } }, { userId: shop.userId, shopId: null }]
    : [];
  return { isActive: true, isDemo: false, OR: [{ shopId: shop.id }, ...legacy] };
}
