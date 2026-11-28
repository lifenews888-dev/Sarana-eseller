import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json } from '@/lib/api-auth';

// GET /api/buyer/orders — list orders for current buyer
export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return json(orders.map(o => ({
    _id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    total: o.total,
    items: o.items,
    delivery: o.delivery,
    createdAt: o.createdAt,
    escrowStatus: o.escrowStatus,
    confirmedByBuyer: !!o.confirmedByBuyer,
  })));
}
