import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { Prisma } from '@prisma/client';
import { ok, fail } from '@/lib/api-envelope';

const VOID_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * POST /api/orders/pos/void
 * Body: { orderId: string }
 *
 * Void a POS sale made in the last 5 minutes. Status → 'voided',
 * wallet decremented the same as refund. After 5 min use refund instead.
 */
export async function POST(req: NextRequest) {
  const authUser = requireAuth(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const { orderId } = (await req.json()) as { orderId?: string };
    if (!orderId) return fail('orderId шаардлагатай', 400);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return fail('Захиалга олдсонгүй', 404);
    if (order.source !== 'pos') {
      return fail('Зөвхөн POS захиалга', 400);
    }
    if (order.status !== 'completed') {
      return fail(`Void хийх боломжгүй (${order.status})`, 400);
    }

    // 5-min window check
    const elapsed = Date.now() - new Date(order.createdAt).getTime();
    if (elapsed > VOID_WINDOW_MS) {
      const minutes = Math.floor(elapsed / 60000);
      return fail(
        `5 минутын хугацаа өнгөрсөн (${minutes} мин) — refund ашиглана уу`,
        400,
      );
    }

    // Shop ownership check
    const shop = await prisma.shop.findFirst({ where: { userId: authUser.id } });
    if (!shop || order.shopId !== shop.id) {
      return fail('Энэ захиалга таных биш', 403);
    }

    const refundAmount = order.sellerAmount ?? order.total ?? 0;
    const now = new Date();

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'voided',
        refundReason: 'Void — 5 минутын дотор цуцалсан',
        refundedAt: now,
        refundedById: authUser.id,
      },
    });

    try {
      await prisma.wallet.update({
        where: { userId: authUser.id },
        data: {
          balance: { decrement: refundAmount },
          history: {
            push: {
              type: 'POS_VOID',
              amount: -refundAmount,
              orderId,
              description: `POS void #${orderId.slice(-6).toUpperCase()}`,
              status: 'COMPLETED',
              createdAt: now.toISOString(),
            } as unknown as Prisma.InputJsonValue,
          },
        },
      });
    } catch (e) {
      console.error('POS void wallet debit failed:', e);
    }

    return ok({
      orderId,
      refundAmount,
      status: 'voided',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Void алдаа';
    console.error('[POS Void]', error);
    return fail(message, 500);
  }
}
