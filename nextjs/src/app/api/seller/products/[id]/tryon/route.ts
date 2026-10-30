import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSeller, getShopForUser, getPreferredShopId, errorJson } from '@/lib/api-auth';
import { parseTryOn, readTryOn } from '@/lib/tryon';

type Ctx = { params: Promise<{ id: string }> };

const OBJECT_ID = /^[a-f0-9]{24}$/i;

async function loadOwnedProduct(req: NextRequest, id: string) {
  const user = requireSeller(req);
  if (user instanceof NextResponse) return { error: user };
  if (!OBJECT_ID.test(id)) return { error: errorJson('Бараа олдсонгүй', 404) };

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, userId: true, shopId: true, metadata: true },
  });
  if (!product) return { error: errorJson('Бараа олдсонгүй', 404) };

  let owns = product.userId === user.id;
  if (!owns && product.shopId) {
    const shopId = await getShopForUser(user.id, getPreferredShopId(req));
    owns = shopId === product.shopId;
  }
  if (!owns) return { error: errorJson('Энэ барааг засах эрхгүй байна', 403) };
  return { product };
}

function baseMetadata(meta: unknown): Record<string, unknown> {
  return meta && typeof meta === 'object' && !Array.isArray(meta) ? { ...(meta as Record<string, unknown>) } : {};
}

// GET /api/seller/products/[id]/tryon — current try-on settings (owner only)
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const res = await loadOwnedProduct(req, id);
    if (res.error) return res.error;
    return NextResponse.json({ success: true, data: { tryon: readTryOn(res.product.metadata) } });
  } catch (e) {
    console.error('[tryon GET]', (e as Error).message);
    return errorJson('Уншиж чадсангүй', 500);
  }
}

// PUT /api/seller/products/[id]/tryon — save the 3D showroom / try-on image for a product
export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const res = await loadOwnedProduct(req, id);
    if (res.error) return res.error;

    const body = await req.json().catch(() => null);
    const tryon = parseTryOn(body?.tryon);
    if (!tryon) return errorJson('Өмсөж үзэх зургийн мэдээлэл буруу байна', 400);

    const metadata = { ...baseMetadata(res.product.metadata), tryon };
    await prisma.product.update({ where: { id }, data: { metadata } });
    return NextResponse.json({ success: true, data: { tryon } });
  } catch (e) {
    console.error('[tryon PUT]', (e as Error).message);
    return errorJson('Хадгалж чадсангүй', 500);
  }
}

// DELETE /api/seller/products/[id]/tryon — remove the product from the 3D showroom
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const res = await loadOwnedProduct(req, id);
    if (res.error) return res.error;
    const metadata = baseMetadata(res.product.metadata);
    delete metadata.tryon;
    await prisma.product.update({ where: { id }, data: { metadata } });
    return NextResponse.json({ success: true, data: null });
  } catch (e) {
    console.error('[tryon DELETE]', (e as Error).message);
    return errorJson('Устгаж чадсангүй', 500);
  }
}
