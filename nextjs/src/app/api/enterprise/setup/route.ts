import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson, getShopForRequest } from '@/lib/api-auth';
import { invalidateShopCache } from '@/lib/shop-cache';

// POST /api/enterprise/setup — create enterprise shop
export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { subdomain, primaryColor, accentColor, logoUrl } = await req.json();
  if (!subdomain) return errorJson('Subdomain шаардлагатай');

  // Validate subdomain
  const clean = subdomain.toLowerCase().trim();
  if (!/^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/.test(clean)) {
    return errorJson('Subdomain формат буруу');
  }

  // Get user's shop
  const shopId = await getShopForRequest(req, user.id);
  const shop = shopId ? await prisma.shop.findUnique({ where: { id: shopId } }) : null;
  if (!shop) return errorJson('Дэлгүүр олдсонгүй', 404);

  // Check existing
  const existing = await prisma.enterpriseShop.findUnique({ where: { shopId: shop.id } });
  if (existing) return errorJson('Enterprise аль хэдийн идэвхжсэн');

  // Check subdomain availability
  const taken = await prisma.enterpriseShop.findUnique({ where: { subdomain: clean } });
  if (taken) return errorJson('Subdomain аль хэдийн бүртгэлтэй');

  const enterprise = await prisma.enterpriseShop.create({
    data: {
      shopId: shop.id,
      subdomain: clean,
      primaryColor: primaryColor || '#1B3A5C',
      accentColor: accentColor || '#E67E22',
      logoUrl,
      plan: 'STARTER',
    },
  });

  // Create owner as enterprise user
  await prisma.enterpriseUser.create({
    data: {
      shopId: shop.id,
      userId: user.id,
      role: 'OWNER',
      permissions: ['*'],
    },
  });

  // Invalidate cache
  await invalidateShopCache(clean);

  return json({ enterprise, url: `https://${clean}.eseller.mn` });
}
