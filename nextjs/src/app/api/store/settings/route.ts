import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSeller, json, errorJson, getShopForRequest } from '@/lib/api-auth';

// GET /api/store/settings
export async function GET(req: NextRequest) {
  const user = requireSeller(req);
  if (user instanceof Response) return user;

  const shopId = await getShopForRequest(req, user.id);
  const shop = shopId ? await prisma.shop.findUnique({ where: { id: shopId } }) : null;
  if (!shop) return errorJson('Дэлгүүр олдсонгүй', 404);

  const bankInfo = await prisma.user.findUnique({ where: { id: user.id }, select: { bankInfo: true, phone: true } });

  return json({
    name: shop.name,
    slug: shop.slug,
    phone: shop.phone || bankInfo?.phone,
    address: shop.address,
    district: shop.district,
    logo: shop.logo,
    industry: shop.industry,
    allowSellers: shop.allowSellers,
    sellerCommission: shop.sellerCommission,
    storefrontSlug: shop.storefrontSlug,
    storefrontConfig: shop.storefrontConfig,
    bankInfo: bankInfo?.bankInfo,
  });
}

// PUT /api/store/settings
export async function PUT(req: NextRequest) {
  const user = requireSeller(req);
  if (user instanceof Response) return user;

  const body = await req.json();
  const shopId = await getShopForRequest(req, user.id);
  const shop = shopId ? await prisma.shop.findUnique({ where: { id: shopId } }) : null;
  if (!shop) return errorJson('Дэлгүүр олдсонгүй', 404);

  await prisma.shop.update({
    where: { id: shop.id },
    data: {
      name: body.name || shop.name,
      phone: body.phone,
      address: body.address,
      district: body.district,
      logo: body.logo,
      allowSellers: body.allowSellers,
      sellerCommission: body.sellerCommission,
      storefrontConfig: body.storefrontConfig,
    },
  });

  if (body.bankInfo) {
    await prisma.user.update({ where: { id: user.id }, data: { bankInfo: body.bankInfo } });
  }

  return json({ message: 'Хадгалагдлаа' });
}
