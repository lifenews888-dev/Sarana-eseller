import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSeller, getShopForUser, errorJson } from '@/lib/api-auth';
import { isValidPublicImageUrl } from '@/lib/image-url';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/seller/conversations/[id]/messages — list messages
export async function GET(req: NextRequest, ctx: Ctx) {
  const user = requireSeller(req);
  if (user instanceof NextResponse) return user;

  try {
    const { id } = await ctx.params;
    const shopId = await getShopForUser(user.id);
    if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);

    // Ownership check
    const conv = await prisma.conversation.findFirst({
      where: { id, shopId },
    });
    if (!conv) return errorJson('Чат олдсонгүй', 404);

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: { conversationId: id, senderRole: 'customer', isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    await prisma.conversation.update({
      where: { id },
      data: { unreadCount: 0 },
    });

    return NextResponse.json(messages);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/seller/conversations/[id]/messages — send message
export async function POST(req: NextRequest, ctx: Ctx) {
  const user = requireSeller(req);
  if (user instanceof NextResponse) return user;

  try {
    const { id } = await ctx.params;
    const shopId = await getShopForUser(user.id);
    if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);

    const conv = await prisma.conversation.findFirst({
      where: { id, shopId },
    });
    if (!conv) return errorJson('Чат олдсонгүй', 404);

    const body = await req.json();
    if (!body.text?.trim() && !body.imageUrl) {
      return errorJson('Мессеж хоосон байна', 400);
    }
    if (body.imageUrl && !isValidPublicImageUrl(body.imageUrl)) {
      return errorJson('imageUrl must be a public URL', 400);
    }

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: user.id,
        senderRole: 'seller',
        text: body.text?.trim() || null,
        imageUrl: body.imageUrl || null,
      },
    });

    // Update conversation preview
    await prisma.conversation.update({
      where: { id },
      data: {
        lastMessage: body.text?.trim()?.slice(0, 100) || 'Зураг',
        lastAt: new Date(),
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
