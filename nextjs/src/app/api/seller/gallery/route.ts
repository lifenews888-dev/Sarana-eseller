import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopForRequest } from '@/lib/api-auth';
import { sanitizeImageUrls } from '@/lib/image-url';

function readGallery(config: unknown): string[] {
  const value = (config as Record<string, unknown> | null)?.galleryImages;
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export async function GET(req: NextRequest) {
  const ctx = await requireShopForRequest(req);
  if (ctx instanceof NextResponse) return ctx;

  const shop = await prisma.shop.findUnique({
    where: { id: ctx.shopId },
    select: { storefrontConfig: true },
  });

  return NextResponse.json({ images: readGallery(shop?.storefrontConfig) });
}

export async function POST(req: NextRequest) {
  const ctx = await requireShopForRequest(req);
  if (ctx instanceof NextResponse) return ctx;

  const body = await req.json();
  const nextImages = sanitizeImageUrls([body.url, ...(Array.isArray(body.images) ? body.images : [])]);
  if (nextImages.length === 0) {
    return NextResponse.json({ error: 'Зураг шаардлагатай' }, { status: 400 });
  }

  const shop = await prisma.shop.findUnique({ where: { id: ctx.shopId }, select: { storefrontConfig: true } });
  const config = (shop?.storefrontConfig as Record<string, unknown>) || {};
  const images = Array.from(new Set([...nextImages, ...readGallery(config)]));

  await prisma.shop.update({
    where: { id: ctx.shopId },
    data: { storefrontConfig: { ...config, galleryImages: images } },
  });

  return NextResponse.json({ images });
}

export async function DELETE(req: NextRequest) {
  const ctx = await requireShopForRequest(req);
  if (ctx instanceof NextResponse) return ctx;

  const body = await req.json();
  const shop = await prisma.shop.findUnique({ where: { id: ctx.shopId }, select: { storefrontConfig: true } });
  const config = (shop?.storefrontConfig as Record<string, unknown>) || {};
  const images = readGallery(config).filter((url) => url !== body.url);

  await prisma.shop.update({
    where: { id: ctx.shopId },
    data: { storefrontConfig: { ...config, galleryImages: images } },
  });

  return NextResponse.json({ images });
}
