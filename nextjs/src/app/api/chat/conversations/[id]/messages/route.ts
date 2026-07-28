import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { isValidPublicImageUrl } from '@/lib/image-url';

async function canAccessConversation(
  userId: string,
  conv: { customerId: string; shopId: string },
): Promise<'customer' | 'seller' | null> {
  if (conv.customerId === userId) return 'customer';
  const shop = await prisma.shop.findFirst({
    where: { id: conv.shopId, userId },
    select: { id: true },
  });
  if (shop) return 'seller';
  return null;
}

// GET /api/chat/conversations/[id]/messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;
  const { id } = await params;

  const conv = await prisma.conversation.findUnique({ where: { id } });
  if (!conv) return errorJson('Conversation олдсонгүй', 404);

  const role = await canAccessConversation(user.id, conv);
  if (!role) return errorJson('Хандах эрхгүй', 403);

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });

  // Mark messages from the other party as read
  await prisma.message.updateMany({
    where: {
      conversationId: id,
      senderId: { not: user.id },
      isRead: false,
    },
    data: { isRead: true, readAt: new Date() },
  });

  if (role === 'seller') {
    await prisma.conversation.update({
      where: { id },
      data: { unreadCount: 0 },
    });
  }

  return json(messages);
}

// POST /api/chat/conversations/[id]/messages
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;
  const { id } = await params;

  const { content, imageUrl } = await req.json();
  if (!content?.trim() && !imageUrl) return errorJson('content шаардлагатай');
  if (imageUrl && !isValidPublicImageUrl(imageUrl)) {
    return errorJson('imageUrl must be a public URL', 400);
  }

  const conv = await prisma.conversation.findUnique({ where: { id } });
  if (!conv) return errorJson('Conversation олдсонгүй', 404);
  if (conv.status === 'blocked') return errorJson('Чат блоклогдсон', 403);

  const senderRole = await canAccessConversation(user.id, conv);
  if (!senderRole) return errorJson('Хандах эрхгүй', 403);

  const text = content?.trim() || null;

  const message = await prisma.message.create({
    data: {
      conversationId: id,
      senderId: user.id,
      senderRole,
      text,
      imageUrl: imageUrl || null,
    },
  });

  await prisma.conversation.update({
    where: { id },
    data: {
      lastMessage: text?.slice(0, 100) || '📷 Зураг',
      lastAt: new Date(),
      ...(senderRole === 'customer' ? { unreadCount: { increment: 1 } } : {}),
    },
  });

  return json(message, 201);
}
