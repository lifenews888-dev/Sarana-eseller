import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson } from '@/lib/api-auth';
import { resolveFeedOwnerUserId } from '@/lib/feedOwnership';
import { normalizeMnPhone } from '@/lib/phoneOtp';
import { checkNewChatText } from '@/lib/chatModeration';
import { newGuestToken, hashGuestToken, randomObjectId, ipLimited, looksLikeSpam } from '@/lib/guestChat';
import { checkRateLimit } from '@/lib/rate-limit';

const MAX_NEW_CHATS_PER_PHONE_PER_DAY = 5;

// POST /api/listing-chats/guest { feedItemId, name, phone, text, website? }
// Бүртгэлгүй хэрэглэгч зарын эзэнд мессеж илгээнэ. Хариуг харах токен буцаана.
export async function POST(req: NextRequest) {
  if (checkRateLimit(req).limited) {
    return Response.json({ success: false, error: 'Хэт олон хүсэлт. Түр хүлээгээд дахин оролдоно уу.' }, { status: 429 });
  }
  if (ipLimited(req)) return errorJson('Хэт олон оролдлого. Түр хүлээгээд дахин оролдоно уу.', 429);

  const body = await req.json().catch(() => ({}));
  // Honeypot: хүн бөглөхгүй нууц талбар — бот бөглөвөл чимээгүй "амжилттай" гэж хариулна
  if (body?.website) return json({ chatId: null, token: null });

  const feedItemId = String(body?.feedItemId || '');
  const name = String(body?.name || '').trim().slice(0, 40);
  const phone = normalizeMnPhone(body?.phone);
  const text = String(body?.text || '').trim().slice(0, 1000);

  if (!/^[a-f\d]{24}$/i.test(feedItemId)) return errorJson('Буруу зарын ID', 400);
  if (name.length < 2) return errorJson('Нэрээ оруулна уу', 400);
  if (!phone) return errorJson('Утасны дугаараа зөв оруулна уу (8 оронтой)', 400);
  if (!text) return errorJson('Мессеж хоосон байна', 400);
  if (looksLikeSpam(text)) return errorJson('Мессежийг илгээх боломжгүй (холбоос хэт олон).', 400);

  const mod = await checkNewChatText(text);
  if (!mod.ok) return errorJson(mod.error, mod.status);
  // Админ эсвэл spam шүүлт хаасан дугаараас шинэ чат эхлүүлэхгүй
  const blockedPhone = await prisma.listingChat.findFirst({ where: { guestPhone: phone, status: 'blocked' }, select: { id: true } });
  if (blockedPhone) return errorJson('Энэ дугаараас чат бичих эрхийг хаасан байна.', 403);

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await prisma.listingChat.count({ where: { guestPhone: phone, createdAt: { gt: since } } });
  if (recent >= MAX_NEW_CHATS_PER_PHONE_PER_DAY) {
    return errorJson('Энэ дугаараас өнөөдөр хэт олон чат эхлүүлсэн байна. Бүртгүүлээд үргэлжлүүлнэ үү.', 429);
  }

  const item = await prisma.feedItem.findUnique({
    where: { id: feedItemId },
    select: { id: true, title: true, status: true, entityType: true, entityId: true, agentId: true, companyId: true, autoDealerId: true, serviceProviderId: true },
  });
  if (!item || item.status !== 'active') return errorJson('Зар олдсонгүй', 404);
  const sellerId = await resolveFeedOwnerUserId(item);
  if (!sellerId) return errorJson('Зарын эзэнтэй холбогдох боломжгүй байна', 409);

  const token = newGuestToken();
  const buyerId = randomObjectId();
  const chat = await prisma.listingChat.create({
    data: {
      feedItemId,
      buyerId,
      sellerId,
      title: item.title,
      lastMessage: text,
      sellerUnread: 1,
      guestName: name,
      guestPhone: phone,
      guestTokenHash: hashGuestToken(token),
    },
  });
  await prisma.listingChatMessage.create({ data: { chatId: chat.id, senderId: buyerId, text } });

  return json({ chatId: chat.id, token, title: item.title });
}
