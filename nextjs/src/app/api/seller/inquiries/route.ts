import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopForRequest } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const ctx = await requireShopForRequest(req);
  if (ctx instanceof NextResponse) return ctx;

  const [bookings, conversations] = await Promise.all([
    prisma.booking.findMany({
      where: { shopId: ctx.shopId },
      include: { service: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }).catch(() => []),
    prisma.conversation.findMany({
      where: { shopId: ctx.shopId },
      orderBy: { lastAt: 'desc' },
      take: 30,
    }).catch(() => []),
  ]);

  const bookingItems = bookings.map((item) => ({
    _id: item.id,
    name: item.customerName || 'Хэрэглэгч',
    phone: item.customerPhone || '',
    email: '',
    message: item.notes || 'Цаг захиалгын хүсэлт',
    listingTitle: item.service?.name || 'Үйлчилгээ',
    status: ['cancelled', 'completed', 'no_show'].includes(item.status)
      ? 'closed'
      : ['confirmed', 'in_progress'].includes(item.status)
        ? 'contacted'
        : 'new',
    createdAt: item.createdAt,
  }));

  const chatItems = conversations.map((item) => ({
    _id: item.id,
    name: item.customerName || 'Чатын хэрэглэгч',
    phone: '',
    email: '',
    message: item.lastMessage || 'Чатын хүсэлт',
    listingTitle: item.productName || 'Чат',
    status: ['archived', 'blocked'].includes(item.status) ? 'closed' : 'new',
    createdAt: item.lastAt || item.updatedAt,
  }));

  return NextResponse.json({ inquiries: [...bookingItems, ...chatItems] });
}
