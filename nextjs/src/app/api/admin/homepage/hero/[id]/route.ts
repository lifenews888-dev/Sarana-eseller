import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminDB as requireAdmin } from '@/lib/api-auth';
import { isValidPublicImageUrl } from '@/lib/image-url';

type Ctx = { params: Promise<{ id: string }> };

// PUT — засах
export async function PUT(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { id } = await ctx.params;
  const body = await req.json();

  if (body.imageUrl !== undefined && body.imageUrl !== null && body.imageUrl !== '' && !isValidPublicImageUrl(body.imageUrl)) {
    return NextResponse.json({ error: 'imageUrl must be a public URL' }, { status: 400 });
  }
  if (body.videoUrl !== undefined && body.videoUrl !== null && body.videoUrl !== '' && !isValidPublicImageUrl(body.videoUrl)) {
    return NextResponse.json({ error: 'videoUrl must be a public URL' }, { status: 400 });
  }

  const banner = await prisma.heroBanner.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.subtitle !== undefined && { subtitle: body.subtitle }),
      ...(body.videoUrl !== undefined && { videoUrl: body.videoUrl || null }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
      ...(body.buttonText !== undefined && { buttonText: body.buttonText }),
      ...(body.buttonLink !== undefined && { buttonLink: body.buttonLink }),
      ...(body.badge !== undefined && { badge: body.badge }),
      ...(body.color !== undefined && { color: body.color }),
      ...(body.gradient !== undefined && { gradient: body.gradient }),
      ...(body.order !== undefined && { order: body.order }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });
  return NextResponse.json(banner);
}

// DELETE — устгах
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { id } = await ctx.params;
  await prisma.heroBanner.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// PATCH — order/isActive өөрчлөх
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { id } = await ctx.params;
  const body = await req.json();
  const banner = await prisma.heroBanner.update({
    where: { id },
    data: {
      ...(body.order !== undefined && { order: body.order }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });
  return NextResponse.json(banner);
}
