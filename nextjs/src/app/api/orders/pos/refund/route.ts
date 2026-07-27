import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getShopForRequest, requireAuth } from '@/lib/api-auth';
import { Prisma } from '@prisma/client';
import { ok, fail } from '@/lib/api-envelope';

/**
 * POST /api/orders/pos/refund
 * Body: { orderId: string, reason?: string }
 *
 * Refund a completed POS sale. Status → 'refunded', wallet balance
 * decremented by the seller's original payout. No time window.
 */
export async function POST(req: NextRequest) {
  const authUser = requireAuth(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const { orderId, reason } = (await req.json()) as {
      orderId?: string;
      reason?: string;
    };
    if (!orderId) return fail('orderId шаардлагатай', 400);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return fail('Захиалга олдсонгүй', 404);
    if (order.source !== 'pos') {
      return fail('Зөвхөн POS захиалга', 400);
    }
    if (order.status !== 'completed') {
      return fail(`Refund хийх боломжгүй (${order.status})`, 400);
    }
    if (order.refundedAt) {
      return fail('Аль хэдийн буцаагдсан', 400);
    }

    // Shop ownership check
    const shopId = await getShopForRequest(req, authUser.id);
    const shop = shopId ? await prisma.shop.findUnique({ where: { id: shopId } }) : null;
    if (!shop || order.shopId !== shop.id) {
      return fail('Энэ захиалга таных биш', 403);
    }

    const refundAmount = order.sellerAmount ?? order.total ?? 0;
    const now = new Date();

    // Update order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'refunded',
        refundReason: reason ?? 'POS буцаалт',
        refundedAt: now,
        refundedById: authUser.id,
      },
    });

    // Reverse wallet credit
    try {
      await prisma.wallet.update({
        where: { userId: authUser.id },
        data: {
          balance: { decrement: refundAmount },
          history: {
            push: {
              type: 'POS_REFUND',
              amount: -refundAmount,
              orderId,
              description: `POS буцаалт #${orderId.slice(-6).toUpperCase()}`,
              status: 'COMPLETED',
              createdAt: now.toISOString(),
            } as unknown as Prisma.InputJsonValue,
          },
        },
      });
    } catch (e) {
      console.error('POS refund wallet debit failed:', e);
    }

    return ok({
      orderId,
      refundAmount,
      status: 'refunded',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Refund алдаа';
    console.error('[POS Refund]', error);
    return fail(message, 500);
  }
}
