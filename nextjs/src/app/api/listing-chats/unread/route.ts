import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, json } from '@/lib/api-auth';

// GET /api/listing-chats/unread — нэвтэрсэн хэрэглэгчийн уншаагүй зарын мессежийн тоо (цэсний тэмдэгт)
export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) return json({ count: 0 });
  const [asSeller, asBuyer] = await Promise.all([
    prisma.listingChat.aggregate({ where: { sellerId: auth.id, sellerUnread: { gt: 0 } }, _sum: { sellerUnread: true } }),
    prisma.listingChat.aggregate({ where: { buyerId: auth.id, buyerUnread: { gt: 0 } }, _sum: { buyerUnread: true } }),
  ]);
  return json({ count: (asSeller._sum.sellerUnread || 0) + (asBuyer._sum.buyerUnread || 0) });
}
