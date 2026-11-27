import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminDB as requireAdmin } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;

    // ?type=listing — зарын булангийн худалдан авагч ↔ зарын эзний чатууд
    if (searchParams.get('type') === 'listing') {
      const [rows, total] = await Promise.all([
        prisma.listingChat.findMany({ orderBy: { lastAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
        prisma.listingChat.count(),
      ]);
      const ids = [...new Set(rows.flatMap((r) => [r.buyerId, r.sellerId]))];
      const users = ids.length
        ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, email: true, role: true, avatar: true } })
        : [];
      const um = Object.fromEntries(users.map((u) => [u.id, u]));
      const chats = rows.map((r) => ({
        id: r.id,
        shopId: r.feedItemId,
        customer: um[r.buyerId] || (r.guestName ? { id: r.buyerId, name: `${r.guestName} (зочин)`, email: r.guestPhone || undefined, role: 'guest' } : { id: r.buyerId, name: 'Хэрэглэгч', role: 'buyer' }),
        context: `Зар: ${r.title || ''} → ${um[r.sellerId]?.name || 'Зарын эзэн'}`,
        lastMessage: r.lastMessage,
        lastAt: r.lastAt,
        status: r.status === 'blocked' ? 'blocked' : 'active',
        blockedReason: r.blockedReason || undefined,
        unreadCount: r.sellerUnread,
        createdAt: r.createdAt,
      }));
      return NextResponse.json({ chats, total, page });
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        orderBy: { lastAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.conversation.count(),
    ]);

    // Enrich with participant info
    const customerIds = [...new Set(conversations.map(c => c.customerId))];
    const users = customerIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, name: true, email: true, role: true, avatar: true },
        })
      : [];
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    const enriched = conversations.map(c => ({
      id: c.id,
      shopId: c.shopId,
      customer: userMap[c.customerId] || { id: c.customerId, name: c.customerName, role: 'buyer' },
      lastMessage: c.lastMessage,
      lastAt: c.lastAt,
      status: c.status,
      unreadCount: c.unreadCount,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ chats: enriched, total, page });
  } catch (error) {
    console.error('[admin/chats]:', error);
    return NextResponse.json({ chats: [], total: 0, page: 1 });
  }
}
