import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { buildOwnedFeedWhere } from '@/lib/feedOwnership';

type Ctx = { params: Promise<{ id: string }> };
const TTL_DAYS = 30;

// POST /api/feed/:id/renew — зарын хугацааг өнөөдрөөс 30 хоногоор сунгана (эзэн өөрөө, үнэгүй)
export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;
  if (!/^[a-f\d]{24}$/i.test(id)) return errorJson('Буруу зарын ID', 400);

  const ownedWhere = await buildOwnedFeedWhere(auth.id);
  const item = await prisma.feedItem.findFirst({ where: { id, AND: [ownedWhere] }, select: { id: true, status: true } });
  if (!item) return errorJson('Зар олдсонгүй эсвэл эрх хүрэхгүй байна', 404);
  if (item.status === 'suspended') return errorJson('Админ хаасан зарыг сунгах боломжгүй', 409);

  const expiresAt = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.feedItem.update({
    where: { id },
    data: { expiresAt, ...(item.status === 'expired' ? { status: 'active' } : {}) },
  });
  return json({ id, expiresAt });
}
