import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkPayment, isDemoMode } from '@/lib/payment/qpay';
import { recordAffiliateCommission } from '@/lib/affiliate-attribution';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params;

    // Demo mode — simulate payment after a few checks
    if (isDemoMode()) {
      // Find order by paymentId
      const order = await prisma.order.findFirst({
        where: { paymentId: invoiceId },
      });

      if (!order) {
        return NextResponse.json({ paid: false, status: 'not_found' });
      }

      // In demo mode, auto-confirm after order exists for 10+ seconds
      const elapsed = Date.now() - new Date(order.createdAt).getTime();
      if (elapsed > 10000) {
        // Mark as paid
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'confirmed' },
        });

        // Борлуулагчийн комисс (idempotent)
        await recordAffiliateCommission(order.id).catch(() => null);

        return NextResponse.json({
          paid: true,
          status: 'paid',
          orderId: order.id,
          paymentId: invoiceId,
        });
      }

      return NextResponse.json({ paid: false, status: 'waiting' });
    }

    // Real QPay — check payment status
    const result = await checkPayment(invoiceId);

    if (result.count > 0 && result.paid_amount > 0) {
      const payment = result.rows[0];

      // Find and update order
      const order = await prisma.order.findFirst({
        where: { paymentId: invoiceId },
      });

      if (order && order.status === 'pending') {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'confirmed' },
        });

        // Борлуулагчийн комисс (idempotent)
        await recordAffiliateCommission(order.id).catch(() => null);
      }

      return NextResponse.json({
        paid: true,
        status: 'paid',
        orderId: order?.id,
        paymentId: payment.payment_id,
        amount: payment.payment_amount,
      });
    }

    return NextResponse.json({ paid: false, status: 'waiting' });
  } catch (error) {
    console.error('Check payment error:', error);
    return NextResponse.json({ paid: false, status: 'error' });
  }
}
