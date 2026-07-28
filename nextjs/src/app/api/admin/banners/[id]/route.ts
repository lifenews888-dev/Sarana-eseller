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
    if (
      body.imageMobile !== undefined &&
      body.imageMobile !== null &&
      body.imageMobile !== '' &&
      !isValidPublicImageUrl(body.imageMobile)
    ) {
      return errorJson('imageMobile must be a public URL', 400);
    }

    // Whitelist only editable fields — never allow mass-assign of refId/impressions/clicks.
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.slot !== undefined) data.slot = body.slot;
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
    if (body.imageMobile !== undefined) data.imageMobile = body.imageMobile || null;
    if (body.linkUrl !== undefined) data.linkUrl = body.linkUrl;
    if (body.altText !== undefined) data.altText = body.altText;
    if (body.bgColor !== undefined) data.bgColor = body.bgColor;
    if (body.entityId !== undefined) data.entityId = body.entityId;
    if (body.entityName !== undefined) data.entityName = body.entityName;
    if (body.status !== undefined) data.status = body.status;
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) || 0;
    if (body.isPaid !== undefined) data.isPaid = Boolean(body.isPaid);
    if (body.planId !== undefined) data.planId = body.planId;
    if (body.paymentId !== undefined) data.paymentId = body.paymentId;
    if (body.price !== undefined) data.price = body.price == null ? null : Number(body.price);
    if (body.startsAt !== undefined) data.startsAt = new Date(body.startsAt);
    if (body.endsAt !== undefined) data.endsAt = new Date(body.endsAt);

    const banner = await prisma.banner.update({ where: { id }, data });
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
