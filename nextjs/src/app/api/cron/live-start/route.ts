import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isCronAuthorized } from '@/lib/cron-auth';

/**
 * GET /api/cron/live-start
 *
 * • SCHEDULED → LIVE (scheduledAt нь өнөөг хүрсэн stream-үүд)
 * • LIVE → ENDED (6 цагаас дээш гүйсэн stream-үүд)
 *
 * Vercel cron: every 5 min
 */
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

  let started = 0;
  let ended = 0;

  // SCHEDULED → LIVE
  const toStart = await prisma.liveStream.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: { lte: now },
    },
    select: { id: true, productId: true },
  });

  for (const stream of toStart) {
    await prisma.liveStream.update({
      where: { id: stream.id },
      data: { status: 'LIVE', startedAt: now },
    });
    if (stream.productId) {
      await prisma.product.update({
        where: { id: stream.productId },
        data: { isLive: true, currentLiveId: stream.id },
      });
    }
    started++;
  }

  // LIVE → ENDED (6 цагийн дараа)
  const toEnd = await prisma.liveStream.findMany({
    where: {
      status: 'LIVE',
      startedAt: { lte: sixHoursAgo },
    },
    select: { id: true, productId: true },
  });

  for (const stream of toEnd) {
    await prisma.liveStream.update({
      where: { id: stream.id },
      data: { status: 'ENDED', endedAt: now },
    });
    if (stream.productId) {
      await prisma.product.update({
        where: { id: stream.productId },
        data: { isLive: false, currentLiveId: null },
      });
    }
    ended++;
  }

  return NextResponse.json({
    started,
    ended,
    at: now.toISOString(),
  });
}
