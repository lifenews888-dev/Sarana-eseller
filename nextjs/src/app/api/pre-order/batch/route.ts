import { requireAdmin } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/pre-order/batch — start batch processing for a product
export async function POST(req: NextRequest) {
  // Аюулгүй байдал: зөвхөн админ (өмнө нь нэвтрэлтгүй дуудагдах боломжтой байсан)
  const adminUser = requireAdmin(req);
  if (adminUser instanceof NextResponse) return adminUser;
  try {
    const body = await req.json();
    const { productId } = body;

    if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });

    const product = await prisma.preOrderProduct.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    // Count items that need batching
    const pendingItems = await prisma.preOrderItem.findMany({
      where: { productId, status: { in: ['PENDING', 'ADVANCE_PAID'] } },
    });

    if (pendingItems.length === 0) {
      return NextResponse.json({ error: 'No pending orders to batch' }, { status: 400 });
    }

    const totalQty = pendingItems.reduce((sum, item) => sum + item.quantity, 0);

    // Get next batch number
    const lastBatch = await prisma.preOrderBatch.findFirst({
      where: { productId },
      orderBy: { batchNumber: 'desc' },
    });
    const batchNumber = (lastBatch?.batchNumber || 0) + 1;

    const batch = await prisma.preOrderBatch.create({
      data: {
        productId,
        batchNumber,
        orderCount: pendingItems.length,
        totalQty,
        status: 'ORDERED',
        orderedAt: new Date(),
      },
    });

    // Update items status
    await prisma.preOrderItem.updateMany({
      where: { id: { in: pendingItems.map(i => i.id) } },
      data: { status: 'IN_BATCH' },
    });

    // Update product status
    await prisma.preOrderProduct.update({
      where: { id: productId },
      data: { status: 'ORDERED' },
    });

    return NextResponse.json({ data: batch }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}

// PATCH /api/pre-order/batch — update batch status + tracking
export async function PATCH(req: NextRequest) {
  // Аюулгүй байдал: зөвхөн админ (өмнө нь нэвтрэлтгүй дуудагдах боломжтой байсан)
  const adminUser = requireAdmin(req);
  if (adminUser instanceof NextResponse) return adminUser;
  try {
    const body = await req.json();
    const { batchId, status, trackingCode, eta } = body;

    if (!batchId || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const batch = await prisma.preOrderBatch.update({
      where: { id: batchId },
      data: {
        status,
        ...(trackingCode ? { trackingCode } : {}),
        ...(eta ? { eta: new Date(eta) } : {}),
      },
    });

    // Sync product status based on batch
    const statusMap: Record<string, string> = {
      ORDERED: 'ORDERED',
      IN_TRANSIT: 'IN_TRANSIT',
      CUSTOMS: 'CUSTOMS',
      ARRIVED: 'ARRIVED',
      DISTRIBUTED: 'COMPLETED',
    };

    if (statusMap[status]) {
      await prisma.preOrderProduct.update({
        where: { id: batch.productId },
        data: {
          status: statusMap[status],
          ...(trackingCode ? { shippingTracking: trackingCode } : {}),
        },
      });
    }

    // Update items when arrived
    if (status === 'ARRIVED') {
      await prisma.preOrderItem.updateMany({
        where: { productId: batch.productId, status: 'IN_BATCH' },
        data: { status: 'ARRIVED' },
      });
    }

    return NextResponse.json({ data: batch });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}
