import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireAuth } from '@/lib/api-auth';
import { isValidPublicImageUrl } from '@/lib/image-url';

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/admin/banners/[id]
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  if (auth.role !== 'admin' && auth.role !== 'superadmin') return errorJson('Админ эрх шаардлагатай', 403);

  try {
    const { id } = await ctx.params;
    const body = await req.json();
    if (body.imageUrl !== undefined && !isValidPublicImageUrl(body.imageUrl)) {
      return errorJson('imageUrl must be a public URL', 400);
    }
    if (body.startsAt) body.startsAt = new Date(body.startsAt);
    if (body.endsAt) body.endsAt = new Date(body.endsAt);

    const banner = await prisma.banner.update({ where: { id }, data: body });
    return json(banner);
  } catch (e: unknown) {
    return errorJson((e as Error).message, 500);
  }
}

// DELETE /api/admin/banners/[id]
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  if (auth.role !== 'admin' && auth.role !== 'superadmin') return errorJson('Админ эрх шаардлагатай', 403);

  try {
    const { id } = await ctx.params;
    await prisma.bannerAnalytic.deleteMany({ where: { bannerId: id } });
    await prisma.banner.delete({ where: { id } });
    return json({ deleted: true });
  } catch (e: unknown) {
    return errorJson((e as Error).message, 500);
  }
}
