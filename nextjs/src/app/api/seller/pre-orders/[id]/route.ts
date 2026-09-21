import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopForRequest } from '@/lib/api-auth';

type Ctx = { params: Promise<{ id: string }> };

function toPreOrderStatus(status: unknown): string | null {
  if (status === 'pending') return 'PENDING';
  if (status === 'confirmed') return 'ADVANCE_PAID';
  if (status === 'ready') return 'ARRIVED';
  if (status === 'cancelled') return 'CANCELLED';
  return null;
}

function toDashboardStatus(status: string): 'pending' | 'confirmed' | 'cancelled' | 'ready' {
  if (status === 'CANCELLED') return 'cancelled';
  if (['ARRIVED', 'FINAL_PAID', 'DELIVERED'].includes(status)) return 'ready';
  if (['ADVANCE_PAID', 'IN_BATCH', 'SHIPPED'].includes(status)) return 'confirmed';
  return 'pending';
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireShopForRequest(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;
  const body = await req.json();
  const nextStatus = toPreOrderStatus(body.status);
  if (!nextStatus) {
    return NextResponse.json({ success: false, error: 'Буруу төлөв байна' }, { status: 400 });
  }

  const existing = await prisma.preOrderItem.findFirst({
    where: { id, product: { entityId: auth.shopId } },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: 'Захиалга олдсонгүй' }, { status: 404 });
  }

  const item = await prisma.preOrderItem.update({
    where: { id },
    data: {
      status: nextStatus,
      ...(nextStatus === 'ADVANCE_PAID' ? { advancePaidAt: new Date() } : {}),
    },
    include: {
      product: { select: { name: true, refId: true } },
    },
  });

  return NextResponse.json({
    success: true,
    order: {
      _id: item.id,
      customerName: `Хэрэглэгч ${item.buyerId.slice(-6)}`,
      product: item.product?.name || item.product?.refId || 'Урьдчилсан захиалга',
      quantity: item.quantity,
      depositPaid: Math.round(item.advanceAmount || 0),
      status: toDashboardStatus(item.status),
      createdAt: item.createdAt,
    },
  });
}
