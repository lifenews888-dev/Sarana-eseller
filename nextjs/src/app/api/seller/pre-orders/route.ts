import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopForRequest } from '@/lib/api-auth';

function toDashboardStatus(status: string): 'pending' | 'confirmed' | 'cancelled' | 'ready' {
  if (status === 'CANCELLED') return 'cancelled';
  if (['ARRIVED', 'FINAL_PAID', 'DELIVERED'].includes(status)) return 'ready';
  if (['ADVANCE_PAID', 'IN_BATCH', 'SHIPPED'].includes(status)) return 'confirmed';
  return 'pending';
}

export async function GET(req: NextRequest) {
  const ctx = await requireShopForRequest(req);
  if (ctx instanceof NextResponse) return ctx;

  const items = await prisma.preOrderItem.findMany({
    where: { product: { entityId: ctx.shopId } },
    include: {
      product: { select: { name: true, refId: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const orders = items.map((item) => ({
    _id: item.id,
    customerName: `Хэрэглэгч ${item.buyerId.slice(-6)}`,
    product: item.product?.name || item.product?.refId || 'Урьдчилсан захиалга',
    quantity: item.quantity,
    depositPaid: Math.round(item.advanceAmount || 0),
    status: toDashboardStatus(item.status),
    createdAt: item.createdAt,
  }));

  return NextResponse.json({ success: true, orders });
}
