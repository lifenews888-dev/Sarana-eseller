import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { priceOrder, OrderPricingError } from '@/lib/order-pricing';
import { createInvoice, isDemoMode, createDemoInvoice } from '@/lib/payment/qpay';
import { generateQRCode } from '@/lib/share/generateShareContent';
import { getAuthUser } from '@/lib/api-auth';
import { resolveReferral } from '@/lib/affiliate-attribution';
import { sendExpoPush } from '@/lib/push';

export async function POST(req: NextRequest) {
  try {
    // Extract userId from JWT (required — orders must be tied to user)
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Нэвтрэх шаардлагатай' }, { status: 401 });
    }

    const body = await req.json();
    const { items, deliveryAddress, phone } = body;
    // Борлуулагчийг клиентийн өгсөн ID-гаар биш, ref cookie/кодоор серверт тодорхойлно.
    const referral = await resolveReferral(req, authUser.id, body.referralCode).catch(() => null);

    // Нийт дүнг клиентийн totalAmount/price-аас биш, DB-ээс тооцоолно.
    let priced;
    try {
      priced = await priceOrder({
        items,
        couponCode: body.couponCode,
        loyaltyPoints: body.loyaltyPoints,
      });
    } catch (error) {
      if (error instanceof OrderPricingError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      throw error;
    }
    const amount = priced.total;
    if (!amount) {
      return NextResponse.json({ error: 'Cart items and amount required' }, { status: 400 });
    }
    const normalizedItems = priced.items.map((i) => ({
      productId: i.productId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      image: i.image,
    }));

    // Platform fee 2%
    const platformFee = Math.round(amount * 0.02)
    const sellerAmount = amount - platformFee

    // Create pending order
    const order = await prisma.order.create({
      data: {
        userId: authUser.id,
        items: normalizedItems,
        total: amount,
        platformAmount: platformFee,
        sellerAmount: sellerAmount,
        status: 'pending',
        deliveryAddress: deliveryAddress || undefined,
        paymentMethod: 'qpay',
        sellerProfileId: referral?.sellerProfileId ?? undefined,
        referralCode: referral?.referralCode ?? undefined,
        delivery: phone ? { phone } : undefined,
      },
    });

    // Create QPay invoice
    const invoiceParams = {
      orderId: order.id,
      amount,
      description: `eseller.mn захиалга #${order.orderNumber || order.id.slice(-6)}`,
    };

    let invoice;
    let qrDataUrl = '';

    if (isDemoMode()) {
      // Demo mode — no real QPay credentials
      invoice = createDemoInvoice(invoiceParams);
      qrDataUrl = await generateQRCode(`https://eseller.mn/orders/${order.id}`);
    } else {
      // Real QPay
      invoice = await createInvoice(invoiceParams);
      qrDataUrl = invoice.qr_image
        ? `data:image/png;base64,${invoice.qr_image}`
        : await generateQRCode(invoice.qr_text);
    }

    // Save invoice ID to order
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentId: invoice.invoice_id,
      },
    });

    // Notify seller of new pending order (derive shop from first product)
    try {
      const firstProductId = normalizedItems[0]?.productId;
      if (firstProductId) {
        const product = await prisma.product.findUnique({
          where: { id: firstProductId },
          select: { userId: true },
        });
        if (product?.userId) {
          const shop = await prisma.shop.findFirst({
            where: { userId: product.userId },
            orderBy: { createdAt: 'asc' },
            select: { id: true, userId: true },
          });
          if (shop?.id) {
            await prisma.order.update({
              where: { id: order.id },
              data: { shopId: shop.id },
            });
          }
          const seller = await prisma.user.findUnique({
            where: { id: product.userId },
            select: { pushToken: true },
          });
          if (seller?.pushToken) {
            await sendExpoPush(seller.pushToken, {
              title: '🛍️ Шинэ захиалга ирлээ!',
              body: `${normalizedItems.length} бараа — ${amount.toLocaleString()}₮`,
              data: { orderId: order.id, screen: 'seller-orders' },
            });
          }
        }
      }
    } catch (e) {
      console.error('Seller notify failed:', e);
    }

    // Create PaymentTransaction so QPay webhook can find it
    try {
      await prisma.paymentTransaction.create({
        data: {
          orderId: order.id,
          method: 'qpay',
          invoiceId: invoice.invoice_id,
          amount,
          status: 'PENDING',
          qrImage: invoice.qr_image || null,
          qrText: invoice.qr_text || null,
        },
      });
    } catch (e) {
      console.error('PaymentTransaction create failed:', e);
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber || order.id.slice(-6),
      invoiceId: invoice.invoice_id,
      qrText: invoice.qr_text,
      qrImage: invoice.qr_image || '',
      qrDataUrl,
      deepLinks: invoice.urls || [],
      amount,
      isDemoMode: isDemoMode(),
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}


