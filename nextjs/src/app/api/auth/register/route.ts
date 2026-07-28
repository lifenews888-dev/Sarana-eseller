import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ok, fail } from '@/lib/api-envelope';

const JWT_SECRET = process.env.JWT_SECRET || 'eseller-jwt-secret-key-change-in-production-2026';

export async function POST(req: Request) {
  try {
    const { name, email, phone, password, role: requestedRole } = await req.json();

    if (!name || !password) {
      return fail('Нэр, нууц үг оруулна уу', 400);
    }
    if (!email && !phone) {
      return fail('Имэйл эсвэл утас оруулна уу', 400);
    }
    if (password.length < 6) {
      return fail('Нууц үг 6+ тэмдэгт байх ёстой', 400);
    }

    // Synthetic email for phone-only registration (email is @unique required)
    const normalizedEmail = (email || `${phone}@phone.eseller.mn`).toLowerCase();

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          ...(phone ? [{ phone }] : []),
        ],
      },
    });
    if (existing) {
      return fail('Энэ имэйл/утас бүртгэлтэй байна', 400);
    }

    const VALID_ROLES = ['seller', 'affiliate', 'buyer', 'delivery'];
    const role = requestedRole && VALID_ROLES.includes(requestedRole) ? requestedRole : 'buyer';

    const hashed = await bcrypt.hash(password, 12);
    const usernameBase = email ? email.split('@')[0] : phone || 'user';
    const username = usernameBase + Math.floor(Math.random() * 1000);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        phone: phone || undefined,
        password: hashed,
        role,
        username,
      },
    });

    // Auto-create SellerProfile for affiliates (commission marketers)
    if (role === 'affiliate') {
      const baseUsername = (email ? email.split('@')[0] : phone || 'aff')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      let affUsername = baseUsername || `aff${user.id.slice(-6)}`;
      let affSuffix = 0;
      while (await prisma.sellerProfile.findFirst({ where: { username: affUsername } })) {
        affSuffix++;
        affUsername = `${baseUsername}${affSuffix}`;
      }
      await prisma.sellerProfile.create({
        data: {
          userId: user.id,
          username: affUsername,
          displayName: name,
          isActive: true,
          commissionRate: 10,
          sellerType: 'REGULAR',
        },
      });
    }

    // Auto-create Shop for sellers
    let shops: Array<{ id: string; name: string; slug: string; logo: string | null; phone: string | null; address: string | null }> = [];
    if (role === 'seller') {
      const baseSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9\u0400-\u04ff]+/g, '-')
        .replace(/^-|-$/g, '') || `shop-${user.id.slice(-6)}`;

      let slug = baseSlug;
      let suffix = 0;
      while (
        await prisma.shop.findFirst({
          where: { OR: [{ slug }, { storefrontSlug: slug }] },
        })
      ) {
        suffix++;
        slug = `${baseSlug}-${suffix}`;
      }

      const shop = await prisma.shop.create({
        data: {
          userId: user.id,
          name,
          slug,
          storefrontSlug: slug,
          industry: 'general',
          locationStatus: 'pending',
        },
        select: { id: true, name: true, slug: true, logo: true, phone: true, address: true },
      });
      shops = [shop];
    }

    const token = jwt.sign(
      { id: user.id, userId: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' },
    );

    const primaryShop = shops[0]
      ? {
          id: shops[0].id,
          name: shops[0].name,
          slug: shops[0].slug,
          logo: shops[0].logo,
          phone: shops[0].phone,
          address: shops[0].address,
        }
      : null;

    const res = ok(
      {
        token,
        user: {
          _id: user.id,
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          store: primaryShop,
          shops,
        },
      },
      201,
    );

    // Mirror the token into an httpOnly cookie so Edge middleware can enforce
    // role-based access on /dashboard/* routes. Client code still reads the
    // token from localStorage for the Authorization header.
    res.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return res;
  } catch (e: any) {
    return fail(e.message || 'Бүртгэл үүсгэхэд алдаа гарлаа', 500);
  }
}
