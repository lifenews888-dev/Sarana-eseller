import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { sendExpoPush } from '@/lib/push';

export type NotifyPayload = {
  type: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

/**
 * Хэрэглэгчид мэдэгдэл: мэдэгдлийн хайрцагт хадгалж, push token байвал утас руу илгээнэ.
 * Алдаа гарсан ч үндсэн үйлдлийг зогсоохгүй.
 */
export async function notifyUser(userId: string | null | undefined, payload: NotifyPayload): Promise<void> {
  if (!userId) return;
  try {
    await prisma.userNotification.create({
      data: {
        userId,
        type: payload.type,
        title: payload.title.slice(0, 160),
        body: payload.body.slice(0, 500),
        data: (payload.data || {}) as Prisma.InputJsonValue,
      },
    });
  } catch (e) {
    console.error('[notify] save failed:', e);
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { pushToken: true } });
    if (user?.pushToken) {
      await sendExpoPush(user.pushToken, {
        title: payload.title,
        body: payload.body,
        data: { type: payload.type, ...(payload.data || {}) },
      });
    }
  } catch (e) {
    console.error('[notify] push failed:', e);
  }
}
