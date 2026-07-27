import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/lib/api-envelope';

const JWT_SECRET = process.env.JWT_SECRET || 'eseller-jwt-secret-key-change-in-production-2026';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    return fail('Нэвтрэх шаардлагатай', 401);
  }
  const token = header.slice(7).trim();
  if (!token) return fail('Нэвтрэх шаардлагатай', 401);

  let payload: jwt.JwtPayload;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded !== 'object' || decoded === null) {
      return fail('Хүчингүй сесс', 401);
    }
    payload = decoded;
  } catch {
    return fail('Хүчингүй сесс', 401);
  }

  const userId =
    (payload as Record<string, unknown>).id ??
    (payload as Record<string, unknown>).userId ??
    (payload as Record<string, unknown>)._id ??
    payload.sub;

  if (typeof userId !== 'string' || !userId) {
    return fail('Хүчингүй сесс', 401);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { name: true, slug: true, logo: true, phone: true, address: true },
        },
        agent: { select: { name: true, slug: true, profilePhoto: true, phone: true, address: true } },
        company: { select: { name: true, slug: true, logo: true, phone: true, address: true } },
        autoDealer: { select: { name: true, slug: true, logo: true, phone: true, address: true } },
        serviceProvider: { select: { name: true, slug: true, logo: true, phone: true, address: true } },
      },
    });

    if (!user) return fail('Хэрэглэгч олдсонгүй', 404);

    const entityStore =
      user.shops[0] ||
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
      },
    });
  } catch (e: unknown) {
    console.error('AUTH/ME ERROR:', (e as Error).message);
    return fail('Сесс шалгахад алдаа гарлаа', 500);
  }
}
