import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireSeller, getShopForUser } from '@/lib/api-auth';
import { sanitizeImageUrls } from '@/lib/image-url';

// GET /api/services?shopId=... | shopId=all returns all active services across shops
export async function GET(req: NextRequest) {
  try {
    const shopId = req.nextUrl.searchParams.get('shopId');
    if (!shopId) return errorJson('shopId шаардлагатай');

    const where = shopId === 'all' ? { isActive: true } : { shopId };

    const services = await prisma.service.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: shopId === 'all' ? 50 : undefined,
    });

    return json(services);
  } catch (e: unknown) {
    console.warn('Services API error:', (e as Error).message);
    return json([]);
  }
}

// POST /api/services — create service (auth required, seller only)
export async function POST(req: NextRequest) {
  const auth = requireSeller(req);
  if (auth instanceof Response) return auth;

  const shopId = await getShopForUser(auth.id);
  if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);

  const body = await req.json();
  const { name, description, price, duration, category, images, isActive } = body;

  if (!name || !price) return errorJson('Нэр болон үнэ шаардлагатай');

  const service = await prisma.service.create({
    data: {
      shopId,
      name,
      description: description || null,
      price: Number(price),
      duration: duration ? Number(duration) : null,
      category: category || null,
      images: sanitizeImageUrls(images),
      isActive: isActive !== false,
    },
  });

  return json(service, 201);
}
