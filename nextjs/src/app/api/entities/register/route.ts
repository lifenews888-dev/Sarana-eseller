import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireAuth, signToken } from '@/lib/api-auth';
import { isValidPublicImageUrl } from '@/lib/image-url';
import { ensureSlug, normalizeSlug } from '@/lib/slug';

function publicImageOrNull(value: unknown): string | null {
  return isValidPublicImageUrl(value) ? value : null;
}

function isUniqueConstraintError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /unique|E11000|duplicate key|userId_key|stores_userId/i.test(message);
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
  if (typeof phone === 'string' && phone.trim() && phone.replace(/\D/g, '').length < 8) {
    return errorJson('Утасны дугаар буруу байна (дор хаяж 8 орон)');
  }

  const safeSlug = ensureSlug(slug || name, `seller-${auth.id.slice(-8).toLowerCase()}`);
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
      return errorJson('Энэ slug аль хэдийн бүртгэлтэй байна. Өөр URL сонгоно уу.');
    }

    let entity;

    switch (entityType) {
      case 'store':
      case 'order_store':
      case 'digital':
      case 'pre_order': {
        const industryMap: Record<string, string> = {
          store: 'general',
          order_store: 'order',
          digital: 'digital',
          pre_order: 'preorder',
        };
        const industry = industryMap[entityType] || 'general';
        // Prefer same industry / same slug shop for this owner (multi-shop allowed).
        const existingShop = await prisma.shop.findFirst({
          where: {
            userId: auth.id,
            OR: [{ slug: safeSlug }, { storefrontSlug: safeSlug }, { industry }],
          },
          orderBy: { createdAt: 'asc' },
        });
        try {
          entity = existingShop
            ? await prisma.shop.update({
                where: { id: existingShop.id },
                data: {
                  name,
                  slug: safeSlug,
                  storefrontSlug: safeSlug,
                  logo: logo === undefined ? undefined : safeLogo,
                  phone: phone || undefined,
                  address: address || undefined,
                  district: district || undefined,
                  industry,
                  isDemo: false,
                },
              })
            : await prisma.shop.create({
                data: {
                  userId: auth.id,
                  name,
                  slug: safeSlug,
                  storefrontSlug: safeSlug,
                  logo: safeLogo,
                  phone,
                  address,
                  district,
                  industry,
                  locationStatus: 'pending',
                  isDemo: false,
                },
              });
        } catch (shopError) {
          if (isUniqueConstraintError(shopError)) {
            return errorJson(
              'Нэг хэрэглэгч олон дэлгүүр үүсгэх боломжгүй (DB index). Админ stores_userId_key-г салгах шаардлагатай.',
              409,
            );
          }
          throw shopError;
        }

        // Ensure shop type row for dashboard tools
        const shopTypeKey =
          entityType === 'digital' ? 'product' : entityType === 'pre_order' || entityType === 'order_store' ? 'product' : 'product';
        await prisma.shopType.upsert({
          where: { shopId: entity.id },
          create: { shopId: entity.id, type: shopTypeKey },
          update: { type: shopTypeKey },
        }).catch(() => null);
        break;
      }
      case 'agent':
      case 'real_estate': {
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
      case 'company':
      case 'construction': {
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
      case 'auto_dealer': {
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
      case 'service': {
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
    const matchedShop =
      updatedUser.shops.find((shop) => shop.slug === safeSlug) ||
      updatedUser.shops[updatedUser.shops.length - 1] ||
      null;
    const primaryShop = matchedShop
      ? {
          id: matchedShop.id,
          name: matchedShop.name,
          slug: matchedShop.slug,
          logo: matchedShop.logo,
          phone: matchedShop.phone,
          address: matchedShop.address,
        }
      : null;
    const entityStore =
      primaryShop ||
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
        shops: updatedUser.shops,
      },
      message: 'Амжилттай бүртгэгдлээ',
      next: '/dashboard/store',
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
