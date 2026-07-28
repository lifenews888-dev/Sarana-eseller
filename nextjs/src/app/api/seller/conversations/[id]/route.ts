import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireSeller,
  getShopForUser,
  getPreferredShopId,
  errorJson,
} from '@/lib/api-auth';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/seller/conversations/[id] — get conversation detail
export async function GET(req: NextRequest, ctx: Ctx) {
  const user = requireSeller(req);
  if (user instanceof NextResponse) return user;

  try {
    const { id } = await ctx.params;
    const shopId = await getShopForUser(user.id, getPreferredShopId(req));
    if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);

    const conversation = await prisma.conversation.findFirst({
      where: { id, shopId },
    });
    if (!conversation) return errorJson('Чат олдсонгүй', 404);

    // Enrich with customer stats when available
    let customerStats: {
      orderCount: number;
      totalSpent: number;
      phone: string | null;
    } | null = null;

    try {
      const [orderAgg, customer] = await Promise.all([
        prisma.order.aggregate({
          where: {
            userId: conversation.customerId,
            shopId,
            status: { notIn: ['cancelled', 'refunded'] },
          },
          _count: { id: true },
          _sum: { total: true },
        }).catch(() => null),
        prisma.user.findUnique({
          where: { id: conversation.customerId },
          select: { phone: true },
        }).catch(() => null),
      ]);

      customerStats = {
        orderCount: orderAgg?._count?.id ?? 0,
        totalSpent: orderAgg?._sum?.total ?? 0,
        phone: customer?.phone ?? null,
      };
    } catch {
      customerStats = null;
    }

    return NextResponse.json({ ...conversation, customerStats });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// PATCH /api/seller/conversations/[id] — update status/tag
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = requireSeller(req);
  if (user instanceof NextResponse) return user;

  try {
    const { id } = await ctx.params;
    const shopId = await getShopForUser(user.id, getPreferredShopId(req));
    if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);

    const existing = await prisma.conversation.findFirst({
      where: { id, shopId },
    });
    if (!existing) return errorJson('Чат олдсонгүй', 404);

    const body = await req.json();
    const updated = await prisma.conversation.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.tag !== undefined && { tag: body.tag }),
      },
    });

    return NextResponse.json(updated);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
