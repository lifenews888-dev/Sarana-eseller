import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendExpoPush } from '@/lib/push';
import { recordAffiliateCommission } from '@/lib/affiliate-attribution';

/**
 * QPay webhook callback
 * QPay нь олон форматаар callback илгээдэг:
 *   - POST body:    { object_id, object_type, payment_id }
 *   - POST body v2: { invoice_id, payment_id, status }
 *   - GET query:    ?qpay_payment_id=xxx&qpay_invoice_id=xxx
 *   - Custom push:  { body: { transactionId, invoiceId, status } }
 *
 * Бүгдийг зохицуулж, retries-аас хамгаалахын тулд үл мэдэгдэх
 * хүсэлтүүдэд 200 буцаана.
 */
async function handleCallback(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Query params (GET эсвэл POST-ийн URL params)
    const sp = req.nextUrl.searchParams;

    // 2. Body (хэрэв POST бол)
    let body: Record<string, any> = {};
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch {
        try {
          const text = await req.text();
          body = Object.fromEntries(new URLSearchParams(text));
        } catch {}
      }
    }

    // 3. Nested body (зарим QPay integration `body` object-д оруулдаг)
    const nested = body.body || {};

    // Invoice ID — олон талаас хайна
    const invoiceId =
      body.object_id ||
      body.invoice_id ||
      body.invoiceId ||
      body.qpay_invoice_id ||
      nested.invoiceId ||
      nested.invoice_id ||
      sp.get('object_id') ||
      sp.get('invoice_id') ||
      sp.get('qpay_invoice_id');

    // Order ID — зарим тохиолдолд transactionId эсвэл orderId
    const orderId =
      body.transactionId ||
      body.orderId ||
      nested.transactionId ||
      nested.orderId ||
      sp.get('transactionId') ||
      sp.get('orderId');

    const paymentId =
      body.payment_id ||
      body.paymentId ||
      body.qpay_payment_id ||
      nested.payment_id ||
      sp.get('payment_id') ||
      sp.get('qpay_payment_id');

    console.log('[QPay callback]', { method: req.method, invoiceId, orderId, paymentId, body, query: Object.fromEntries(sp) });

    if (!invoiceId && !orderId) {
      // Invalid callback — QPay retries-аас хамгаалахын тулд 200 буцаана
      return NextResponse.json({ success: false, error: 'No invoice/order id' });
    }

    // Transaction хайх — invoiceId эсвэл orderId-ээр
    let transaction = null;
    if (invoiceId) {
      transaction = await prisma.paymentTransaction.findFirst({
        where: { invoiceId },
      });
    }
    if (!transaction && orderId) {
      transaction = await prisma.paymentTransaction.findFirst({
        where: { orderId },
      });
    }

    if (!transaction) {
      console.warn('[QPay callback] Transaction not found', { invoiceId, orderId });
      // 200 буцаана — QPay retry хийхээс сэргийлнэ
      return NextResponse.json({ success: false, error: 'Transaction not found' });
    }

    // Already paid — idempotent
    if (transaction.status === 'PAID') {
      return NextResponse.json({ success: true, alreadyPaid: true });
    }

    // Mark paid
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        metadata: {
          ...((transaction.metadata as any) || {}),
          qpayPaymentId: paymentId,
          callbackReceived: new Date().toISOString(),
          callbackBody: body,
        },
      },
    });

    // Update order status
    let confirmedOrder = null;
    try {
      confirmedOrder = await prisma.order.update({
        where: { id: transaction.orderId },
        data: { status: 'confirmed' },
      });
    } catch (e) {
      console.error('[QPay callback] Order update failed:', e);
    }

    // Борлуулагчийн комисс (idempotent)
    if (confirmedOrder?.id) {
      await recordAffiliateCommission(confirmedOrder.id).catch((e) => console.error('[QPay callback] Commission failed:', e));
    }

    // Push buyer — payment confirmed
    try {
      if (confirmedOrder?.userId) {
        const buyer = await prisma.user.findUnique({
          where: { id: confirmedOrder.userId },
          select: { pushToken: true },
        });
        if (buyer?.pushToken) {
          await sendExpoPush(buyer.pushToken, {
            title: '✅ Захиалга баталгаажлаа!',
            body: 'Таны захиалга хүлээн авагдлаа. Дэлгэрэнгүйг харах →',
            data: { orderId: confirmedOrder.id },
          });
        }
      }
    } catch (e) {
      console.error('[QPay callback] Buyer push failed:', e);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[QPay callback] Error:', message);
    // Always return 200 to prevent retry storms
    return NextResponse.json({ success: false, error: message });
  }
}

export async function POST(req: NextRequest) {
  return handleCallback(req);
}

export async function GET(req: NextRequest) {
  return handleCallback(req);
}
