import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSeller, getShopForRequest, errorJson, json } from '@/lib/api-auth';
import { getSafeImageList } from '@/lib/image-url';

// POST /api/digital/upload — create a digital product record
export async function POST(req: NextRequest) {
  const user = requireSeller(req);
  if (user instanceof NextResponse) return user;

  try {
    const shopId = await getShopForRequest(req, user.id);
    if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);

    const body = await req.json();
    const { productId, fileUrl, fileType, fileSize, maxDownloads } = body;

    if (!productId || !fileUrl || !fileType) {
      return errorJson('productId, fileUrl, fileType шаардлагатай', 400);
    }

    // Verify product belongs to this seller
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        userId: user.id,
        OR: [
          { shopId },
          { shopId: null },
        ],
      },
    });

    if (!product) {
      return errorJson('Бүтээгдэхүүн олдсонгүй', 404);
    }

    await prisma.product.update({
      where: { id: productId },
      data: { entityType: 'DIGITAL', shopId },
    });

    // Check if digital product already exists for this product
    const existing = await prisma.digitalProduct.findUnique({
      where: { productId },
    });

    if (existing) {
      // Update existing record
      const updated = await prisma.digitalProduct.update({
        where: { productId },
        data: {
          fileUrl,
          fileType,
          fileSize: fileSize || 0,
          maxDownloads: maxDownloads || 5,
        },
      });
      return json(updated);
    }

    // Create new digital product record
    const digital = await prisma.digitalProduct.create({
      data: {
        productId,
        fileUrl,
        fileType,
        fileSize: fileSize || 0,
        maxDownloads: maxDownloads || 5,
      },
    });

    return json(digital, 201);
  } catch (e: unknown) {
    return errorJson((e as Error).message, 500);
  }
}

// GET /api/digital/upload — list seller's digital products
export async function GET(req: NextRequest) {
  const user = requireSeller(req);
  if (user instanceof NextResponse) return user;

  try {
    const shopId = await getShopForRequest(req, user.id);
    if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);

    const products = await prisma.product.findMany({
      where: {
        userId: user.id,
        OR: [
          { shopId },
          { shopId: null },
        ],
      },
      select: { id: true, name: true, price: true, images: true, emoji: true },
      orderBy: { name: 'asc' },
    });

    const digitalProducts = await prisma.digitalProduct.findMany({
      where: {
        productId: { in: products.map((p) => p.id) },
      },
      include: {
        product: { select: { id: true, name: true, price: true, emoji: true, images: true } },
        downloads: { select: { id: true } },
      },
    });

    const digitalsWithCount = digitalProducts.map((dp) => {
      const { downloads, ...rest } = dp;
      return {
        ...rest,
        product: rest.product ? { ...rest.product, images: getSafeImageList(rest.product.images) } : null,
        totalDownloads: downloads.length,
      };
    });

    return json({
      products: products.map((product) => ({ ...product, images: getSafeImageList(product.images) })),
      digitalProducts: digitalsWithCount,
    });
  } catch (e: unknown) {
    return errorJson((e as Error).message, 500);
  }
}
