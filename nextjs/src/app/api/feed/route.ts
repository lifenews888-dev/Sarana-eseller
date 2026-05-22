import { NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { json, requireAuth, errorJson } from '@/lib/api-auth';
import { DEMO_FEED } from '@/lib/types/entity';
import { buildOwnedFeedWhere, normalizeListingEntityType } from '@/lib/feedOwnership';

const mediaInclude = { media: { orderBy: { sortOrder: 'asc' as const } } };

// GET /api/feed?category=agent&tier=vip&page=1&limit=20&sort=newest&search=...&mine=1&entityType=auto_dealer
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const category = sp.get('category');
  const tier = sp.get('tier');
  const page = Math.max(1, Number(sp.get('page') || '1'));
  const limit = Math.min(50, Number(sp.get('limit') || '20'));
  const sort = sp.get('sort') || 'newest';
  const search = sp.get('search');
  const district = sp.get('district');
  const province = sp.get('province');
  const entityType = normalizeListingEntityType(sp.get('entityType'));
  const mine = ['1', 'true', 'yes'].includes((sp.get('mine') || '').toLowerCase());
  const priceMin = sp.get('priceMin') ? Number(sp.get('priceMin')) : undefined;
  const priceMax = sp.get('priceMax') ? Number(sp.get('priceMax')) : undefined;

  let ownedWhere: Prisma.FeedItemWhereInput | null = null;
  if (mine) {
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;
    ownedWhere = await buildOwnedFeedWhere(auth.id, entityType);
  }

  try {
    const where: Prisma.FeedItemWhereInput = mine ? {} : { status: 'active' };
    if (category) where.category = category;
    if (tier && tier !== 'all') where.tier = tier;
    if (entityType && !mine) where.entityType = entityType;
    if (district) where.district = district;
    if (province) where.province = province;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = {};
      if (priceMin !== undefined) where.price.gte = priceMin;
      if (priceMax !== undefined) where.price.lte = priceMax;
    }
    if (ownedWhere) {
      where.AND = [...(Array.isArray(where.AND) ? where.AND : []), ownedWhere];
    }

    const normalOrder =
      sort === 'price_asc'
        ? { price: 'asc' as const }
        : sort === 'price_desc'
          ? { price: 'desc' as const }
          : { createdAt: 'desc' as const };

    const [vip, featured, discounted, normalItems, total] = await Promise.all([
      prisma.feedItem.findMany({ where: { ...where, tier: 'vip' }, orderBy: { createdAt: 'desc' }, take: mine ? limit : 6, include: mediaInclude }),
      prisma.feedItem.findMany({ where: { ...where, tier: 'featured' }, orderBy: { createdAt: 'desc' }, take: mine ? limit : 12, include: mediaInclude }),
      prisma.feedItem.findMany({ where: { ...where, tier: 'discounted' }, orderBy: { createdAt: 'desc' }, take: mine ? limit : 10, include: mediaInclude }),
      prisma.feedItem.findMany({
        where: { ...where, tier: 'normal' },
        orderBy: normalOrder,
        skip: (page - 1) * limit,
        take: limit,
        include: mediaInclude,
      }),
      prisma.feedItem.count({ where: { ...where, tier: 'normal' } }),
    ]);

    return json({
      vip,
      featured,
      discounted,
      normal: normalItems,
      meta: { total, page, hasMore: page * limit < total },
    });
  } catch {
    if (mine) {
      return json({
        vip: [],
        featured: [],
        discounted: [],
        normal: [],
        meta: { total: 0, page: 1, hasMore: false },
      });
    }

    let items = [...DEMO_FEED];
    if (category) items = items.filter((i) => i.category === category);
    if (entityType) items = items.filter((i) => normalizeListingEntityType(i.entityType) === entityType);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((i) => i.title.toLowerCase().includes(q));
    }

    return json({
      vip: items.filter((i) => i.tier === 'vip'),
      featured: items.filter((i) => i.tier === 'featured'),
      discounted: items.filter((i) => i.tier === 'discounted'),
      normal: items.filter((i) => i.tier === 'normal'),
      meta: { total: items.length, page: 1, hasMore: false },
    });
  }
}

// POST /api/feed - create a read/write public listing owned by the current seller entity.
export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  try {
    const body = await req.json();
    const {
      title,
      description,
      price,
      originalPrice,
      images,
      category,
      subcategory,
      entityType,
      district,
      province,
      lat,
      lng,
      metadata,
      tier,
      videoUrl,
      virtualTourUrl,
      floorPlanUrl,
    } = body;

    const normalizedEntityType = normalizeListingEntityType(entityType) || 'store';
    if (!title || !normalizedEntityType) return errorJson('title, entityType шаардлагатай');

    const prefixMap: Record<string, string> = {
      agent: 'AGT',
      auto_dealer: 'AUT',
      company: 'COM',
      service: 'SRV',
      store: 'STR',
      pre_order: 'PRE',
      digital: 'DIG',
      user: 'USR',
    };
    const prefix = prefixMap[normalizedEntityType] || 'USR';
    const refId = `${prefix}-${Date.now().toString(36).toUpperCase()}`;

    let entityId = user.id;
    if (normalizedEntityType === 'agent') {
      const agent = await prisma.agent.findUnique({ where: { userId: user.id }, select: { id: true } });
      if (!agent) return errorJson('Үл хөдлөхийн агент бүртгэл олдсонгүй', 404);
      entityId = agent.id;
    } else if (normalizedEntityType === 'company') {
      const company = await prisma.company.findUnique({ where: { userId: user.id }, select: { id: true } });
      if (!company) return errorJson('Компанийн бүртгэл олдсонгүй', 404);
      entityId = company.id;
    } else if (normalizedEntityType === 'auto_dealer') {
      const dealer = await prisma.autoDealer.findUnique({ where: { userId: user.id }, select: { id: true } });
      if (!dealer) return errorJson('Авто дилерийн бүртгэл олдсонгүй', 404);
      entityId = dealer.id;
    } else if (normalizedEntityType === 'service') {
      const provider = await prisma.serviceProvider.findUnique({ where: { userId: user.id }, select: { id: true } });
      if (!provider) return errorJson('Үйлчилгээний бүртгэл олдсонгүй', 404);
      entityId = provider.id;
    }

    const imageUrls = Array.isArray(images) ? images.filter((url) => typeof url === 'string' && url.trim()) : [];
    const item = await prisma.feedItem.create({
      data: {
        refId,
        title,
        description: description || null,
        price: price ? Number(price) : null,
        originalPrice: originalPrice ? Number(originalPrice) : null,
        images: imageUrls,
        category: category || null,
        subcategory: subcategory || null,
        entityType: normalizedEntityType,
        entityId,
        tier: tier || 'normal',
        status: 'active',
        district: district || null,
        province: province || null,
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
        metadata: metadata || {},
        ...(normalizedEntityType === 'agent' ? { agentId: entityId } : {}),
        ...(normalizedEntityType === 'company' ? { companyId: entityId } : {}),
        ...(normalizedEntityType === 'auto_dealer' ? { autoDealerId: entityId } : {}),
        ...(normalizedEntityType === 'service' ? { serviceProviderId: entityId } : {}),
      },
    });

    const mediaRows = [
      ...imageUrls.map((url, sortOrder) => ({ feedItemId: item.id, type: 'IMAGE', url, sortOrder })),
      ...(videoUrl ? [{ feedItemId: item.id, type: 'VIDEO', url: String(videoUrl), sortOrder: imageUrls.length }] : []),
      ...(virtualTourUrl ? [{ feedItemId: item.id, type: 'VIRTUAL_TOUR', url: String(virtualTourUrl), sortOrder: imageUrls.length + 1 }] : []),
      ...(floorPlanUrl ? [{ feedItemId: item.id, type: 'FLOOR_PLAN', url: String(floorPlanUrl), sortOrder: imageUrls.length + 2 }] : []),
    ].filter((row) => row.url.trim());

    if (mediaRows.length > 0) {
      await prisma.entityMedia.createMany({ data: mediaRows });
    }

    const itemWithMedia = await prisma.feedItem.findUnique({
      where: { id: item.id },
      include: mediaInclude,
    });

    return json(itemWithMedia || item, 201);
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === 'P2002') return errorJson('Энэ зар аль хэдийн бүртгэлтэй');
    return errorJson('Зар нэмэхэд алдаа: ' + (error.message || ''));
  }
}
