import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireSeller } from '@/lib/api-auth';
import { isValidPublicImageUrl } from '@/lib/image-url';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const addons = await prisma.addOn.findMany({ where: { productId: id, available: true } });
  return json(addons);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = requireSeller(req);
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;
  const { name, price, image } = await req.json();
  if (!name || price === undefined) return errorJson('Нэр болон үнэ шаардлагатай');
  const safeImage = image && isValidPublicImageUrl(image) ? image : null;
  if (image && !safeImage) return errorJson('image must be a public URL', 400);
  const addon = await prisma.addOn.create({ data: { productId: id, name, price: Number(price), image: safeImage } });
  return json(addon, 201);
}
