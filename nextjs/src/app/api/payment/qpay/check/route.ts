import { NextRequest } from 'next/server';
import { settleInvoice } from '@/lib/payment/settle';
import { ok, fail } from '@/lib/api-envelope';

// POST /api/payment/qpay/check { invoiceId } — QPay-ээс шалгаж, төлөгдсөн бол баталгаажуулна.
export async function POST(request: NextRequest) {
  try {
    const { invoiceId } = await request.json();
    if (!invoiceId) return fail('invoiceId шаардлагатай', 400);
    const r = await settleInvoice(String(invoiceId));
    return ok({ paid: r.paid, status: r.status, orderId: r.orderId, kind: r.kind });
  } catch (error) {
    console.error('QPay check алдаа:', error);
    return fail('Төлбөр шалгахад алдаа гарлаа', 500);
  }
}
