import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json } from '@/lib/api-auth';
import { guestTokenMatches } from '@/lib/guestChat';

// POST /api/listing-chats/guest/unread { chats: [{ chatId, token }] }
// Зочны энэ төхөөрөмж дээрх чатуудын уншаагүй хариу ба сүүлийн мессеж
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const refs = (Array.isArray(body?.chats) ? body.chats : [])
    .filter((r: { chatId?: unknown }) => typeof r?.chatId === 'string' && /^[a-f\d]{24}$/i.test(r.chatId))
    .slice(0, 50) as { chatId: string; token: unknown }[];
  if (refs.length === 0) return json({ count: 0, chats: [] });

  const rows = await prisma.listingChat.findMany({ where: { id: { in: refs.map((r) => r.chatId) } } });
  const tokenOf = new Map(refs.map((r) => [r.chatId, r.token]));
  const valid = rows.filter((c) => guestTokenMatches(tokenOf.get(c.id), c.guestTokenHash));

  return json({
    count: valid.reduce((s, c) => s + (c.buyerUnread || 0), 0),
    chats: valid.map((c) => ({ id: c.id, lastMessage: c.lastMessage, lastAt: c.lastAt, unread: c.buyerUnread || 0 })),
  });
}
