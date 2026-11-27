import { prisma } from '@/lib/prisma';

/**
 * Давхар дарах, сүлжээ дахин оролдох үед ижил мессеж хоёр удаа хадгалагдахаас сэргийлнэ:
 * нэг илгээгч ижил бичвэрийг 15 секундын дотор дахин илгээвэл өмнөхийг нь буцаана.
 */
export function findRecentDuplicate(chatId: string, senderId: string, text: string, windowMs = 15_000) {
  return prisma.listingChatMessage.findFirst({
    where: { chatId, senderId, text, createdAt: { gte: new Date(Date.now() - windowMs) } },
    orderBy: { createdAt: 'desc' },
  });
}
