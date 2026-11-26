import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopForRequest } from '@/lib/api-auth';
import { sanitizeImageUrls } from '@/lib/image-url';
import { checkShopLimit } from '@/lib/subscription-server';
import { getSalePriceWriteError } from '@/lib/product-visibility';

export async function GET(req: NextRequest) {
  const ctx = await requireShopForRequest(req);
  if (ctx instanceof NextResponse) return ctx;

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { shopId: ctx.shopId },
        // shopId-гүй хадгалагдсан хуучин бараанууд (эзэмшигчийнх)
        { userId: ctx.user.id, shopId: { isSet: false } },
        { userId: ctx.user.id, shopId: null },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, data: { products }, products });
}

export async function POST(req: NextRequest) {
  const ctx = await requireShopForRequest(req);
  if (ctx instanceof NextResponse) return ctx;

  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ success: false, error: 'Барааны нэр шаардлагатай' }, { status: 400 });
    }
    const saleError = getSalePriceWriteError(body.price, body.salePrice);
    if (saleError) {
      return NextResponse.json({ success: false, error: saleError }, { status: 400 });
    }

    // Багцын барааны хязгаар (үнэгүй = 20) — өмнө нь энэ endpoint дээр шалгадаггүй байв
    const limit = await checkShopLimit(ctx.shopId, 'product');
    if (!limit.allowed) {
      return NextResponse.json({
        success: false,
        error: limit.reason,
        upgradeRequired: true,
        currentPlan: limit.currentPlan,
        requiredPlan: limit.requiredPlan,
      }, { status: 403 });
    }

    const product = await prisma.product.create({
      data: {
        userId: ctx.user.id,
        shopId: ctx.shopId,
        name: body.name,
        price: Number(body.price) || 0,
        salePrice: body.salePrice ? Number(body.salePrice) : null,
        description: body.description || null,
        category: body.category || null,
        emoji: body.emoji || null,
        images: sanitizeImageUrls(body.images),
        stock: Number(body.stock) || 0,
        commission: Number(body.commission) || 15,
        metadata: body.metadata || undefined,
        deliveryFee: body.deliveryFee ? Number(body.deliveryFee) : null,
        estimatedMins: body.estimatedMins ? Number(body.estimatedMins) : null,
        deliveryType: body.deliveryType || 'standard',
        allowAffiliate: body.allowAffiliate ?? true,
        affiliateCommission: Number(body.affiliateCommission) || 10,
      },
    });

    return NextResponse.json({ success: true, product, data: product }, { status: 201 });
  } catch (error) {
    console.error('[store/products]', error);
    return NextResponse.json({ success: false, error: 'Бараа хадгалахад алдаа гарлаа' }, { status: 500 });
  }
}
