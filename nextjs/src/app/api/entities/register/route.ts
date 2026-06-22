import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireAuth, signToken } from '@/lib/api-auth';
import { isValidPublicImageUrl } from '@/lib/image-url';

function normalizeSlug(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function publicImageOrNull(value: unknown): string | null {
  return isValidPublicImageUrl(value) ? value : null;
}

function industryForEntity(entityType: string): string {
  const industryMap: Record<string, string> = {
    store: 'general',
    order_store: 'order',
    digital: 'digital',
    pre_order: 'preorder',
    agent: 'agent',
    real_estate: 'agent',
    company: 'company',
    construction: 'company',
    auto_dealer: 'auto_dealer',
    service: 'service',
  };
  return industryMap[entityType] || 'general';
}

function shopTypeForEntity(entityType: string): string {
  return entityType === 'service' ? 'service' : 'product';
}

// POST /api/entities/register
// Auto-upsert the selected seller entity for the current user and refresh auth
// so the dashboard immediately switches to the matching seller tools.
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;

  const body = await req.json();
  const {
    entityType,
    name,
    slug,
    phone,
    description,
    regNumber,
    licenseNumber,
    address,
    district,
    website,
    socialFb,
    socialIg,
    logo,
    coverImage,
  } = body;

  if (!entityType || !name) return errorJson('entityType, name шаардлагатай');

  const safeSlug = normalizeSlug(slug) || normalizeSlug(name) || `seller-${auth.id.slice(-8).toLowerCase()}`;
  const safeLogo = publicImageOrNull(logo);
  const safeCoverImage = publicImageOrNull(coverImage);

  try {
    const [slugExistsInShops, slugExistsInAgents, slugExistsInCompanies, slugExistsInAutoDealers, slugExistsInServices] =
      await Promise.all([
        prisma.shop.findFirst({
          where: {
            NOT: { userId: auth.id },
            OR: [{ slug: safeSlug }, { storefrontSlug: safeSlug }],
          },
          select: { id: true },
        }),
        prisma.agent.findFirst({ where: { slug: safeSlug, NOT: { userId: auth.id } }, select: { id: true } }),
        prisma.company.findFirst({ where: { slug: safeSlug, NOT: { userId: auth.id } }, select: { id: true } }),
        prisma.autoDealer.findFirst({ where: { slug: safeSlug, NOT: { userId: auth.id } }, select: { id: true } }),
        prisma.serviceProvider.findFirst({ where: { slug: safeSlug, NOT: { userId: auth.id } }, select: { id: true } }),
      ]);
    if (slugExistsInShops || slugExistsInAgents || slugExistsInCompanies || slugExistsInAutoDealers || slugExistsInServices) {
      return errorJson('Энэ slug аль хэдийн бүртгэлтэй байна');
    }

    let entity;

    switch (entityType) {
      case 'store':
      case 'order_store':
      case 'digital':
      case 'pre_order':
      case 'agent':
      case 'real_estate':
      case 'company':
      case 'construction':
      case 'auto_dealer':
      case 'service': {
        entity = await prisma.shop.create({
          data: {
            userId: auth.id,
            name,
            slug: safeSlug,
            storefrontSlug: safeSlug,
            logo: safeLogo,
            phone,
            address,
            district,
            industry: industryForEntity(entityType),
            locationStatus: 'pending',
            shopType: {
              create: { type: shopTypeForEntity(entityType) },
            },
          },
        });
        break;
      }
      case 'legacy_agent': {
        const existing = await prisma.agent.findFirst({ where: { userId: auth.id } });
        entity = existing
          ? await prisma.agent.update({
              where: { id: existing.id },
              data: {
                name,
                slug: safeSlug,
                phone,
                address,
                district,
                bio: description,
                licenseNumber,
                profilePhoto: logo === undefined ? undefined : safeLogo,
                coverImage: coverImage === undefined ? undefined : safeCoverImage,
              },
            })
          : await prisma.agent.create({
              data: {
                userId: auth.id,
                name,
                slug: safeSlug,
                phone,
                address,
                district,
                bio: description,
                licenseNumber,
                profilePhoto: safeLogo,
                coverImage: safeCoverImage,
                isVerified: false,
              },
            });
        break;
      }
      case 'legacy_company': {
        const existing = await prisma.company.findFirst({ where: { userId: auth.id } });
        const socialLinks = { website, facebook: socialFb, instagram: socialIg };
        entity = existing
          ? await prisma.company.update({
              where: { id: existing.id },
              data: {
                name,
                slug: safeSlug,
                phone,
                address,
                district,
                description,
                licenseNumber: regNumber,
                logo: logo === undefined ? undefined : safeLogo,
                coverImage: coverImage === undefined ? undefined : safeCoverImage,
                socialLinks,
              },
            })
          : await prisma.company.create({
              data: {
                userId: auth.id,
                name,
                slug: safeSlug,
                phone,
                address,
                district,
                description,
                licenseNumber: regNumber,
                logo: safeLogo,
                coverImage: safeCoverImage,
                socialLinks,
                isVerified: false,
              },
            });
        break;
      }
      case 'legacy_auto_dealer': {
        const existing = await prisma.autoDealer.findFirst({ where: { userId: auth.id } });
        entity = existing
          ? await prisma.autoDealer.update({
              where: { id: existing.id },
              data: {
                name,
                slug: safeSlug,
                phone,
                address,
                district,
                description,
                logo: logo === undefined ? undefined : safeLogo,
                coverImage: coverImage === undefined ? undefined : safeCoverImage,
              },
            })
          : await prisma.autoDealer.create({
              data: {
                userId: auth.id,
                name,
                slug: safeSlug,
                phone,
                address,
                district,
                description,
                logo: safeLogo,
                coverImage: safeCoverImage,
                isVerified: false,
              },
            });
        break;
      }
      case 'legacy_service': {
        const existing = await prisma.serviceProvider.findFirst({ where: { userId: auth.id } });
        entity = existing
          ? await prisma.serviceProvider.update({
              where: { id: existing.id },
              data: {
                name,
                slug: safeSlug,
                phone,
                address,
                district,
                description,
                logo: logo === undefined ? undefined : safeLogo,
                coverImage: coverImage === undefined ? undefined : safeCoverImage,
              },
            })
          : await prisma.serviceProvider.create({
              data: {
                userId: auth.id,
                name,
                slug: safeSlug,
                phone,
                address,
                district,
                description,
                logo: safeLogo,
                coverImage: safeCoverImage,
                isVerified: false,
              },
            });
        break;
      }
      default:
        return errorJson('Буруу entityType: ' + entityType);
    }

    const username = safeSlug;
    const updatedUser = await prisma.user.update({
      where: { id: auth.id },
      data: { role: 'seller', entityType, username },
      include: {
        shops: {
          where: { slug: safeSlug },
          take: 1,
          select: { name: true, slug: true, logo: true, phone: true, address: true },
        },
        agent: { select: { name: true, slug: true, profilePhoto: true, phone: true, address: true } },
        company: { select: { name: true, slug: true, logo: true, phone: true, address: true } },
        autoDealer: { select: { name: true, slug: true, logo: true, phone: true, address: true } },
        serviceProvider: { select: { name: true, slug: true, logo: true, phone: true, address: true } },
      },
    });

    await prisma.sellerProfile.upsert({
      where: { userId: auth.id },
      create: {
        userId: auth.id,
        username,
        displayName: name,
        commissionRate: 10,
      },
      update: { displayName: name },
    });

    const token = signToken({
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      name: updatedUser.name,
      entityType: updatedUser.entityType,
    });
    const entityStore =
      updatedUser.shops[0] ||
      (updatedUser.agent
        ? {
            name: updatedUser.agent.name,
            slug: updatedUser.agent.slug,
            logo: updatedUser.agent.profilePhoto,
            phone: updatedUser.agent.phone,
            address: updatedUser.agent.address,
          }
        : null) ||
      updatedUser.company ||
      updatedUser.autoDealer ||
      updatedUser.serviceProvider ||
      updatedUser.store;

    const res = json({
      entity,
      token,
      user: {
        _id: updatedUser.id,
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        username,
        avatar: updatedUser.avatar,
        entityType: updatedUser.entityType,
        store: entityStore,
      },
      message: 'Амжилттай бүртгэгдлээ',
    }, 201);
    res.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return res;
  } catch (err: unknown) {
    const error = err as { code?: string; meta?: { target?: string }; message?: string };
    if (error.code === 'P2002') {
      const target = error.meta?.target || 'field';
      return errorJson(`Давхардсан утга: ${target}. Өөр нэр/slug ашиглана уу`);
    }
    console.error('Entity register error:', err);
    return errorJson('Бүртгэл амжилтгүй: ' + (error.message || 'Unknown error'));
  }
}
