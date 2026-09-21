import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireAuth } from '@/lib/api-auth';
import { canSeeAffiliateSalesTools } from '@/lib/affiliate-permissions';

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8);
}

async function assertAffiliateOperator(auth: { id: string; role: string }, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
    select: { id: true, userId: true, shopId: true, allowAffiliate: true },
  });

  if (!product) return { ok: false as const, status: 404, error: 'Бараа олдсонгүй' };
  if (!product.allowAffiliate) {
    return { ok: false as const, status: 403, error: 'Энэ барааг борлуулагчаар борлуулах эрх нээгдээгүй байна' };
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

  if (!canSeeAffiliateSalesTools(role) || (!hasActiveSellerProfile && !ownsProduct && !isAdmin)) {
    return {
      ok: false as const,
      status: 403,
      error: 'Борлуулагч эрх баталгаажаагүй байна. Энэ үйлдэл зөвхөн борлуулагч, дэлгүүрийн эзэн, админд нээгдэнэ.',
    };
  }

  return { ok: true as const };
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;

  try {
    const links = await prisma.affiliateLink.findMany({
      where: { affiliateId: auth.id },
      include: { conversions: true },
      orderBy: { createdAt: 'desc' },
    });

    return json(links.map((link) => ({
      id: link.id,
      code: link.code,
      productId: link.productId,
      clicks: link.clicks,
      conversions: link.conversions.length,
      conversionRate: link.clicks > 0 ? ((link.conversions.length / link.clicks) * 100).toFixed(1) : '0',
      earnings: link.conversions.reduce((sum, conversion) => sum + conversion.commission, 0),
      pendingEarnings: link.conversions
        .filter((conversion) => conversion.status === 'pending')
        .reduce((sum, conversion) => sum + conversion.commission, 0),
      createdAt: link.createdAt,
    })));
  } catch (err) {
    console.error('[affiliate/links:get]', err);
    return errorJson('Борлуулагч линкүүд уншихад алдаа гарлаа', 500);
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;

  try {
    const { productId } = await req.json();
    if (!productId) return errorJson('productId шаардлагатай');

    const access = await assertAffiliateOperator(auth, productId);
    if (!access.ok) return errorJson(access.error, access.status);

    const existing = await prisma.affiliateLink.findFirst({
      where: { affiliateId: auth.id, productId },
    });
    if (existing) return json({ code: existing.code, id: existing.id });

    let code = generateCode();
    while (await prisma.affiliateLink.findUnique({ where: { code } })) {
      code = generateCode();
    }

    const link = await prisma.affiliateLink.create({
      data: { affiliateId: auth.id, productId, code },
    });

    return json({ code: link.code, id: link.id }, 201);
  } catch (err) {
    console.error('[affiliate/links:post]', err);
    return errorJson('Борлуулагч линк үүсгэхэд алдаа гарлаа', 500);
  }
}
