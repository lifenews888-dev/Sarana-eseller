import { NextRequest, NextResponse } from 'next/server';
import { json, errorJson, requireAdminDB } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

const STATUSES = ['new', 'contacted', 'closed'];

// GET /api/admin/corporate-orders?status=new
export async function GET(req: NextRequest) {
  const admin = await requireAdminDB(req);
  if (admin instanceof NextResponse) return admin;
  const status = req.nextUrl.searchParams.get('status');
  const rows = await prisma.corporateOrderRequest.findMany({
    where: status && STATUSES.includes(status) ? { status } : {},
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return json(rows);
}

// PATCH /api/admin/corporate-orders { id, status?, adminNote? }
export async function PATCH(req: NextRequest) {
  const admin = await requireAdminDB(req);
  if (admin instanceof NextResponse) return admin;
  const body = await req.json().catch(() => ({}));
  const id = typeof body.id === 'string' && /^[a-f\d]{24}$/i.test(body.id) ? body.id : '';
  if (!id) return errorJson('id шаардлагатай');
  const data: { status?: string; adminNote?: string } = {};
  if (typeof body.status === 'string') {
    if (!STATUSES.includes(body.status)) return errorJson('Төлөв буруу');
    data.status = body.status;
  }
  if (typeof body.adminNote === 'string') data.adminNote = body.adminNote.slice(0, 2000);
  const row = await prisma.corporateOrderRequest.update({ where: { id }, data }).catch(() => null);
  if (!row) return errorJson('Олдсонгүй', 404);
  return json(row);
}
