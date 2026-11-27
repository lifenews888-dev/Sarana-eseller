/**
 * QPay — хуучин импортуудад зориулсан нимгэн давхарга.
 *
 * Өмнө нь энэ файл бүхэлдээ mock байсан (зохиомол QR, үргэлж paid:false) тул сагснаас хийсэн
 * захиалгын төлбөр хэзээ ч бодитоор ороогүй. Одоо бодит клиент `lib/payment/qpay.ts`-г ашиглана.
 * QPAY_USERNAME/QPAY_PASSWORD тохируулаагүй үед `demo: true` бүхий тест нэхэмжлэл буцаана —
 * тест нэхэмжлэл хэзээ ч автоматаар "төлөгдсөн" болохгүй (lib/payment/settle.ts).
 */
import {
  createInvoice as qpayCreateInvoice,
  createDemoInvoice,
  isDemoMode,
} from '@/lib/payment/qpay';
import { settleInvoice } from '@/lib/payment/settle';

export interface QPayInvoice {
  invoiceId: string;
  qrImage: string; // base64 PNG (data: prefix-гүй)
  qrText: string;
  shortUrl?: string;
  urls: { name: string; description?: string; logo?: string; link: string }[];
  demo: boolean;
}

export interface QPayPaymentStatus {
  paid: boolean;
  paidAmount: number;
  paidDate: string | null;
  status?: string;
}

export async function createInvoice(orderId: string, amount: number, description: string): Promise<QPayInvoice> {
  const base = process.env.NEXT_PUBLIC_URL || 'https://eseller.mn';
  const params = {
    orderId,
    amount: Math.round(amount),
    description,
    callbackUrl: `${base}/api/payment/qpay/callback`,
  };
  const demo = isDemoMode();
  const inv = demo ? createDemoInvoice(params) : await qpayCreateInvoice(params);
  return {
    invoiceId: inv.invoice_id,
    qrImage: inv.qr_image || '',
    qrText: inv.qr_text,
    shortUrl: inv.qPay_shortUrl,
    urls: inv.urls || [],
    demo,
  };
}

/** QPay-ээс шалгаж, төлөгдсөн бол захиалга/зарыг баталгаажуулна. */
export async function checkPayment(invoiceId: string): Promise<QPayPaymentStatus> {
  const r = await settleInvoice(invoiceId);
  return { paid: r.paid, paidAmount: 0, paidDate: r.paid ? new Date().toISOString() : null, status: r.status };
}

export { isDemoMode };
export const qpay = { createInvoice, checkPayment };
export default qpay;
