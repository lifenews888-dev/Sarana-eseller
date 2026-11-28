import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson } from '@/lib/api-auth';
import { checkRateLimit } from '@/lib/rate-limit';

// POST /api/unsubscribe — opt out of marketing communications
export async function POST(req: NextRequest) {
  if (checkRateLimit(req).limited) {
    return Response.json({ success: false, error: 'Хэт олон хүсэлт. Түр хүлээгээд дахин оролдоно уу.' }, { status: 429 });
  }
  try {
    const body = await req.json();
    const { email, phone, channel, reason } = body;

    if (!channel) return errorJson('channel required');
    if (!email && !phone) return errorJson('email or phone required');

    const record = await prisma.marketingOptOut.create({
      data: {
        email: email || null,
        phone: phone || null,
        channel,
        reason: reason || null,
      },
    });

    return json(record, 201);
  } catch (e: unknown) {
    return errorJson((e as Error).message, 500);
  }
}
