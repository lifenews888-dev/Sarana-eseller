import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminDB as requireAdmin } from '@/lib/api-auth';
import { isValidPublicImageUrl } from '@/lib/image-url';

// GET — бүх hero banner жагсаалт
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const banners = await prisma.heroBanner.findMany({
    orderBy: { order: 'asc' },
  });
  return NextResponse.json(banners);
}

// POST — шинэ banner нэмэх
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const body = await req.json();
  const { imageUrl, videoUrl } = body;

  if (imageUrl && !isValidPublicImageUrl(imageUrl)) {
    return NextResponse.json({ error: 'imageUrl must be a public URL' }, { status: 400 });
  }
  if (videoUrl && !isValidPublicImageUrl(videoUrl)) {
    return NextResponse.json({ error: 'videoUrl must be a public URL' }, { status: 400 });
  }

  const banner = await prisma.heroBanner.create({
    data: {
      title: body.title || 'Шинэ баннер',
      subtitle: body.subtitle || null,
      videoUrl: videoUrl || null,
      imageUrl: imageUrl || null,
      buttonText: body.buttonText || null,
      buttonLink: body.buttonLink || null,
      badge: body.badge || null,
      color: body.color || '#E8242C',
      gradient: body.gradient || null,
      order: body.order ?? 0,
      isActive: body.isActive ?? true,
    },
  });
  return NextResponse.json(banner, { status: 201 });
}
