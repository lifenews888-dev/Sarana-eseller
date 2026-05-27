import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSeller, getShopForUser, errorJson } from '@/lib/api-auth';
import { checkShopLimit } from '@/lib/subscription-server';
import { sanitizeImageUrls } from '@/lib/image-url';

// POST /api/seller/products — create product with plan enforcement
export async function POST(req: NextRequest) {
  const user = requireSeller(req);
  if (user instanceof NextResponse) return user;

  try {
    const shopId = await getShopForUser(user.id);
    if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);

    // Plan enforcement
    const check = await checkShopLimit(shopId, 'product');
    if (!check.allowed) {
      return NextResponse.json({
        error: check.reason,
        currentPlan: check.currentPlan,
        requiredPlan: check.requiredPlan,
        upgradeRequired: true,
      }, { status: 403 });
    }

    const body = await req.json();

    const product = await prisma.product.create({
      data: {
        userId: user.id,
        name: body.name,
        price: body.price,
        salePrice: body.salePrice || null,
        description: body.description || null,
        category: body.category || null,
        emoji: body.emoji || null,
        images: sanitizeImageUrls(body.images),
        stock: body.stock ?? 0,
        commission: body.commission ?? 15,
        deliveryFee: body.deliveryFee || null,
        estimatedMins: body.estimatedMins || null,
        deliveryType: body.deliveryType || 'standard',
        allowAffiliate: body.allowAffiliate ?? true,
        affiliateCommission: body.affiliateCommission ?? 10,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// GET /api/seller/products — list seller's products
export async function GET(req: NextRequest) {
  const user = requireSeller(req);
  if (user instanceof NextResponse) return user;

  try {
    const products = await prisma.product.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ products });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
