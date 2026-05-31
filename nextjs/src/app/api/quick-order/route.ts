import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { getSafeImageList } from '@/lib/image-url';

// POST /api/quick-order — create quick order + invoice
export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { productId, quantity = 1 } = await req.json();
  if (!productId) return errorJson('productId шаардлагатай');

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return errorJson('Бараа олдсонгүй', 404);

  if ((product.stock ?? 0) < quantity) {
    return errorJson('Нөөц хүрэлцэхгүй', 400);
  }

  const amount = (product.salePrice || product.price) * quantity;

  const quickOrder = await prisma.quickOrder.create({
    data: { userId: user.id, productId, quantity },
  });

  // Create QPay invoice (call internal QPay API)
  let invoiceId: string | null = null;
  let followUpLink: string | null = null;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://eseller.mn';
    const qpayRes = await fetch(`${baseUrl}/api/payment/qpay/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: req.headers.get('authorization') || '' },
      body: JSON.stringify({
        amount,
        orderId: quickOrder.id,
        description: `${product.name} x${quantity}`,
      }),
    });
    if (qpayRes.ok) {
      const qpayData = await qpayRes.json();
      invoiceId = qpayData.invoiceId || qpayData.data?.invoiceId || null;
      followUpLink = qpayData.qpayShortUrl || qpayData.data?.qpayShortUrl || null;
    }
  } catch {}

  if (invoiceId) {
    await prisma.quickOrder.update({
      where: { id: quickOrder.id },
      data: { invoiceId },
    });
  }

  return json({
    quickOrderId: quickOrder.id,
    invoiceId,
    followUpLink,
    amount,
    product: {
      id: product.id,
      name: product.name,
      price: product.price,
      images: getSafeImageList(product.images),
    },
  });
}
