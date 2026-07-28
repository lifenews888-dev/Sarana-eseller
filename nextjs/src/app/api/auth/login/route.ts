import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { ok, fail } from '@/lib/api-envelope';

const JWT_SECRET = process.env.JWT_SECRET || 'eseller-jwt-secret-key-change-in-production-2026';

export async function POST(req: NextRequest) {
  try {
    const { email, phone, password } = await req.json();

    if ((!email && !phone) || !password) {
      return fail('Имэйл/утас болон нууц үг оруулна уу', 400);
    }

    // Login by email OR phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email: email.toLowerCase() }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
      include: {
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

    if (!user) {
      return fail('Хэрэглэгч олдсонгүй', 401);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return fail('Имэйл эсвэл нууц үг буруу', 401);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, entityType: user.entityType },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

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

    const res = ok({
      token,
      user: {
        _id: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        username: user.username,
        avatar: user.avatar,
        entityType: user.entityType,
        store: entityStore,
        shops: user.shops,
      },
    });

    // Mirror the token into an httpOnly cookie so Edge middleware can enforce
    // role-based access on /dashboard/* routes. Client code still reads the
    // token from localStorage for the Authorization header — the cookie is
    // middleware-only.
    res.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return res;
  } catch (e: unknown) {
    console.error('LOGIN ERROR:', (e as Error).message);
    return fail('Нэвтрэхэд алдаа гарлаа', 500);
  }
}
