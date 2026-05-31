import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { getSafeImageList } from '@/lib/image-url';

// GET /api/wishlist
export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  const productIds = items.map(i => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, price: true, salePrice: true, images: true, emoji: true, category: true },
  });

  const productMap = new Map(products.map(p => [p.id, { ...p, images: getSafeImageList(p.images) }]));

  return json(items.map(i => ({
    id: i.id,
    productId: i.productId,
    product: productMap.get(i.productId) || null,
    createdAt: i.createdAt,
  })));
}

// POST /api/wishlist — add item
export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const { productId } = await req.json();
  if (!productId) return errorJson('productId шаардлагатай', 400);

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });
  if (existing) return json({ message: 'Аль хэдийн нэмэгдсэн' });

  await prisma.wishlistItem.create({ data: { userId: user.id, productId } });
  return json({ message: 'Хадгалагдлаа' });
}

// DELETE /api/wishlist
export async function DELETE(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const { productId } = await req.json();
  if (!productId) return errorJson('productId шаардлагатай', 400);

  await prisma.wishlistItem.deleteMany({ where: { userId: user.id, productId } });
  return json({ message: 'Хасагдлаа' });
}
