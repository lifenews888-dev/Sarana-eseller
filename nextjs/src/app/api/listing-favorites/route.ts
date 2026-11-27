import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';

const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);

// GET /api/listing-favorites            — миний хадгалсан зарууд
// GET /api/listing-favorites?feedItemId= — тухайн зар хадгалагдсан эсэх
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;

  const feedItemId = req.nextUrl.searchParams.get('feedItemId');
  if (feedItemId) {
    if (!isValidObjectId(feedItemId)) return json({ saved: false });
    const fav = await prisma.listingFavorite.findUnique({
      where: { userId_feedItemId: { userId: auth.id, feedItemId } },
      select: { id: true },
    });
    return json({ saved: Boolean(fav) });
  }

  const favs = await prisma.listingFavorite.findMany({
    where: { userId: auth.id },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  const ids = favs.map((f) => f.feedItemId);
  const items = ids.length
    ? await prisma.feedItem.findMany({
        where: { id: { in: ids } },
        select: { id: true, title: true, price: true, images: true, district: true, status: true, tier: true, createdAt: true },
      })
    : [];
  const byId = new Map(items.map((i) => [i.id, i]));
  return json(ids.map((id) => byId.get(id)).filter(Boolean));
}

// POST /api/listing-favorites { feedItemId } — хадгалах / хасах (toggle)
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;

  const body = await req.json().catch(() => ({}));
  const feedItemId = String(body?.feedItemId || '');
  if (!isValidObjectId(feedItemId)) return errorJson('Буруу зарын ID', 400);

  const existing = await prisma.listingFavorite.findUnique({
    where: { userId_feedItemId: { userId: auth.id, feedItemId } },
    select: { id: true },
  });
  if (existing) {
    await prisma.listingFavorite.delete({ where: { id: existing.id } });
    return json({ saved: false });
  }
  const item = await prisma.feedItem.findUnique({ where: { id: feedItemId }, select: { id: true } });
  if (!item) return errorJson('Зар олдсонгүй', 404);
  await prisma.listingFavorite.create({ data: { userId: auth.id, feedItemId } });
  return json({ saved: true });
}
