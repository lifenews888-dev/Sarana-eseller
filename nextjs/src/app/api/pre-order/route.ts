import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeImageUrls } from '@/lib/image-url';

// GET /api/pre-order — list pre-order products
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entityId = searchParams.get('entityId');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const page = parseInt(searchParams.get('page') || '1');

    const where: any = {};
    if (entityId) where.entityId = entityId;
    if (status) where.status = status;
    if (category) where.category = category;

    const [products, total] = await Promise.all([
      prisma.preOrderProduct.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          _count: { select: { items: true, batches: true } },
        },
      }),
      prisma.preOrderProduct.count({ where }),
    ]);

    return NextResponse.json({
      data: products,
      meta: { total, page, hasMore: page * limit < total },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/pre-order — create pre-order product
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      entityId, name, description, images, emoji, sourceCountry,
      priceEstimate, advancePct, minOrderQty, maxOrderQty,
      deliveryDays, deliveryDaysMax, batchDeadline, targetOrders, category,
    } = body;

    if (!entityId || !name || !sourceCountry || !priceEstimate || !deliveryDays) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate refId
    const count = await prisma.preOrderProduct.count({ where: { entityId } });
    const refId = `PO-${entityId.slice(-4).toUpperCase()}-${String(count + 1).padStart(3, '0')}`;

    const product = await prisma.preOrderProduct.create({
      data: {
        entityId,
        refId,
        name,
        description,
        images: sanitizeImageUrls(images),
        emoji,
        sourceCountry,
        priceEstimate,
        advancePct: advancePct || 30,
        minOrderQty: minOrderQty || 1,
        maxOrderQty,
        deliveryDays,
        deliveryDaysMax,
        batchDeadline: batchDeadline ? new Date(batchDeadline) : undefined,
        targetOrders,
        category,
        status: 'OPEN',
      },
    });

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
