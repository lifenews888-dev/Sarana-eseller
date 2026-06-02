import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireSeller } from '@/lib/api-auth';
import { isValidPublicImageUrl } from '@/lib/image-url';

type Ctx = { params: Promise<{ id: string; addonId: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = requireSeller(req);
  if (auth instanceof Response) return auth;
  const { addonId } = await ctx.params;
  const body = await req.json();
  if (body.image !== undefined && body.image !== null && body.image !== '' && !isValidPublicImageUrl(body.image)) {
    return errorJson('image must be a public URL', 400);
  }
  const addon = await prisma.addOn.update({
    where: { id: addonId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.price !== undefined && { price: Number(body.price) }),
      ...(body.image !== undefined && { image: body.image && isValidPublicImageUrl(body.image) ? body.image : null }),
      ...(body.available !== undefined && { available: body.available }),
    },
  });
  return json(addon);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = requireSeller(req);
  if (auth instanceof Response) return auth;
  const { addonId } = await ctx.params;
  await prisma.addOn.delete({ where: { id: addonId } });
  return json({ deleted: true });
}
