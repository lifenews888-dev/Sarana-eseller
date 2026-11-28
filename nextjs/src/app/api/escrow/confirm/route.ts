import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { releaseEscrow } from '@/lib/escrow';

// POST /api/escrow/confirm { orderId } — худалдан авагч хүлээн авснаа баталгаажуулна
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { orderId } = await req.json().catch(() => ({}));
  if (typeof orderId !== 'string' || !/^[a-f\d]{24}$/i.test(orderId)) return errorJson('Захиалга олдсонгүй', 404);

  const escrow = await prisma.escrowTransaction.findUnique({ where: { orderId } });
  // Аюулгүй байдал: зөвхөн тухайн захиалгын худалдан авагч баталгаажуулна
  if (!escrow || escrow.buyerId !== auth.id) return errorJson('Захиалга олдсонгүй', 404);
  if (escrow.status !== 'HOLDING') return errorJson('Төлбөр аль хэдийн шилжсэн эсвэл маргаантай байна');

  await prisma.order.updateMany({
    where: { id: orderId, confirmedByBuyer: { not: true } },
    data: { status: 'delivered', confirmedByBuyer: true, confirmedAt: new Date() },
  });
  await releaseEscrow(orderId, 'Худалдан авагч хүлээн авснаа баталгаажуулсан');
  return json({ message: 'Бараа хүлээн авсанаа баталгаажууллаа!' });
}
