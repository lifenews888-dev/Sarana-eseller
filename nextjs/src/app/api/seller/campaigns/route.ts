import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopForRequest } from '@/lib/api-auth';
import { sendBulkSMS } from '@/lib/marketing/SMSService';
import { sendBulkEmail, buildEmailTemplate } from '@/lib/marketing/EmailService';

// GET — list campaigns
export async function GET(req: NextRequest) {
  const session = await requireShopForRequest(req);
  if (session instanceof NextResponse) return session;

  try {
    const campaigns = await prisma.campaign.findMany({
      where: { entityId: session.shopId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ campaigns });
  } catch {
    return NextResponse.json({ campaigns: [] });
  }
}

// POST — create and optionally send a campaign
export async function POST(req: NextRequest) {
  const session = await requireShopForRequest(req);
  if (session instanceof NextResponse) return session;

  try {
    const body = await req.json();
    const { name, type, subject, content, sendNow } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'name, type required' }, { status: 400 });
    }

    // Generate refId
    const count = await prisma.campaign.count();
    const refId = `CMP-${new Date().getFullYear().toString().slice(2)}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

    const campaign = await prisma.campaign.create({
      data: {
        refId,
        name,
        type,        // SMS | EMAIL | MULTI_CHANNEL
        subject: subject || name,
        smsText: type === 'SMS' || type === 'MULTI_CHANNEL' ? content : undefined,
        emailHtml: type === 'EMAIL' || type === 'MULTI_CHANNEL' ? buildEmailTemplate(subject || name, content || '') : undefined,
        entityId: session.shopId,
        createdById: session.user.id,
        status: sendNow ? 'SENDING' : 'DRAFT',
      },
    });

    if (sendNow) {
      const users = await prisma.user.findMany({
        where: { role: 'buyer', isActive: true },
        select: { email: true, phone: true, name: true },
        take: 1000,
      });

      let totalSent = 0;

      if (type === 'SMS' || type === 'MULTI_CHANNEL') {
        const smsRecipients = users.filter(u => u.phone).map(u => ({ phone: u.phone!, message: content || name }));
        const result = await sendBulkSMS(smsRecipients);
        totalSent += result.sent;
      }

      if (type === 'EMAIL' || type === 'MULTI_CHANNEL') {
        const html = buildEmailTemplate(subject || name, content || '');
        const emailRecipients = users.filter(u => u.email).map(u => ({ email: u.email, subject: subject || name, html }));
        const result = await sendBulkEmail(emailRecipients);
        totalSent += result.sent;
      }

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'SENT', totalSent, sentAt: new Date(), audienceCount: users.length },
      });

      return NextResponse.json({ campaign: { ...campaign, status: 'SENT', totalSent }, message: `${totalSent} хүнд илгээгдлээ` });
    }

    return NextResponse.json({ campaign, message: 'Кампэйн үүсгэгдлээ' });
  } catch (error) {
    console.error('Campaign error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
