import { NextRequest, NextResponse } from 'next/server';
import { json, errorJson, requireAdminDB } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { findProvince } from '@/lib/herder';

// GET /api/admin/herder-coordinators — координаторуудын жагсаалт
export async function GET(req: NextRequest) {
  const admin = await requireAdminDB(req);
  if (admin instanceof NextResponse) return admin;
  const rows = await prisma.herderCoordinator.findMany({ orderBy: { createdAt: 'desc' } });
  const users = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.userId) } },
    select: { id: true, name: true, email: true, phone: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));
  return json(rows.map((r) => ({ ...r, user: userMap.get(r.userId) || null })));
}

// POST /api/admin/herder-coordinators { phone | email | userId, provinces: string[], isActive? }
// Хэрэглэгчийг координатор болгох / хамрах аймгийг шинэчлэх
export async function POST(req: NextRequest) {
  const admin = await requireAdminDB(req);
  if (admin instanceof NextResponse) return admin;

  const body = await req.json().catch(() => ({}));
  const phone = typeof body.phone === 'string' ? body.phone.replace(/\D/g, '') : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const userId = typeof body.userId === 'string' && /^[a-f\d]{24}$/i.test(body.userId) ? body.userId : '';

  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : email
      ? await prisma.user.findUnique({ where: { email } })
      : phone
        ? await prisma.user.findFirst({ where: { phone } })
        : null;
  if (!user) return errorJson('Хэрэглэгч олдсонгүй', 404);

  const provinces = Array.isArray(body.provinces)
    ? Array.from(new Set(body.provinces.map((p: unknown) => findProvince(String(p))?.code).filter(Boolean) as string[]))
    : [];
  if (provinces.length === 0) return errorJson('Хариуцах аймгаа сонгоно уу');
  const isActive = body.isActive !== false;

  const coordinator = await prisma.herderCoordinator.upsert({
    where: { userId: user.id },
    create: { userId: user.id, provinces, isActive },
    update: { provinces, isActive },
  });
  if (isActive && (user.role === 'buyer' || !user.role)) {
    await prisma.user.update({ where: { id: user.id }, data: { role: 'coordinator' } });
  }
  return json(coordinator, 201);
}
