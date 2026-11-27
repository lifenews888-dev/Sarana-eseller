import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireAuth } from '@/lib/api-auth';
import { pickPlanFields } from '@/lib/bannerAds';

type Ctx = { params: Promise<{ id: string }> };
const isAdmin = (role: string) => ['admin', 'superadmin', 'super_admin'].includes(role);

// PATCH /api/admin/banners/plans/:id — үнэ, хугацаа, идэвхтэй эсэхийг засна
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  if (!isAdmin(auth.role)) return errorJson('Админ эрх шаардлагатай', 403);
  const { id } = await ctx.params;
  if (!/^[a-f\d]{24}$/i.test(id)) return errorJson('Буруу ID', 400);
  const body = await req.json().catch(() => ({}));
  try {
    return json(await prisma.bannerPlan.update({ where: { id }, data: pickPlanFields(body) }));
  } catch {
    return errorJson('Багц олдсонгүй', 404);
  }
}

// DELETE /api/admin/banners/plans/:id
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  if (!isAdmin(auth.role)) return errorJson('Админ эрх шаардлагатай', 403);
  const { id } = await ctx.params;
  if (!/^[a-f\d]{24}$/i.test(id)) return errorJson('Буруу ID', 400);
  await prisma.bannerPlan.deleteMany({ where: { id } });
  return json({ deleted: true });
}
