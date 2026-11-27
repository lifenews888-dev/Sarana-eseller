import type { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireAuth } from '@/lib/api-auth';

type Ctx = { params: Promise<{ id: string }> };

const ADMIN_ROLES = ['admin', 'superadmin', 'super_admin'];

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivering', 'cancelled'],
  delivering: ['delivered'],
  delivered: [],
  cancelled: [],
};

// PATCH /api/orders/[id]/status
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;

  const { id } = await ctx.params;
  const { status, note, estimatedMinutes } = await req.json();

  if (!status) return errorJson('status шаардлагатай');

  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return errorJson('Захиалга олдсонгүй', 404);

    // Зөвхөн тухайн дэлгүүрийн эзэн, оноогдсон жолооч эсвэл админ төлөв өөрчилнө
    const isAdmin = ADMIN_ROLES.includes(auth.role) ||
      ADMIN_ROLES.includes((await prisma.user.findUnique({ where: { id: auth.id }, select: { role: true } }))?.role || '');
    const ownsShop = order.shopId
      ? !!(await prisma.shop.findFirst({ where: { id: order.shopId, userId: auth.id }, select: { id: true } }))
      : false;
    if (!isAdmin && !ownsShop && order.driverId !== auth.id) return errorJson('Захиалга олдсонгүй', 404);

    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return errorJson(`"${order.status}" → "${status}" шилжих боломжгүй`);
    }

    const historyEntry = { status, timestamp: new Date().toISOString(), note: note || undefined };
    const currentHistory = (order.statusHistory as Prisma.JsonArray | null) || [];

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status,
        statusHistory: [...currentHistory, historyEntry] as Prisma.InputJsonValue[],
        ...(estimatedMinutes !== undefined && { estimatedMinutes }),
      },
    });

    return json(updated);
  } catch {
    return errorJson('Алдаа гарлаа');
  }
}

// GET /api/orders/[id]/status — public order tracking
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, orderNumber: true, status: true, statusHistory: true, estimatedMinutes: true, total: true, createdAt: true, items: true },
    });
    if (!order) return errorJson('Захиалга олдсонгүй', 404);
    return json(order);
  } catch {
    return errorJson('Алдаа');
  }
}
