import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';

// GET /api/driver/revenue
export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;
  if (user.role !== 'delivery' && user.role !== 'admin') return errorJson('Зөвхөн жолооч', 403);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const allOrders = await prisma.order.findMany({
    where: { status: 'delivered' },
    select: { total: true, createdAt: true, delivery: true },
  });
  // Filter by driverId from delivery JSON
  const allDelivered = allOrders.filter(o => (o.delivery as { driverId?: string } | null)?.driverId === user.id);

  const todayRevenue = allDelivered.filter(o => o.createdAt >= today).reduce((s, o) => s + (o.total || 0) * 0.1, 0);
  const monthRevenue = allDelivered.filter(o => o.createdAt >= monthStart).reduce((s, o) => s + (o.total || 0) * 0.1, 0);
  const totalRevenue = allDelivered.reduce((s, o) => s + (o.total || 0) * 0.1, 0);
  const totalDeliveries = allDelivered.length;

  return json({ todayRevenue: Math.round(todayRevenue), monthRevenue: Math.round(monthRevenue), totalRevenue: Math.round(totalRevenue), totalDeliveries });
}
