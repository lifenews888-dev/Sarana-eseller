import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminDB } from '@/lib/api-auth';

// GET /api/admin/chats/:id?type=listing|shop — чатын мессежүүдийг уншина (зөвхөн админ, зөвхөн унших)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminDB(req);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) return NextResponse.json({ messages: [] }, { status: 400 });

  try {
    if (req.nextUrl.searchParams.get('type') === 'listing') {
      const chat = await prisma.listingChat.findUnique({ where: { id } });
      if (!chat) return NextResponse.json({ messages: [] }, { status: 404 });
      const [msgs, users] = await Promise.all([
        prisma.listingChatMessage.findMany({ where: { chatId: id }, orderBy: { createdAt: 'asc' }, take: 500 }),
        prisma.user.findMany({ where: { id: { in: [chat.buyerId, chat.sellerId] } }, select: { id: true, name: true } }),
      ]);
      const names = Object.fromEntries(users.map((u) => [u.id, u.name]));
      return NextResponse.json({
        feedItemId: chat.feedItemId,
        messages: msgs.map((m) => ({
          id: m.id,
          text: m.text,
          createdAt: m.createdAt,
          side: m.senderId === chat.sellerId ? 'seller' : 'buyer',
          senderName: names[m.senderId] || (m.senderId === chat.sellerId ? 'Зарын эзэн' : 'Худалдан авагч'),
        })),
      });
    }

    const msgs = await prisma.message.findMany({ where: { conversationId: id }, orderBy: { createdAt: 'asc' }, take: 500 });
    return NextResponse.json({
      messages: msgs.map((m) => ({
        id: m.id,
        text: m.text || (m.imageUrl ? '[зураг]' : ''),
        createdAt: m.createdAt,
        side: m.senderRole === 'seller' ? 'seller' : 'buyer',
        senderName: m.senderRole === 'seller' ? 'Дэлгүүр' : 'Худалдан авагч',
      })),
    });
  } catch (e) {
    console.error('[admin/chats/:id]', e);
    return NextResponse.json({ messages: [] }, { status: 500 });
  }
}
