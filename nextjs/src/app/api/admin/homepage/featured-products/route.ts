import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminDB as requireAdmin } from '@/lib/api-auth';
import { getSafeImageList } from '@/lib/image-url';

// GET — онцлох бараа жагсаалт (product info-тай)
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const featured = await prisma.featuredProduct.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });

  // Attach product details
  const productIds = featured.map((f) => f.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, price: true, salePrice: true, images: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const result = featured.map((f) => {
    const product = productMap.get(f.productId);
    return {
      ...f,
      product: product ? { ...product, images: getSafeImageList(product.images) } : null,
    };
  });

  return NextResponse.json(result);
}

// POST — { productId } нэмэх
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const body = await req.json();
  const count = await prisma.featuredProduct.count({ where: { isActive: true } });
  if (count >= 12) {
    return NextResponse.json({ error: 'Хамгийн ихдээ 12 бараа нэмэх боломжтой' }, { status: 400 });
  }

  const existing = await prisma.featuredProduct.findFirst({
    where: { productId: body.productId },
  });
  if (existing) {
    return NextResponse.json({ error: 'Энэ бараа аль хэдийн нэмэгдсэн' }, { status: 400 });
  }

  const item = await prisma.featuredProduct.create({
    data: { productId: body.productId, order: count },
  });
  return NextResponse.json(item, { status: 201 });
}

// DELETE — { productId } хасах
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id шаардлагатай' }, { status: 400 });

  await prisma.featuredProduct.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// PUT — дараалал өөрчлөх
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const body = await req.json();
  const { orderedIds } = body as { orderedIds: string[] };

  await Promise.all(
    orderedIds.map((id, i) =>
      prisma.featuredProduct.update({ where: { id }, data: { order: i } })
    )
  );
  return NextResponse.json({ success: true });
}
