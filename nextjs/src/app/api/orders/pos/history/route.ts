import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { ok, fail } from '@/lib/api-envelope';

/**
 * GET /api/orders/pos/history?date=YYYY-MM-DD&page=1
 * Daily POS sales for the authenticated seller.
 */
export async function GET(req: NextRequest) {
  const authUser = requireAuth(req);
  if (authUser instanceof NextResponse) return authUser;

  try {
    const { searchParams } = new URL(req.url);
    const date =
      searchParams.get('date') ?? new Date().toISOString().split('T')[0];
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const limit = 20;

    const startOf = new Date(date);
    startOf.setHours(0, 0, 0, 0);
    const endOf = new Date(date);
    endOf.setHours(23, 59, 59, 999);

    const shop = await prisma.shop.findFirst({ where: { userId: authUser.id } });
    if (!shop) {
      return ok({
        sales: [],
        totalOrders: 0,
        totalRevenue: 0,
        refundedCount: 0,
        refundedAmount: 0,
        page,
        totalPages: 0,
        date,
      });
    }

    const where = {
      source: 'pos',
      shopId: shop.id,
      status: { in: ['completed', 'refunded', 'voided'] },
      createdAt: { gte: startOf, lte: endOf },
    };

    const [sales, totalOrders, completedAgg, refundedAgg] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
        select: {
          id: true,
          total: true,
          paymentMethod: true,
          items: true,
          vatAmount: true,
          cashReceived: true,
          change: true,
          createdAt: true,
          status: true,
          refundedAt: true,
          refundReason: true,
        },
      }),
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where: { ...where, status: 'completed' },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: { ...where, status: { in: ['refunded', 'voided'] } },
        _sum: { total: true },
        _count: true,
      }),
    ]);

    const mapped = sales.map((s) => {
      const items = Array.isArray(s.items) ? s.items : [];
      return {
        id: s.id,
        total: s.total ?? 0,
        paymentMethod: s.paymentMethod ?? 'cash',
        itemCount: items.length,
        vatAmount: s.vatAmount ?? 0,
        cashReceived: s.cashReceived ?? null,
        change: s.change ?? null,
        createdAt: s.createdAt,
        status: s.status,
        refundedAt: s.refundedAt,
        refundReason: s.refundReason,
      };
    });

    return ok({
      sales: mapped,
      totalOrders,
      totalRevenue: completedAgg._sum.total ?? 0,
      refundedCount: refundedAgg._count,
      refundedAmount: refundedAgg._sum.total ?? 0,
      page,
      totalPages: Math.ceil(totalOrders / limit),
      date,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Алдаа гарлаа';
    console.error('[POS History]', error);
    return fail(message, 500);
  }
}
