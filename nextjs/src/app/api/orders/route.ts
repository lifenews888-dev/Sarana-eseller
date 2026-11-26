import { NextRequest, NextResponse } from 'next/server';
import { priceOrder, OrderPricingError } from '@/lib/order-pricing';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getAuthUser, getPreferredShopId, getShopForUser } from '@/lib/api-auth';

function normalizeItems(items: unknown): Record<string, unknown>[] {
  return Array.isArray(items)
    ? items.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    : [];
}

function mapOrder(order: {
  id: string;
  orderNumber: string | null;
  user: { name: string } | null;
  items: unknown[];
  total: number | null;
  status: string;
  referralCode: string | null;
  delivery: unknown;
  commissions: unknown;
  createdAt: Date;
} | Record<string, unknown>) {
  const orderAny = order as Record<string, any>;
  return {
    _id: orderAny.id,
    id: orderAny.id,
    orderNumber: orderAny.orderNumber,
    user: orderAny.user || null,
    buyer: orderAny.user || null,
    items: normalizeItems(orderAny.items),
    total: orderAny.total || 0,
    status: orderAny.status,
    referralCode: orderAny.referralCode || undefined,
    delivery: orderAny.delivery || undefined,
    commissions: orderAny.commissions || undefined,
    createdAt: orderAny.createdAt,
  };
}

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Нэвтрэх шаардлагатай' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const limit = Math.min(Number(searchParams.get('limit')) || 100, 200);
  const shopId = await getShopForUser(user.id, getPreferredShopId(req));

  const where: Record<string, unknown> = ['seller', 'agent', 'company', 'auto_dealer', 'service', 'admin', 'superadmin'].includes(user.role)
    ? (shopId ? { shopId } : { userId: user.id })
    : { userId: user.id };
  if (status && status !== 'all') where.status = status;

  const orders = await prisma.order.findMany({
    where,
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json({ success: true, orders: orders.map(mapOrder) });
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Нэвтрэх шаардлагатай' }, { status: 401 });
  }

  const body = await req.json();

  // Үнэ, нийт дүнг клиентээс биш, өгөгдлийн сангаас дахин тооцоолно.
  let priced;
  try {
    priced = await priceOrder({
      items: body.items,
      couponCode: body.couponCode,
      loyaltyPoints: body.loyaltyPoints,
    });
  } catch (error) {
    if (error instanceof OrderPricingError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    throw error;
  }
  const items = priced.items;
  const total = priced.total;

  const preferredShopId = typeof body.shopId === 'string' ? body.shopId : getPreferredShopId(req);
  const count = await prisma.order.count();
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      shopId: preferredShopId || null,
      orderNumber: `ORD-${String(count + 1).padStart(6, '0')}`,
      items: items as unknown as Prisma.InputJsonValue[],
      total,
      status: 'pending',
      referralCode: typeof body.referralCode === 'string' ? body.referralCode : null,
      delivery: body.delivery || undefined,
      paymentMethod: typeof body.paymentMethod === 'string' ? body.paymentMethod : null,
      deliveryAddress: typeof body.deliveryAddress === 'string' ? body.deliveryAddress : null,
      statusHistory: [{ status: 'pending', at: new Date().toISOString(), by: user.id }],
    },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json({ success: true, order: mapOrder(order), data: mapOrder(order) }, { status: 201 });
}
