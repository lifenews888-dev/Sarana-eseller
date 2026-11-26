import { NextRequest, NextResponse } from 'next/server';
import { json, errorJson, requireAdmin } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest,
  ctx: { params: Promise<{ id: string }> },) {
  // Аюулгүй байдал: зөвхөн админ (өмнө нь нэвтрэлтгүй дуудагдах боломжтой байсан)
  const adminUser = requireAdmin(req);
  if (adminUser instanceof NextResponse) return adminUser;
  const { id } = await ctx.params;

  const application = await prisma.bNPLApplication.findUnique({
    where: { id },
  });
  if (!application) return errorJson('BNPL өргөдөл олдсонгүй', 404);

  if (application.status !== 'PENDING') {
    return errorJson(`Өргөдөл аль хэдийн ${application.status} төлөвтэй`);
  }

  // Create payment schedule
  const payments: { applicationId: string; dueDate: Date; amount: number; status: string }[] = [];
  const now = new Date();
  for (let i = 1; i <= application.months; i++) {
    const dueDate = new Date(now);
    dueDate.setMonth(dueDate.getMonth() + i);
    payments.push({
      applicationId: id,
      dueDate,
      amount: application.monthlyAmount,
      status: 'PENDING',
    });
  }

  // Use transaction to update status and create payments atomically
  const [updated] = await prisma.$transaction([
    prisma.bNPLApplication.update({
      where: { id },
      data: { status: 'ACTIVE', approvedAt: new Date() },
    }),
    ...payments.map((p) => prisma.bNPLPayment.create({ data: p })),
  ]);

  const result = await prisma.bNPLApplication.findUnique({
    where: { id },
    include: { payments: { orderBy: { dueDate: 'asc' } } },
  });

  return json(result);
}
