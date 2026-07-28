import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { Prisma } from '@prisma/client';
import { ok, fail } from '@/lib/api-envelope';

/**
 * POST /api/orders/pos
 * POS terminal checkout — creates an instant-completed Order + credits
 * the seller's wallet. Requires auth (seller/store owner).
 *
 * Body: { items, paymentMethod, cashReceived?, total, vatIncluded, posTerminalId? }
 *   items: [{ productId, qty, price, name? }]
 */
export async function POST(req: NextRequest) {
  const authUser = requireAuth(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const body = await req.json();
    const {
      items,
      paymentMethod,
      cashReceived,
      total,
      vatIncluded,
      posTerminalId,
    } = body as {
      items?: { productId: string; qty: number; price: number; name?: string }[];
      paymentMethod?: string;
      cashReceived?: number;
      total?: number;
      vatIncluded?: boolean;
      posTerminalId?: string;
    };

    // Validation
    if (!Array.isArray(items) || items.length === 0) {
      return fail('Бараа байхгүй', 400);
    }
    if (!paymentMethod || !['cash', 'qpay', 'card'].includes(paymentMethod)) {
      return fail('Буруу төлбөрийн арга', 400);
    }
    if (typeof total !== 'number' || total <= 0) {
      return fail('Нийт дүн буруу', 400);
    }

    // Seller/store owner must have a shop
    const shop = await prisma.shop.findFirst({ where: { userId: authUser.id } });
    if (!shop) {
      return fail('Дэлгүүр олдсонгүй', 404);
    }
    if (shop.isBlocked) {
      return fail('Дэлгүүр хаагдсан', 403);
    }

    // Totals
    const vatAmount = vatIncluded === true ? Math.round((total * 10) / 110) : 0;
    const change =
      paymentMethod === 'cash' && typeof cashReceived === 'number'
        ? Math.max(0, cashReceived - total)
        : 0;

    // Normalize items as Json[] (schema stores items inline, not relational)
    const normalizedItems = items.map((i) => ({
      productId: i.productId,
      name: i.name ?? null,
      price: i.price,
      quantity: i.qty,
      subtotal: i.qty * i.price,
    }));

    // Platform fee — reuse existing Order fields
    const platformAmount = Math.round(total * 0.02); // 2%
    const sellerAmount = total - platformAmount;

    const order = await prisma.order.create({
      data: {
        userId: authUser.id, // POS — seller is the creator
        shopId: shop.id,
        items: normalizedItems as unknown as Prisma.InputJsonValue[],
        total,
        status: 'completed',
        paymentMethod,
        source: 'pos',
        posTerminalId: posTerminalId ?? null,
        cashReceived: cashReceived ?? null,
        change: change || null,
        vatAmount: vatAmount || null,
        platformAmount,
        sellerAmount,
      },
    });

    // Credit seller wallet + history entry (atomic via upsert)
    const historyEntry = {
      type: 'POS_SALE',
      amount: sellerAmount,
      orderId: order.id,
      description: `POS борлуулалт #${order.id.slice(-6).toUpperCase()}`,
      status: 'COMPLETED',
      method: paymentMethod,
      createdAt: new Date().toISOString(),
    } as unknown as Prisma.InputJsonValue;

    try {
      await prisma.wallet.upsert({
        where: { userId: authUser.id },
        create: {
          userId: authUser.id,
          balance: sellerAmount,
          pending: 0,
          escrowHold: 0,
          history: [historyEntry],
        },
        update: {
          balance: { increment: sellerAmount },
          history: { push: historyEntry },
        },
      });
    } catch (e) {
      console.error('POS wallet credit failed:', e);
    }

    return ok(
      {
        orderId: order.id,
        total,
        change,
        vatAmount,
        sellerAmount,
        platformFee: platformAmount,
      },
      201,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Захиалга үүсгэхэд алдаа гарлаа';
    console.error('[POS Order]', error);
    return fail(message, 500);
  }
}
