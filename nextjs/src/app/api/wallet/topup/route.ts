import { NextRequest } from 'next/server';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { getOrCreateWallet } from '@/lib/wallet-escrow';
import { prisma } from '@/lib/prisma';
import { createInvoice } from '@/lib/qpay';

const MIN_TOPUP = 1000;
const MAX_TOPUP = 5_000_000;

// POST /api/wallet/topup { amount } — хэтэвч цэнэглэх QPay нэхэмжлэл үүсгэнэ.
// Аюулгүй байдал: үлдэгдлийг зөвхөн QPay төлбөр баталгаажсаны дараа (lib/payment/settle.ts, kind 'wallet_topup')
// нэмнэ. Өмнө нь энэ endpoint төлбөргүйгээр шууд үлдэгдэл нэмдэг байв.
export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => ({}));
  const amount = Math.round(Number(body.amount));
  if (!Number.isFinite(amount) || amount < MIN_TOPUP) return errorJson('Хамгийн бага 1,000₮ цэнэглэнэ', 400);
  if (amount > MAX_TOPUP) return errorJson('Нэг удаад 5,000,000₮ хүртэл цэнэглэнэ', 400);

  try {
    const wallet = await getOrCreateWallet(user.id);
    const invoice = await createInvoice(wallet.id, amount, `eseller.mn хэтэвч цэнэглэлт`);
    await prisma.paymentTransaction.create({
      data: {
        orderId: wallet.id,
        method: 'qpay',
        invoiceId: invoice.invoiceId,
        amount,
        status: 'PENDING',
        qrImage: invoice.qrImage || null,
        qrText: invoice.qrText,
        metadata: { kind: 'wallet_topup', userId: user.id, amount, demo: invoice.demo } as object,
      },
    });
    return json({
      invoiceId: invoice.invoiceId,
      qrImage: invoice.qrImage,
      qrText: invoice.qrText,
      shortUrl: invoice.shortUrl,
      urls: invoice.urls,
      demo: invoice.demo,
      amount,
    });
  } catch (e) {
    console.error('[wallet/topup] invoice failed:', e);
    return errorJson('QPay нэхэмжлэл үүсгэж чадсангүй. Дахин оролдоно уу.', 502);
  }
}
