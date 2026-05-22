import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireAuth } from '@/lib/api-auth';
import { buildOwnedFeedWhere } from '@/lib/feedOwnership';

type Ctx = { params: Promise<{ id: string }> };

function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;

  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return errorJson('Буруу зарын ID', 400);

  const ownedWhere = await buildOwnedFeedWhere(auth.id);
  const item = await prisma.feedItem.findFirst({
    where: { id, AND: [ownedWhere] },
    select: { id: true },
  });
  if (!item) return errorJson('Зар олдсонгүй эсвэл эрх хүрэхгүй байна', 404);

  await prisma.entityMedia.deleteMany({ where: { feedItemId: id } });
  await prisma.feedItem.delete({ where: { id } });

  return json({ id });
}
