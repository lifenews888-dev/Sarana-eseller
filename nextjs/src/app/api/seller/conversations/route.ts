import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireSeller,
  getShopForUser,
  getPreferredShopId,
  errorJson,
} from '@/lib/api-auth';

// GET /api/seller/conversations — list all conversations for seller's shop
export async function GET(req: NextRequest) {
  const user = requireSeller(req);
  if (user instanceof NextResponse) return user;

  try {
    const shopId = await getShopForUser(user.id, getPreferredShopId(req));
    if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter'); // unread | order | question
    const search = searchParams.get('search');

    const where: Record<string, unknown> = { shopId, status: 'active' };
    if (filter === 'unread') where.unreadCount = { gt: 0 };
    if (filter === 'order') where.tag = 'order';
    if (filter === 'question') where.tag = 'question';
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { productName: { contains: search, mode: 'insensitive' } },
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { lastMessage: { contains: search, mode: 'insensitive' } },
      ];
    }

    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { lastAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(conversations);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
