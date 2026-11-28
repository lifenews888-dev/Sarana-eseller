import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminDB as requireAdmin, json, errorJson } from '@/lib/api-auth';
import { sendEmail, buildEmailTemplate } from '@/lib/marketing/EmailService';
import { sendSMS } from '@/lib/marketing/SMSService';
import { refundEscrow, releaseEscrow } from '@/lib/escrow';

// PUT /api/admin/returns/[id] — approve or reject return
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin(req);
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const { status, adminNote } = await req.json();

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return errorJson('status: APPROVED | REJECTED');
  }

  const ret = await prisma.returnRequest.findUnique({ where: { id } });
  if (!ret) return errorJson('Буцаалт олдсонгүй', 404);
  if (ret.status !== 'PENDING') return errorJson('Аль хэдийн шийдвэрлэгдсэн');

  // Update return request
  await prisma.returnRequest.update({
    where: { id },
    data: { status, adminNote, resolvedAt: new Date() },
  });

  const order = await prisma.order.findUnique({ where: { id: ret.orderId } });
  const buyer = await prisma.user.findUnique({ where: { id: ret.buyerId } });

  if (status === 'APPROVED' && order) {
    // Дундын данснаас худалдан авагчийн хэтэвчинд буцаана (нэг л удаа)
    const refunded = await refundEscrow(ret.orderId, `Буцаалт зөвшөөрөгдсөн${adminNote ? `: ${adminNote}` : ''}`);
    if (!refunded) {
      await prisma.order.update({ where: { id: ret.orderId }, data: { status: 'cancelled' } });
    }

    // Notify buyer
    if (buyer?.email) {
      await sendEmail(
        buyer.email,
        'Буцаалт зөвшөөрөгдлөө',
        buildEmailTemplate(
          'Буцаалт зөвшөөрөгдлөө',
          `<p>Таны захиалга ${order.orderNumber || order.id.slice(-6)}-н буцаалт зөвшөөрөгдөж, мөнгө таны хэтэвчид буцаагдлаа.</p>`,
          'https://eseller.mn/dashboard/orders',
          'Захиалга харах'
        ),
      );
    }
    if (buyer?.phone) {
      await sendSMS(buyer.phone, `eseller.mn: Буцаалт зөвшөөрөгдлөө. Мөнгө хэтэвчид буцаагдлаа.`);
    }
  } else if (status === 'REJECTED' && order) {
    // Татгалзсан — дундын данснаас дэлгүүрт шилжүүлнэ
    await releaseEscrow(ret.orderId, 'Буцаалт татгалзагдсан');

    if (buyer?.email) {
      await sendEmail(
        buyer.email,
        'Буцаалт татгалзагдлаа',
        buildEmailTemplate(
          'Буцаалт татгалзагдлаа',
          `<p>Таны захиалга ${order.orderNumber || order.id.slice(-6)}-н буцаалтыг татгалзлаа.</p>${adminNote ? `<p>Шалтгаан: ${adminNote}</p>` : ''}`,
          'https://eseller.mn/dashboard/orders',
          'Захиалга харах'
        ),
      );
    }
  }

  return json({ message: status === 'APPROVED' ? 'Буцаалт зөвшөөрөгдлөө' : 'Буцаалт татгалзагдлаа' });
}
