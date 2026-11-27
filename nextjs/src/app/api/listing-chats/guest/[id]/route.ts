import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findRecentDuplicate } from '@/lib/listingChatDedupe';
import { json, errorJson } from '@/lib/api-auth';
import { guestTokenMatches, ipLimited, looksLikeSpam } from '@/lib/guestChat';

type Ctx = { params: Promise<{ id: string }> };

async function loadGuestChat(id: string, token: unknown) {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  const chat = await prisma.listingChat.findUnique({ where: { id } });
  if (!chat || !guestTokenMatches(token, chat.guestTokenHash)) return null;
  return chat;
}

// GET /api/listing-chats/guest/:id?token= — зочин өөрийн чатаа харна
export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const chat = await loadGuestChat(id, req.nextUrl.searchParams.get('token'));
  if (!chat) return errorJson('Чат олдсонгүй эсвэл холбоос хүчингүй', 404);

  const [messages, seller] = await Promise.all([
    prisma.listingChatMessage.findMany({ where: { chatId: chat.id }, orderBy: { createdAt: 'asc' }, take: 300 }),
    prisma.user.findUnique({ where: { id: chat.sellerId }, select: { name: true } }),
    prisma.listingChat.update({ where: { id: chat.id }, data: { buyerUnread: 0 } }),
  ]);
  return json({
    chat: { id: chat.id, feedItemId: chat.feedItemId, title: chat.title, role: 'buyer', otherName: seller?.name || 'Зарын эзэн', guestName: chat.guestName },
    messages: messages.map((m) => ({ id: m.id, text: m.text, mine: m.senderId === chat.buyerId, createdAt: m.createdAt })),
    unread: 0,
  });
}

// POST /api/listing-chats/guest/:id { token, text } — зочин дахин бичих
export async function POST(req: NextRequest, ctx: Ctx) {
  if (ipLimited(req, 60)) return errorJson('Хэт олон оролдлого. Түр хүлээнэ үү.', 429);
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const chat = await loadGuestChat(id, body?.token);
  if (!chat) return errorJson('Чат олдсонгүй эсвэл холбоос хүчингүй', 404);

  const text = String(body?.text || '').trim().slice(0, 1000);
  if (!text) return errorJson('Мессеж хоосон байна', 400);
  if (looksLikeSpam(text)) return errorJson('Мессежийг илгээх боломжгүй (холбоос хэт олон).', 400);

  const dup = await findRecentDuplicate(chat.id, chat.buyerId, text);
  if (dup) return json({ id: dup.id, text: dup.text, mine: true, createdAt: dup.createdAt });
  const message = await prisma.listingChatMessage.create({ data: { chatId: chat.id, senderId: chat.buyerId, text } });
  await prisma.listingChat.update({
    where: { id: chat.id },
    data: { lastMessage: text, lastAt: new Date(), sellerUnread: { increment: 1 } },
  });
  return json({ id: message.id, text: message.text, mine: true, createdAt: message.createdAt });
}
