import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireSeller, getShopForUser } from '@/lib/api-auth';

// POST /api/seller/storefront/publish
export async function POST(req: NextRequest) {
  const auth = requireSeller(req);
  if (auth instanceof Response) return auth;

  const shopId = await getShopForUser(auth.id);
  if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);

  const { subdomain } = await req.json();
  if (!subdomain || subdomain.length < 3) return errorJson('Subdomain 3+ тэмдэгт байх ёстой');

  try {
    // Check availability
    const existing = await prisma.sellerStorefront.findFirst({
      where: { subdomain, NOT: { shopId } },
    });
    if (existing) return errorJson('Энэ subdomain аль хэдийн ашиглагдаж байна');

    const result = await prisma.sellerStorefront.upsert({
      where: { shopId },
      update: { published: true, publishedAt: new Date(), subdomain },
      create: { shopId, config: {}, published: true, publishedAt: new Date(), subdomain },
    });

    return json({ published: true, subdomain, url: `${subdomain}.eseller.mn` });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === 'P2002') return errorJson('Энэ subdomain ашиглагдсан байна');
    return errorJson('Алдаа гарлаа');
  }
}
