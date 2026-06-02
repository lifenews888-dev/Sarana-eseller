import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { isValidPublicImageUrl } from '@/lib/image-url';

// GET /api/chat/conversations/[id]/messages
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;
  const { id } = await params;

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });

  // Mark as read
  await prisma.message.updateMany({
    where: { conversationId: id, senderId: { not: user.id }, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  return json(messages);
}

// POST /api/chat/conversations/[id]/messages
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;
  const { id } = await params;

  const { content, imageUrl } = await req.json();
  if (!content && !imageUrl) return errorJson('content шаардлагатай');
  if (imageUrl && !isValidPublicImageUrl(imageUrl)) return errorJson('imageUrl must be a public URL', 400);

  const conv = await prisma.conversation.findUnique({ where: { id } });
  if (!conv) return errorJson('Conversation олдсонгүй', 404);

  const senderRole = conv.customerId === user.id ? 'customer' : 'seller';

  const message = await prisma.message.create({
    data: { conversationId: id, senderId: user.id, senderRole, text: content || null, imageUrl: imageUrl || null },
  });

  await prisma.conversation.update({
    where: { id },
    data: { lastMessage: content?.slice(0, 100) || '📷 Зураг', lastAt: new Date(), ...(senderRole === 'customer' ? { unreadCount: { increment: 1 } } : {}) },
  });

  return json(message);
}
