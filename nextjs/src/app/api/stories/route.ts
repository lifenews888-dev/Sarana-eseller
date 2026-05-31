import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { getSafeImageList, isValidPublicImageUrl } from '@/lib/image-url';

// GET /api/stories - list active (24h) stories
export async function GET() {
  const stories = await prisma.story.findMany({
    where: { expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      product: { select: { id: true, name: true, price: true, images: true } },
    },
  });

  return NextResponse.json({
    data: {
      stories: stories.map((story) => ({
        ...story,
        imageUrl: isValidPublicImageUrl(story.imageUrl) ? story.imageUrl : null,
        product: story.product ? { ...story.product, images: getSafeImageList(story.product.images) } : null,
      })),
    },
  });
}

// POST /api/stories - create new story (24h expiry)
export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { imageUrl, productId, caption } = await req.json();
  if (!imageUrl) return errorJson('imageUrl required');
  if (!isValidPublicImageUrl(imageUrl)) return errorJson('imageUrl must be a public URL', 400);

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const story = await prisma.story.create({
    data: {
      userId: user.id,
      imageUrl,
      productId: productId || null,
      caption: caption || null,
      expiresAt,
    },
  });

  return json(story, 201);
}
