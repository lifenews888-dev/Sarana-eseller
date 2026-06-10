import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireSeller, getShopForRequest } from '@/lib/api-auth';
import { sanitizeImageUrls } from '@/lib/image-url';

type Ctx = { params: Promise<{ id: string }> };

// PUT /api/services/[id] — update service
export async function PUT(req: NextRequest, ctx: Ctx) {
  const auth = requireSeller(req);
  if (auth instanceof Response) return auth;

  const { id } = await ctx.params;
  const shopId = await getShopForRequest(req, auth.id);
  if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);

  // Verify ownership
  const existing = await prisma.service.findFirst({ where: { id, shopId } });
  if (!existing) return errorJson('Үйлчилгээ олдсонгүй', 404);

  const body = await req.json();
  const { name, description, price, duration, category, images, isActive } = body;

  const service = await prisma.service.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: Number(price) }),
      ...(duration !== undefined && { duration: duration ? Number(duration) : null }),
      ...(category !== undefined && { category }),
      ...(images !== undefined && { images: sanitizeImageUrls(images) }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return json(service);
}

// DELETE /api/services/[id] — delete service
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = requireSeller(req);
  if (auth instanceof Response) return auth;

  const { id } = await ctx.params;
  const shopId = await getShopForRequest(req, auth.id);
  if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);

  const existing = await prisma.service.findFirst({ where: { id, shopId } });
  if (!existing) return errorJson('Үйлчилгээ олдсонгүй', 404);

  await prisma.service.delete({ where: { id } });

  return json({ deleted: true });
}
