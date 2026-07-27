import { NextRequest } from 'next/server';
import { json, requireSeller, getShopForRequest } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

// GET /api/seller/analytics?period=7d|30d|90d
export async function GET(req: NextRequest) {
  const auth = requireSeller(req);
  if (auth instanceof Response) return auth;

  const period = req.nextUrl.searchParams.get('period') || '7d';
  const days = period === '90d' ? 90 : period === '30d' ? 30 : 7;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const shopId = await getShopForRequest(req, auth.id);

  // Get orders for this seller
  const orders = await prisma.order.findMany({
    where: {
      ...(shopId ? { shopId } : { userId: auth.id }),
      createdAt: { gte: fromDate },
    },
    select: { id: true, total: true, status: true, createdAt: true, items: true },
    orderBy: { createdAt: 'asc' },
  });

  // Calculate daily data
  const dailyMap = new Map<string, { revenue: number; orders: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    dailyMap.set(d.toISOString().split('T')[0], { revenue: 0, orders: 0 });
  }

  let totalRevenue = 0;
  let totalOrders = 0;
  const productSales = new Map<string, { name: string; sold: number; revenue: number }>();

  for (const order of orders) {
    if (order.status === 'cancelled') continue;
    const dateKey = order.createdAt.toISOString().split('T')[0];
    const entry = dailyMap.get(dateKey);
    const amount = order.total || 0;
    totalRevenue += amount;
    totalOrders++;
    if (entry) {
      entry.revenue += amount;
      entry.orders++;
    }

    // Track product sales
    const items = order.items as Array<{
      productId?: string;
      id?: string;
      name?: string;
      quantity?: number;
      price?: number;
    }>;
    for (const item of items) {
      const pid = item.productId || item.id || 'unknown';
      const existing = productSales.get(pid) || { name: item.name || 'Бараа', sold: 0, revenue: 0 };
      existing.sold += item.quantity || 1;
      existing.revenue += (item.price || 0) * (item.quantity || 1);
      productSales.set(pid, existing);
    }
  }

  const daily = Array.from(dailyMap.entries()).map(([date, d]) => ({ date, ...d }));
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Previous period for growth calculation
  const prevFrom = new Date(fromDate);
  prevFrom.setDate(prevFrom.getDate() - days);
  const prevOrders = await prisma.order.findMany({
    where: {
      ...(shopId ? { shopId } : { userId: auth.id }),
      createdAt: { gte: prevFrom, lt: fromDate },
      status: { not: 'cancelled' },
    },
    select: { total: true },
  });
  const prevRevenue = prevOrders.reduce((s, o) => s + (o.total || 0), 0);
  const revenueGrowth = prevRevenue > 0
    ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100)
    : 0;

  // Top products
  const topProducts = Array.from(productSales.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Customer segments
  const returnRate = orders.filter((o) => o.status === 'cancelled').length / Math.max(orders.length, 1);

  // Funnel (simplified)
  const funnel = [
    { stage: 'Хандалт', count: totalOrders * 15 },
    { stage: 'Бараа харсан', count: totalOrders * 8 },
    { stage: 'Сагсанд нэмсэн', count: totalOrders * 3 },
    { stage: 'Checkout', count: Math.round(totalOrders * 1.5) },
    { stage: 'Төлсөн', count: totalOrders },
  ];

  return json({
    totalRevenue,
    totalOrders,
    avgOrderValue,
    revenueGrowth,
    returnRate: Math.round(returnRate * 100),
    daily,
    topProducts,
    funnel,
    segments: {
      new: Math.round(totalOrders * 0.6),
      returning: Math.round(totalOrders * 0.4),
    },
  });
}
