import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkPayment, isDemoMode } from '@/lib/payment/qpay';

// POST /api/quick-order/callback — QPay webhook
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const invoiceId = body.invoice_id || body.invoiceId || body.body?.invoiceId;

    if (!invoiceId) return NextResponse.json({ ok: true });

    const quickOrder = await prisma.quickOrder.findFirst({
      where: { invoiceId },
      include: { product: true, user: { select: { id: true, name: true } } },
    });

    if (!quickOrder || quickOrder.status === 'PAID') {
      return NextResponse.json({ ok: true });
    }

    // Аюулгүй байдал: webhook-ийн биеэс итгэхгүй — QPay-ээс төлөгдсөн эсэхийг заавал шалгана
    // (өмнө нь invoiceId мэдсэн хэн ч захиалгыг "төлсөн" болгох боломжтой байв)
    if (isDemoMode() || String(invoiceId).startsWith('DEMO_')) return NextResponse.json({ ok: true });
    const expected = (quickOrder.product.salePrice || quickOrder.product.price) * quickOrder.quantity;
    let paid = false;
    try {
      const result = await checkPayment(String(invoiceId));
      const paidRow = (result?.rows || []).find((r) => String(r.payment_status).toUpperCase() === 'PAID');
      paid = !!paidRow && Number(result?.paid_amount || 0) + 1 >= expected;
    } catch (e) {
      console.error('[quick-order/callback] QPay check failed:', e);
    }
    if (!paid) return NextResponse.json({ ok: true, paid: false });

    // Mark as paid — давхар callback ирсэн ч нэг л удаа боловсруулна
    const marked = await prisma.quickOrder.updateMany({
      where: { id: quickOrder.id, status: { not: 'PAID' } },
      data: { status: 'PAID' },
    });
    if (marked.count === 0) return NextResponse.json({ ok: true });

    // Decrement stock
    if (quickOrder.product.stock !== null && quickOrder.product.stock !== undefined) {
      await prisma.product.update({
        where: { id: quickOrder.productId },
        data: { stock: { decrement: quickOrder.quantity } },
      });
    }

    // Create real Order
    const amount = (quickOrder.product.salePrice || quickOrder.product.price) * quickOrder.quantity;
    await prisma.order.create({
      data: {
        userId: quickOrder.userId,
        items: [{
          productId: quickOrder.productId,
          name: quickOrder.product.name,
          price: quickOrder.product.salePrice || quickOrder.product.price,
          quantity: quickOrder.quantity,
        }],
        total: amount,
        status: 'confirmed',
        paymentMethod: 'qpay',
        paymentId: invoiceId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[quick-order callback]', err);
    return NextResponse.json({ ok: true });
  }
}
