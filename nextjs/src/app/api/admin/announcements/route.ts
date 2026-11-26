import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireAuth } from '@/lib/api-auth';

// GET /api/admin/announcements
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  if (!['admin', 'superadmin', 'super_admin'].includes(auth.role)) return errorJson('Админ эрх шаардлагатай', 403);

  try {
    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return json(announcements);
  } catch (e: unknown) {
    return errorJson((e as Error).message, 500);
  }
}

// POST /api/admin/announcements
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  if (!['admin', 'superadmin', 'super_admin'].includes(auth.role)) return errorJson('Админ эрх шаардлагатай', 403);

  try {
    const body = await req.json();
    const { text } = body;
    if (!text) return errorJson('text шаардлагатай');

    const announcement = await prisma.announcement.create({ data: body });
    return json(announcement, 201);
  } catch (e: unknown) {
    return errorJson((e as Error).message, 500);
  }
}
