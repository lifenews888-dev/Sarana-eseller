import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson, getShopForRequest } from '@/lib/api-auth';

// POST /api/categories/request — suggest new category
export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const { name, parentId, parentName, reason } = await req.json();
  if (!name) return errorJson('Ангилалын нэр шаардлагатай');

  const shopId = await getShopForRequest(req, user.id);
  const shop = shopId ? await prisma.shop.findUnique({ where: { id: shopId }, select: { name: true } }) : null;

  await prisma.categoryRequest.create({
    data: {
      name,
      parentId: parentId || null,
      parentName: parentName || null,
      reason: reason || null,
      requestedBy: user.id,
      shopName: shop?.name || null,
    },
  });

  return json({ message: 'Ангилалын хүсэлт илгээгдлээ. Admin зөвшөөрсний дараа нэмэгдэнэ.' });
}
