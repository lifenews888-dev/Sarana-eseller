import { NextRequest, NextResponse } from 'next/server';
import { settleInvoice } from '@/lib/payment/settle';

// GET /api/checkout/check-payment/:invoiceId
// Өмнө нь QPay эрхгүй (demo) үед захиалгыг 10 секундийн дараа автоматаар "төлөгдсөн" болгодог байсан —
// одоо зөвхөн QPay бодитоор баталгаажуулсан төлбөрийг хүлээн зөвшөөрнө.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  try {
    const { invoiceId } = await params;
    const r = await settleInvoice(invoiceId);
    return NextResponse.json({
      paid: r.paid,
      status: r.paid ? 'paid' : r.status,
      orderId: r.orderId,
      paymentId: invoiceId,
    });
  } catch (error) {
    console.error('Check payment error:', error);
    return NextResponse.json({ paid: false, status: 'error' });
  }
}
