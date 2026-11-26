import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireAuth } from '@/lib/api-auth';

// GET /api/admin/banners/plans
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  if (!['admin', 'superadmin', 'super_admin'].includes(auth.role)) return errorJson('Админ эрх шаардлагатай', 403);

  try {
    const plans = await prisma.bannerPlan.findMany({ orderBy: { sortOrder: 'asc' } });
    return json(plans);
  } catch (e: unknown) {
    return errorJson((e as Error).message, 500);
  }
}

// POST /api/admin/banners/plans
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  if (!['admin', 'superadmin', 'super_admin'].includes(auth.role)) return errorJson('Админ эрх шаардлагатай', 403);

  try {
    const body = await req.json();
    const { name, slot, durationDays, price } = body;
    if (!name || !slot || !durationDays || price == null) {
      return errorJson('name, slot, durationDays, price шаардлагатай');
    }

    const plan = await prisma.bannerPlan.create({ data: body });
    return json(plan, 201);
  } catch (e: unknown) {
    return errorJson((e as Error).message, 500);
  }
}
