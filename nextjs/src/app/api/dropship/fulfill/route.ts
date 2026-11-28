import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson, getShopForUser } from '@/lib/api-auth';
import { placeCJOrder } from '@/lib/aliexpress';

// POST /api/dropship/fulfill — fulfill a dropship order
type OrderLineItem = { productId?: string; id?: string; name?: string; price?: number; quantity?: number };

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { orderId } = await req.json();
  if (!orderId) return errorJson('orderId шаардлагатай');

  // Get order
  if (typeof orderId !== 'string' || !/^[a-f\d]{24}$/i.test(orderId)) return errorJson('Захиалга олдсонгүй', 404);
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return errorJson('Захиалга олдсонгүй', 404);

  // Аюулгүй байдал: зөвхөн захиалгын дэлгүүрийн эзэн эсвэл админ нийлүүлэгчид илгээнэ
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
  const isAdmin = ['admin', 'superadmin', 'super_admin'].includes(dbUser?.role || user.role);
  const ownsShop = order.shopId
    ? await prisma.shop.findFirst({ where: { id: order.shopId, userId: user.id }, select: { id: true } })
    : null;
  if (!isAdmin && !ownsShop) return errorJson('Захиалга олдсонгүй', 404);
  if (order.status === 'pending' || order.status === 'cancelled') {
    return errorJson('Төлбөр төлөгдөөгүй эсвэл цуцлагдсан захиалга');
  }

  // Check order has dropship items
  const items = (order.items || []) as OrderLineItem[];
  const dropshipItems = [];

  for (const item of items) {
    const productId = item.productId || item.id;
    if (!productId) continue;
    const dropship = await prisma.dropshipProduct.findFirst({ where: { productId } });
    if (dropship) {
      dropshipItems.push({ item, dropship });
    }
  }

  if (dropshipItems.length === 0) return errorJson('Энэ захиалгад dropship бараа байхгүй');

  // Check if already fulfilled
  const existing = await prisma.dropshipOrder.findUnique({ where: { orderId } });
  if (existing) return errorJson('Аль хэдийн нийлүүлэгчид илгээсэн');

  // Parse delivery address
  const delivery = order.delivery as { phone?: string; address?: { building?: string; district?: string; street?: string } } | null;
  const address = {
    name: delivery?.address?.building || 'Customer',
    phone: delivery?.phone || '',
    country: 'MN',
    province: delivery?.address?.district || 'Ulaanbaatar',
    city: 'Ulaanbaatar',
    address: order.deliveryAddress || delivery?.address?.street || '',
    zip: '14200',
  };

  // Place order with supplier
  const result = await placeCJOrder({
    supplierSku: dropshipItems[0].dropship.supplierSku || dropshipItems[0].dropship.supplierId,
    quantity: dropshipItems[0].item.quantity || 1,
    address,
    orderNumber: `ESL-${order.id.slice(-8)}`,
  });

  // Record dropship order
  const dsOrder = await prisma.dropshipOrder.create({
    data: {
      orderId,
      supplierOrderId: result.orderId,
      status: result.success ? 'ORDERED' : 'FAILED',
      trackingNumber: result.trackingNumber,
    },
  });

  return json({
    message: result.success ? 'Нийлүүлэгчид захиалга илгээгдлээ' : 'Нийлүүлэгчид илгээхэд алдаа',
    dropshipOrder: dsOrder,
  });
}
