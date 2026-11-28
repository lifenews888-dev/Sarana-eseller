import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySvixSignature } from '@/lib/webhook-signature';

// POST /api/webhooks/resend — handle Resend email events
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    // RESEND_WEBHOOK_SECRET тохируулсан бол зөвхөн Resend-ийн гарын үсэгтэй хүсэлтийг хүлээн авна
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (secret) {
      if (!verifySvixSignature(secret, req.headers, raw)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      console.warn('[webhooks/resend] RESEND_WEBHOOK_SECRET тохируулаагүй — гарын үсэг шалгагдахгүй байна');
    }
    const { type, data } = JSON.parse(raw || '{}');

    const campaignId = data?.tags?.campaignId;
    if (!campaignId) return NextResponse.json({ received: true });

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return NextResponse.json({ received: true });

    const updateMap: Record<string, Record<string, { increment: number }>> = {
      'email.delivered': { delivered: { increment: 1 } },
      'email.opened':    { opened: { increment: 1 } },
      'email.clicked':   { clicked: { increment: 1 } },
      'email.bounced':   { bounced: { increment: 1 } },
    };

    const update = updateMap[type];
    if (update) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: update,
      });

      await prisma.campaignEvent.create({
        data: {
          campaignId,
          userId: data?.userId || null,
          type: type.replace('email.', ''),
          occurredAt: new Date(),
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
