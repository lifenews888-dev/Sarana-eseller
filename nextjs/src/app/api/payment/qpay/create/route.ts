import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createInvoice } from '@/lib/qpay';
import { ok, fail } from '@/lib/api-envelope';
import { requireAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    const { orderId, amount, description } = await request.json();

    if (!orderId || !amount) {
      return fail('orderId болон amount шаардлагатай', 400);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, total: true, status: true },
    });
    if (!order) return fail('Захиалга олдсонгүй', 404);

    // Owner or admin only
    const isAdmin = ['admin', 'superadmin', 'super_admin'].includes(auth.role);
    if (order.userId !== auth.id && !isAdmin) {
      return fail('Энэ захиалгад хандах эрхгүй', 403);
    }

    const invoiceAmount = Number(amount);
    if (!Number.isFinite(invoiceAmount) || invoiceAmount <= 0) {
      return fail('amount буруу', 400);
    }

    // Create QPay invoice
    const invoice = await createInvoice(
      orderId,
      invoiceAmount,
      description || 'Захиалгын төлбөр',
    );

    // Save transaction (non-blocking — works even if DB is unavailable)
    prisma.paymentTransaction.create({
      data: {
        orderId,
        method: 'qpay',
        invoiceId: invoice.invoiceId,
        amount: invoiceAmount,
        status: 'PENDING',
        qrImage: invoice.qrImage,
        qrText: invoice.qrText,
        metadata: { urls: invoice.urls } as object,
      },
    }).catch((e: Error) => console.warn('QPay transaction save failed:', e.message));

    return ok({
      invoiceId: invoice.invoiceId,
      qrImage: invoice.qrImage,
      qrText: invoice.qrText,
      urls: invoice.urls,
    });
  } catch (error: unknown) {
    console.error('QPay invoice алдаа:', error);
    return fail('Нэхэмжлэл үүсгэхэд алдаа гарлаа', 500);
  }
}
