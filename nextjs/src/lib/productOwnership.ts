import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorJson, requireAuth, type AuthUser } from '@/lib/api-auth';

const ADMIN_ROLES = ['admin', 'superadmin', 'super_admin'];

/**
 * Барааны эзэн (бараа нэмсэн хэрэглэгч эсвэл дэлгүүрийн эзэн) эсвэл админ мөн эсэхийг шалгана.
 * Өөр хүний барааны нэмэлт, сонголтыг засах/устгахаас сэргийлнэ.
 */
export async function requireProductOwner(
  req: NextRequest,
  productId: string,
): Promise<{ user: AuthUser } | { error: NextResponse }> {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return { error: user };
  if (!/^[a-f\d]{24}$/i.test(productId)) return { error: errorJson('Бараа олдсонгүй', 404) };

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { userId: true, shopId: true } });
  if (!product) return { error: errorJson('Бараа олдсонгүй', 404) };
  if (product.userId === user.id) return { user };
  if (product.shopId) {
    const shop = await prisma.shop.findFirst({ where: { id: product.shopId, userId: user.id }, select: { id: true } });
    if (shop) return { user };
  }
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
  if (ADMIN_ROLES.includes(user.role) || ADMIN_ROLES.includes(dbUser?.role || '')) return { user };
  return { error: errorJson('Энэ барааг засах эрх байхгүй', 403) };
}
