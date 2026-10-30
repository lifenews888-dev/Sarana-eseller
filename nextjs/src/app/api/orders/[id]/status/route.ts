import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireAuth } from '@/lib/api-auth';
import { createDelivery, ilgeemjEnabled, trackingUrlFor } from '@/lib/ilgeemj';

type Ctx = { params: Promise<{ id: string }> };

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

    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return errorJson(`"${order.status}" → "${status}" шилжих боломжгүй`);
    }

    const historyEntry = { status, timestamp: new Date().toISOString(), note: note || undefined };
    const currentHistory = (order.statusHistory as any[]) || [];

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status,
        statusHistory: [...currentHistory, historyEntry],
        ...(estimatedMinutes !== undefined && { estimatedMinutes }),
      },
    });

    // Бэлэн болмогц Илгээмж рүү хүргэлт үүсгэнэ. Алдаа гарвал статус хэвээр, шалтгааныг trackingEvents-д бичнэ.
    if (status === 'ready' && ilgeemjEnabled()) {
      const full = await prisma.order.findUnique({ where: { id }, include: { user: { select: { name: true, phone: true } } } });
      try {
        const d = await createDelivery(full as any);
        const ev = { status: 'ilgeemj.created', description: `Хүргэлт #${d.code}${d.addressIssues?.length ? ` · хаяг: ${d.addressIssues.join(', ')}` : ''}`, trackingUrl: trackingUrlFor(d.publicToken), createdAt: new Date().toISOString(), source: 'ilgeemj' };
        const after = await prisma.order.update({
          where: { id },
          data: { trackingCode: d.code, trackingEvents: [...((full?.trackingEvents as unknown[]) ?? []), ev] },
        });
        return json(after);
      } catch (e) {
        const ev = { status: 'ilgeemj.error', description: (e as Error).message, createdAt: new Date().toISOString(), source: 'ilgeemj' };
        await prisma.order.update({ where: { id }, data: { trackingEvents: [...((full?.trackingEvents as unknown[]) ?? []), ev] } }).catch(() => undefined);
      }
    }

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
