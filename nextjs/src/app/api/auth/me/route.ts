import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/lib/api-envelope';
import { getAuthUser } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return fail('Хүчингүй сесс', 401);

  try {
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        username: true,
        role: true,
        avatar: true,
        store: true,
        entityType: true,
        shops: {
          select: { id: true, name: true, slug: true, logo: true, phone: true, address: true },
          orderBy: { createdAt: 'asc' },
          take: 20,
        },
        agent: { select: { name: true, slug: true, profilePhoto: true, phone: true, address: true } },
        company: { select: { name: true, slug: true, logo: true, phone: true, address: true } },
        autoDealer: { select: { name: true, slug: true, logo: true, phone: true, address: true } },
        serviceProvider: { select: { name: true, slug: true, logo: true, phone: true, address: true } },
      },
    });

    if (!user) return fail('Хэрэглэгч олдсонгүй', 404);

    const primaryShop = user.shops[0]
      ? {
          id: user.shops[0].id,
          name: user.shops[0].name,
          slug: user.shops[0].slug,
          logo: user.shops[0].logo,
          phone: user.shops[0].phone,
          address: user.shops[0].address,
        }
      : null;

    const entityStore =
      primaryShop ||
      (user.agent
        ? { name: user.agent.name, slug: user.agent.slug, logo: user.agent.profilePhoto, phone: user.agent.phone, address: user.agent.address }
        : null) ||
      user.company ||
      user.autoDealer ||
      user.serviceProvider ||
      user.store;

    return ok({
      user: {
        _id: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        username: user.username,
        avatar: user.avatar,
        entityType: user.entityType,
        store: entityStore,
        shops: user.shops,
      },
    });
  } catch (e: unknown) {
    console.error('AUTH/ME ERROR:', (e as Error).message);
    return fail('Сесс шалгахад алдаа гарлаа', 500);
  }
}
