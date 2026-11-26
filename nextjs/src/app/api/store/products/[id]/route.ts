import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopForRequest } from '@/lib/api-auth';
import { sanitizeImageUrls } from '@/lib/image-url';
import { getSalePriceWriteError } from '@/lib/product-visibility';

type Ctx = { params: Promise<{ id: string }> };

// Дэлгүүрийн эзэн зөвхөн өөрийн идэвхтэй дэлгүүрийн барааг засна/устгана.
async function loadOwnedProduct(req: NextRequest, ctx: Ctx) {
  const session = await requireShopForRequest(req);
  if (session instanceof NextResponse) return session;
  const { id } = await ctx.params;
  if (!/^[a-f\d]{24}$/i.test(id)) {
    return NextResponse.json({ success: false, error: 'Бараа олдсонгүй' }, { status: 404 });
  }
  const product = await prisma.product.findUnique({ where: { id } });
  const owned = product && (
    product.shopId === session.shopId ||
    // Хуучин бараа shopId-гүй хадгалагдсан байж болно
    (!product.shopId && product.userId === session.user.id)
  );
  if (!product || !owned) {
    return NextResponse.json({ success: false, error: 'Бараа олдсонгүй' }, { status: 404 });
  }
  return { session, product };
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const loaded = await loadOwnedProduct(req, ctx);
  if (loaded instanceof NextResponse) return loaded;
  const body = await req.json().catch(() => ({}));

  const price = body.price !== undefined ? Number(body.price) || 0 : loaded.product.price;
  const salePrice = body.salePrice !== undefined
    ? (body.salePrice ? Number(body.salePrice) : null)
    : loaded.product.salePrice;
  const saleError = getSalePriceWriteError(price, salePrice);
  if (saleError) return NextResponse.json({ success: false, error: saleError }, { status: 400 });

  const product = await prisma.product.update({
    where: { id: loaded.product.id },
    data: {
      name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : undefined,
      price,
      salePrice,
      description: body.description !== undefined ? body.description || null : undefined,
      category: body.category !== undefined ? body.category || null : undefined,
      emoji: body.emoji !== undefined ? body.emoji || null : undefined,
      images: body.images !== undefined ? sanitizeImageUrls(body.images) : undefined,
      stock: body.stock !== undefined ? Number(body.stock) || 0 : undefined,
      commission: body.commission !== undefined ? Number(body.commission) || 0 : undefined,
      deliveryFee: body.deliveryFee !== undefined ? (body.deliveryFee ? Number(body.deliveryFee) : null) : undefined,
      isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined,
      // shopId-гүй хуучин барааг идэвхтэй дэлгүүрт холбоно
      shopId: loaded.product.shopId || loaded.session.shopId,
    },
  });
  return NextResponse.json({ success: true, data: product, product });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const loaded = await loadOwnedProduct(req, ctx);
  if (loaded instanceof NextResponse) return loaded;
  // Захиалгын түүх эвдрэхгүйн тулд бодитоор устгахгүй, идэвхгүй болгоно
  await prisma.product.update({ where: { id: loaded.product.id }, data: { isActive: false } });
  return NextResponse.json({ success: true, data: { id: loaded.product.id } });
}
