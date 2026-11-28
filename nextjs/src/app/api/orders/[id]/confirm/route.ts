import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { createReceipt, calculateTax } from '@/lib/ebarimt';
import { sendOrderConfirmation, sendDeliveryUpdate } from '@/lib/email';
import { smsDelivered } from '@/lib/sms';

// POST /api/orders/[id]/confirm — buyer confirms receipt
type OrderLineItem = { productId?: string; id?: string; name?: string; price?: number; quantity?: number };

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;
  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return errorJson('Захиалга олдсонгүй', 404);
  if (order.userId !== user.id) return errorJson('Зөвшөөрөлгүй', 403);
  if (order.confirmedByBuyer) return json({ message: 'Аль хэдийн баталгаажсан' });
  if (['pending', 'cancelled', 'refunded'].includes(order.status)) return errorJson('Төлбөр төлөгдөөгүй эсвэл цуцлагдсан захиалга', 400);

  // Update order
  await prisma.order.update({
    where: { id },
    data: { confirmedByBuyer: true, confirmedAt: new Date(), status: 'delivered', escrowStatus: 'RELEASED' },
  });

  // Release escrow
  const escrow = await prisma.escrowTransaction.findUnique({ where: { orderId: id } });
  if (escrow) {
    await prisma.escrowTransaction.update({
      where: { id: escrow.id },
      data: { status: 'RELEASED', releasedAt: new Date() },
    });

    // Add to seller wallet
    const wallet = await prisma.wallet.findFirst({ where: { userId: escrow.sellerId } });
    if (wallet) {
      const sellerAmount = escrow.amount * 0.98; // 2% platform fee
      await prisma.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: sellerAmount } } });
    }
  }

  // --- еБаримт ---
  try {
    const items = ((order.items || []) as OrderLineItem[]).map((item) => ({
      name: item.name || 'Бараа',
      qty: item.quantity || 1,
      unitPrice: item.price || 0,
      totalPrice: (item.price || 0) * (item.quantity || 1),
    }));

    const receipt = await createReceipt(order.id, null, items);

    await prisma.taxReceipt.create({
      data: {
        orderId: order.id,
        billId: receipt.billId,
        qrData: receipt.qrData,
        lottery: receipt.lottery,
        amount: receipt.amount,
        vatAmount: receipt.vatAmount,
        cityTax: receipt.cityTax,
        items: items,
        status: receipt.status,
      },
    });

    // Send lottery via SMS
    const buyer = await prisma.user.findUnique({ where: { id: order.userId } });
    if (buyer?.phone) {
      await smsDelivered(buyer.phone, order);
    }
    if (buyer?.email) {
      await sendDeliveryUpdate({
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: 'delivered',
        items: items,
        buyerEmail: buyer.email,
        buyerName: buyer.name,
      });
    }
  } catch (err) {
    console.error('[Ebarimt] Error creating receipt:', err);
  }

  return json({ message: 'Бараа хүлээн авсанаа баталгаажууллаа!' });
}
