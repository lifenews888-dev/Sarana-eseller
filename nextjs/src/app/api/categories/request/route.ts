import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { getShopForUser } from '@/lib/api-auth';

// POST /api/categories/request — suggest new category
export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const { name, parentId, parentName, reason } = await req.json();
  if (!name) return errorJson('Ангилалын нэр шаардлагатай');

  const shop = await prisma.shop.findFirst({ where: { userId: user.id }, select: { name: true } });

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
