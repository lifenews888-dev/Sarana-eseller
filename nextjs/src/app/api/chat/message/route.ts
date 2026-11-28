import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAiReply } from '@/lib/chat/aiChatEngine';
import { getAuthUser } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, shopId, message, role, history } = await req.json();

    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    // If we have a sessionId, save to DB (real conversation)
    if (sessionId) {
      // Find or verify conversation
      let conversation = await prisma.conversation.findUnique({ where: { id: sessionId } });

      if (!conversation && shopId) {
        // Create new conversation
        conversation = await prisma.conversation.create({
          data: {
            shopId,
            customerId: 'anonymous',
            customerName: 'Зочин',
            status: 'active',
            tag: 'question',
          },
        });
      }

      if (!conversation) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

      // Аюулгүй байдал: "seller" нэрээр зөвхөн дэлгүүрийн эзэн, бүртгэлтэй худалдан авагчийн чатад зөвхөн тэр өөрөө бичнэ
      const authUser = getAuthUser(req);
      if (role === 'seller') {
        const owns = authUser
          ? await prisma.shop.findFirst({ where: { id: conversation.shopId, userId: authUser.id }, select: { id: true } })
          : null;
        if (!owns) return NextResponse.json({ error: 'Эрх байхгүй' }, { status: 403 });
      } else if (conversation.customerId !== 'anonymous' && conversation.customerId !== authUser?.id) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      // Save user/seller message
      const savedMsg = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: role === 'seller' ? 'seller' : 'customer',
          senderRole: role || 'customer',
          text: message,
        },
      });

      // Update conversation lastMessage
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessage: message, updatedAt: new Date() },
      });

      // If customer message and no seller online → AI reply
      if (role !== 'seller') {
        const aiReply = await getAiReply(message, conversation.shopId, history || []);

        const aiMsg = await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: 'ai',
            senderRole: 'ai',
            text: aiReply,
          },
        });

        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { lastMessage: aiReply, updatedAt: new Date() },
        });

        return NextResponse.json({
          userMessage: savedMsg,
          reply: aiReply,
          replyMessage: aiMsg,
          sessionId: conversation.id,
        });
      }

      // Seller reply — just save, no AI
      return NextResponse.json({ message: savedMsg, sessionId: conversation.id });
    }

    // Fallback: no session, just get AI reply (widget initial mode)
    const reply = await getAiReply(message, shopId || '', history || []);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ reply: 'Уучлаарай, алдаа гарлаа.' });
  }
}
