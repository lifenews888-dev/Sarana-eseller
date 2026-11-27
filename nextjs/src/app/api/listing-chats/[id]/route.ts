import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findRecentDuplicate } from '@/lib/listingChatDedupe';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { isSmsConfigured, sendSms } from '@/lib/smsGateway';

type Ctx = { params: Promise<{ id: string }> };
const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);
const MAX_TEXT = 1000;

async function loadChat(id: string, userId: string) {
  if (!isValidObjectId(id)) return null;
  const chat = await prisma.listingChat.findUnique({ where: { id } });
  if (!chat || (chat.buyerId !== userId && chat.sellerId !== userId)) return null;
  return chat;
}

// GET /api/listing-chats/:id — мессежүүд (уншсан болгож тэмдэглэнэ)
export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;
  const chat = await loadChat(id, auth.id);
  if (!chat) return errorJson('Чат олдсонгүй', 404);

  const iAmBuyer = chat.buyerId === auth.id;
  const [messages] = await Promise.all([
    prisma.listingChatMessage.findMany({ where: { chatId: chat.id }, orderBy: { createdAt: 'asc' }, take: 300 }),
    prisma.listingChat.update({ where: { id: chat.id }, data: iAmBuyer ? { buyerUnread: 0 } : { sellerUnread: 0 } }),
  ]);
  const other = await prisma.user.findUnique({
    where: { id: iAmBuyer ? chat.sellerId : chat.buyerId },
    select: { name: true },
  });

  return json({
    chat: {
      id: chat.id,
      feedItemId: chat.feedItemId,
      title: chat.title,
      role: iAmBuyer ? 'buyer' : 'seller',
      otherName: !iAmBuyer && chat.guestName
        ? `${chat.guestName} (зочин)`
        : other?.name || (iAmBuyer ? 'Зарын эзэн' : 'Худалдан авагч'),
      // Зочин бүртгэлгүй тул зарын эзэнд утсыг нь харуулна (залгаж эсвэл SMS-ээр хариулж болно)
      guestPhone: !iAmBuyer ? chat.guestPhone || null : null,
    },
    messages: messages.map((m) => ({ id: m.id, text: m.text, mine: m.senderId === auth.id, createdAt: m.createdAt })),
  });
}

// POST /api/listing-chats/:id { text } — хариу бичих
export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;
  const chat = await loadChat(id, auth.id);
  if (!chat) return errorJson('Чат олдсонгүй', 404);

  const body = await req.json().catch(() => ({}));
  const text = String(body?.text || '').trim().slice(0, MAX_TEXT);
  if (!text) return errorJson('Мессеж хоосон байна', 400);

  const iAmBuyer = chat.buyerId === auth.id;
  const dup = await findRecentDuplicate(chat.id, auth.id, text);
  if (dup) return json({ id: dup.id, text: dup.text, mine: true, createdAt: dup.createdAt });
  const message = await prisma.listingChatMessage.create({ data: { chatId: chat.id, senderId: auth.id, text } });
  await prisma.listingChat.update({
    where: { id: chat.id },
    data: {
      lastMessage: text,
      lastAt: new Date(),
      ...(iAmBuyer ? { sellerUnread: { increment: 1 } } : { buyerUnread: { increment: 1 } }),
    },
  });
  // Зочинд хариулсан бол SMS-ээр мэдэгдэнэ (SMS тохируулсан үед). Холбоос нь чат руу шууд оруулна.
  if (!iAmBuyer && chat.guestPhone && isSmsConfigured()) {
    const seller = await prisma.user.findUnique({ where: { id: auth.id }, select: { name: true } }).catch(() => null);
    const preview = text.length > 60 ? `${text.slice(0, 60)}…` : text;
    sendSms(chat.guestPhone, `eseller.mn: ${seller?.name || 'Зарын эзэн'} хариулав: "${preview}" Чат: eseller.mn/messages?guest=${chat.id}`)
      .catch(() => null);
  }

  return json({ id: message.id, text: message.text, mine: true, createdAt: message.createdAt });
}
