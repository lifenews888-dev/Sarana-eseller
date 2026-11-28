import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { openEscrow } from '@/lib/escrow';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoice, status, amount } = body;

    if (!invoice) {
      return NextResponse.json({ error: 'Missing invoice' }, { status: 400 });
    }

    // Find the payment transaction
    const payment = await prisma.paymentTransaction.findFirst({
      where: {
        OR: [
          { invoiceId: invoice },
          { orderId: invoice },
        ],
      },
    });

    if (!payment) {
      console.warn('[SocialPay Callback] Payment not found:', invoice);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Аюулгүй байдал: өмнө нь хэн ч энэ endpoint руу {invoice, status:'PAID'} илгээж
    // захиалгыг "төлөгдсөн" болгож чадаж байв. Одоо invoice үүсгэхтэй ижил схемээр
    // (sha256(invoice + amount + SOCIALPAY_SECRET)) checksum шалгаж, дүнг тулгана.
    const secret = process.env.SOCIALPAY_SECRET;
    if (!secret) {
      console.error('[SocialPay Callback] SOCIALPAY_SECRET тохируулаагүй — callback хүлээн авахгүй');
      return NextResponse.json({ error: 'Not configured' }, { status: 503 });
    }
    const expected = crypto.createHash('sha256').update(`${invoice}${amount}${secret}`).digest('hex');
    const provided = typeof body.checksum === 'string' ? body.checksum : '';
    const checksumOk = provided.length === expected.length
      && crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
    if (!checksumOk) {
      console.warn('[SocialPay Callback] Checksum буруу:', invoice);
      return NextResponse.json({ error: 'Invalid checksum' }, { status: 401 });
    }
    if (typeof payment.amount === 'number' && Number(amount) !== payment.amount) {
      console.warn('[SocialPay Callback] Дүн таарахгүй:', invoice, amount, payment.amount);
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
    }

    const isPaid = status === 'PAID' || status === 'SUCCESS' || status === 'paid';

    // Update payment status
    await prisma.paymentTransaction.update({
      where: { id: payment.id },
      data: {
        status: isPaid ? 'PAID' : 'FAILED',
        paidAt: isPaid ? new Date() : undefined,
        metadata: body,
      },
    });

    // If paid, update order status
    if (isPaid && payment.orderId) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: 'confirmed',
          paymentMethod: 'socialpay',
          paymentId: invoice,
        },
      });
      await openEscrow(payment.orderId).catch((e) => console.error('[SocialPay Callback] escrow:', e));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[SocialPay Callback] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
