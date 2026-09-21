import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireAuth } from '@/lib/api-auth';
import { canSeeAffiliateSalesTools } from '@/lib/affiliate-permissions';

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8);
}

// POST /api/affiliate/start - start selling a product as an approved affiliate/seller.
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;

  try {
    const { productId } = await req.json();
    if (!productId) return errorJson('productId шаардлагатай');

    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
      select: { id: true, userId: true, shopId: true, allowAffiliate: true },
    });

    if (!product) return errorJson('Бараа олдсонгүй', 404);
    if (!product.allowAffiliate) {
      return errorJson('Энэ барааг борлуулагчаар борлуулах эрх нээгдээгүй байна', 403);
    }

    const [dbUser, sellerProfile, ownedShop] = await Promise.all([
      prisma.user.findUnique({ where: { id: auth.id }, select: { role: true } }),
      prisma.sellerProfile.findUnique({ where: { userId: auth.id }, select: { id: true, isActive: true } }),
      product.shopId
        ? prisma.shop.findFirst({ where: { id: product.shopId, userId: auth.id }, select: { id: true } })
        : Promise.resolve(null),
    ]);

    const role = dbUser?.role || auth.role;
    const isAdmin = ['admin', 'superadmin', 'super_admin'].includes((role || '').toLowerCase());
    const hasActiveSellerProfile = Boolean(sellerProfile?.isActive);
    const ownsProduct = product.userId === auth.id || Boolean(ownedShop);
    const isAllowedOperator =
      canSeeAffiliateSalesTools(role) && (hasActiveSellerProfile || ownsProduct || isAdmin);

    if (!isAllowedOperator) {
      return errorJson(
        'Борлуулагч эрх баталгаажаагүй байна. Энэ үйлдэл зөвхөн борлуулагч, дэлгүүрийн эзэн, админд нээгдэнэ.',
        403
      );
    }

    const existing = await prisma.affiliateLink.findFirst({
      where: { affiliateId: auth.id, productId },
    });

    if (existing) {
      return json({
        code: existing.code,
        id: existing.id,
        link: `https://eseller.mn/r/${existing.code}`,
        message: 'Энэ барааг аль хэдийн борлуулж байна',
      });
    }

    let code = generateCode();
    while (await prisma.affiliateLink.findUnique({ where: { code } })) {
      code = generateCode();
    }

    const link = await prisma.affiliateLink.create({
      data: {
        affiliateId: auth.id,
        productId,
        code,
      },
    });

    return json({
      code: link.code,
      id: link.id,
      link: `https://eseller.mn/r/${link.code}`,
      message: 'Борлуулж эхэллээ!',
    }, 201);
  } catch (err) {
    console.error('[affiliate/start]', err);
    return errorJson('Борлуулагч линк үүсгэхэд алдаа гарлаа', 500);
  }
}
