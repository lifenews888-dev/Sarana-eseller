import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSeller, getShopForRequest, errorJson } from '@/lib/api-auth';
import { sanitizeImageUrls } from '@/lib/image-url';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function serializeProduct<T extends { id: string }>(product: T) {
  return { ...product, _id: product.id };
}

async function getOwnedProduct(req: NextRequest, userId: string, productId: string) {
  const shopId = await getShopForRequest(req, userId);
  if (!shopId) return { shopId: null, product: null };

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      userId,
      OR: [
        { shopId },
        { shopId: null },
      ],
    },
  });

  return { shopId, product };
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const user = requireSeller(req);
  if (user instanceof NextResponse) return user;

  try {
    const { id } = await context.params;
    const { shopId, product } = await getOwnedProduct(req, user.id, id);
    if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);
    if (!product) return errorJson('Бараа олдсонгүй', 404);

    const body = await req.json();
    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        shopId,
        name: body.name ?? product.name,
        price: body.price ?? product.price,
        salePrice: body.salePrice ?? null,
        description: body.description ?? product.description,
        category: body.category ?? product.category,
        emoji: body.emoji ?? product.emoji,
        images: body.images ? sanitizeImageUrls(body.images) : product.images,
        stock: body.stock ?? product.stock,
        commission: body.commission ?? product.commission,
        deliveryFee: body.deliveryFee ?? product.deliveryFee,
        estimatedMins: body.estimatedMins ?? product.estimatedMins,
        deliveryType: body.deliveryType ?? product.deliveryType,
        allowAffiliate: body.allowAffiliate ?? product.allowAffiliate,
        affiliateCommission: body.affiliateCommission ?? product.affiliateCommission,
      },
    });

    return NextResponse.json(serializeProduct(updated));
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const user = requireSeller(req);
  if (user instanceof NextResponse) return user;

  try {
    const { id } = await context.params;
    const { shopId, product } = await getOwnedProduct(req, user.id, id);
    if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);
    if (!product) return errorJson('Бараа олдсонгүй', 404);

    await prisma.product.update({
      where: { id: product.id },
      data: { isActive: false, shopId },
    });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
