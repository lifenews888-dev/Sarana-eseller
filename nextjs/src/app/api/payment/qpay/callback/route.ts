import { NextRequest, NextResponse } from 'next/server';
import { settleInvoice, settleByOrderId } from '@/lib/payment/settle';

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

    console.log('[QPay callback]', { method: req.method, invoiceId, orderId, paymentId });

    if (!invoiceId && !orderId) {
      // Invalid callback — QPay retries-аас хамгаалахын тулд 200 буцаана
      return NextResponse.json({ success: false, error: 'No invoice/order id' });
    }

    // Callback-ийн агуулгад итгэхгүй: QPay-ээс өөрөө шалгаж байж баталгаажуулна
    // (өмнө нь invoice_id илгээсэн хэн ч захиалгыг "төлөгдсөн" болгох боломжтой байсан).
    const result = invoiceId ? await settleInvoice(String(invoiceId)) : await settleByOrderId(String(orderId));
    return NextResponse.json({ success: result.paid, status: result.status });
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
