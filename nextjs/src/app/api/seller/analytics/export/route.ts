import { NextRequest, NextResponse } from 'next/server';
import { requireSeller, getShopForRequest } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

// GET /api/seller/analytics/export?format=csv&period=30d
export async function GET(req: NextRequest) {
  const auth = requireSeller(req);
  if (auth instanceof Response) return auth;

  const format = req.nextUrl.searchParams.get('format') || 'csv';
  const period = req.nextUrl.searchParams.get('period') || '30d';
  const days = period === '90d' ? 90 : period === '30d' ? 30 : 7;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const shopId = await getShopForRequest(req, auth.id);

  const orders = await prisma.order.findMany({
    where: {
      ...(shopId ? { shopId } : { userId: auth.id }),
      createdAt: { gte: fromDate },
      status: { not: 'cancelled' },
    },
    select: {
      id: true,
      orderNumber: true,
      total: true,
      status: true,
      paymentMethod: true,
      createdAt: true,
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (format === 'csv') {
    const header = 'Захиалга,Огноо,Статус,Төлбөр,Дүн,Бараа\n';
    const rows = orders
      .map((o) => {
        const items = (o.items as Array<{ name?: string }>).map((i) => i.name || '').join('; ');
        return `${o.orderNumber || o.id.slice(-6)},${o.createdAt.toISOString().split('T')[0]},${o.status},${o.paymentMethod || ''},${o.total || 0},"${items}"`;
      })
      .join('\n');

    return new NextResponse(header + rows, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="eseller-analytics-${period}.csv"`,
      },
    });
  }

  // JSON format (for PDF generation on client)
  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);

  return NextResponse.json({
    period,
    fromDate: fromDate.toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    totalOrders: orders.length,
    totalRevenue,
    orders: orders.map((o) => ({
      id: o.orderNumber || o.id.slice(-6),
      date: o.createdAt.toISOString().split('T')[0],
      status: o.status,
      total: o.total,
    })),
  });
}
