import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { getSafeImageList } from '@/lib/image-url';

// GET /api/group-buy — open group buys
export async function GET() {
  const groupBuys = await prisma.groupBuy.findMany({
    where: { status: 'OPEN', expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: {
      product: {
        select: { id: true, name: true, price: true, salePrice: true, images: true },
      },
      _count: { select: { members: true } },
    },
  });

  return NextResponse.json({
    data: {
      groupBuys: groupBuys.map((groupBuy) => ({
        ...groupBuy,
        product: groupBuy.product ? { ...groupBuy.product, images: getSafeImageList(groupBuy.product.images) } : null,
      })),
    },
  });
}

// POST /api/group-buy — create new group buy
export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { productId, targetCount, discount, hours = 48 } = await req.json();
  if (!productId || !targetCount || !discount) {
    return errorJson('productId, targetCount, discount шаардлагатай');
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return errorJson('Бараа олдсонгүй', 404);

  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  const groupBuy = await prisma.groupBuy.create({
    data: {
      productId,
      targetCount,
      discount,
      expiresAt,
      // Creator is first member
      currentCount: 1,
      members: {
        create: { userId: user.id, isPaid: false },
      },
    },
  });

  return json(groupBuy, 201);
}
