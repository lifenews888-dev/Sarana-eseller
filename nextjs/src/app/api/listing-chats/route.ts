import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findRecentDuplicate } from '@/lib/listingChatDedupe';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { resolveFeedOwnerUserId } from '@/lib/feedOwnership';

const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);
const MAX_TEXT = 1000;

// GET /api/listing-chats — миний зарын чатууд (худалдан авагч ба зарын эзний аль аль талаас)
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;

  const chats = await prisma.listingChat.findMany({
    where: { OR: [{ buyerId: auth.id }, { sellerId: auth.id }] },
    orderBy: { lastAt: 'desc' },
    take: 100,
  });

  const otherIds = [...new Set(chats.map((c) => (c.buyerId === auth.id ? c.sellerId : c.buyerId)))];
  const users = otherIds.length
    ? await prisma.user.findMany({ where: { id: { in: otherIds } }, select: { id: true, name: true } })
    : [];
  const names = new Map(users.map((u) => [u.id, u.name]));

  return json(
    chats.map((c) => {
      const iAmBuyer = c.buyerId === auth.id;
      const otherId = iAmBuyer ? c.sellerId : c.buyerId;
      return {
        id: c.id,
        feedItemId: c.feedItemId,
        title: c.title,
        lastMessage: c.lastMessage,
        lastAt: c.lastAt,
        role: iAmBuyer ? 'buyer' : 'seller',
        otherName: !iAmBuyer && c.guestName
          ? `${c.guestName} (зочин)`
          : names.get(otherId) || (iAmBuyer ? 'Зарын эзэн' : 'Худалдан авагч'),
        unread: iAmBuyer ? c.buyerUnread : c.sellerUnread,
      };
    }),
  );
}

// POST /api/listing-chats { feedItemId, text } — зарын эзэнд мессеж илгээх (чат байхгүй бол үүсгэнэ)
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;

  const body = await req.json().catch(() => ({}));
  const feedItemId = String(body?.feedItemId || '');
  const text = String(body?.text || '').trim().slice(0, MAX_TEXT);
  if (!isValidObjectId(feedItemId)) return errorJson('Буруу зарын ID', 400);
  if (!text) return errorJson('Мессеж хоосон байна', 400);

  const item = await prisma.feedItem.findUnique({
    where: { id: feedItemId },
    select: {
      id: true, title: true, status: true, entityType: true, entityId: true,
      agentId: true, companyId: true, autoDealerId: true, serviceProviderId: true,
    },
  });
  if (!item || item.status !== 'active') return errorJson('Зар олдсонгүй', 404);

  const sellerId = await resolveFeedOwnerUserId(item);
  if (!sellerId) return errorJson('Зарын эзэнтэй холбогдох боломжгүй байна', 409);
  if (sellerId === auth.id) return errorJson('Өөрийн зарт мессеж бичих боломжгүй', 400);

  const existing = await prisma.listingChat.findUnique({
    where: { feedItemId_buyerId: { feedItemId, buyerId: auth.id } },
    select: { id: true },
  });
  if (existing && (await findRecentDuplicate(existing.id, auth.id, text))) return json({ chatId: existing.id });

  const chat = await prisma.listingChat.upsert({
    where: { feedItemId_buyerId: { feedItemId, buyerId: auth.id } },
    create: { feedItemId, buyerId: auth.id, sellerId, title: item.title, lastMessage: text, sellerUnread: 1 },
    update: { lastMessage: text, lastAt: new Date(), sellerUnread: { increment: 1 } },
  });
  await prisma.listingChatMessage.create({ data: { chatId: chat.id, senderId: auth.id, text } });

  return json({ chatId: chat.id });
}
