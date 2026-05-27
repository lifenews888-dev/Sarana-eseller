import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json } from '@/lib/api-auth';
import { DEMO_FEED } from '@/lib/types/entity';

import { requireAuth, errorJson } from '@/lib/api-auth';
import { sanitizeImageUrls } from '@/lib/image-url';

// GET /api/feed?category=agent&tier=vip&page=1&limit=20&sort=newest&search=...&district=...&priceMin=...&priceMax=...
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
  const priceMin = sp.get('priceMin') ? Number(sp.get('priceMin')) : undefined;
  const priceMax = sp.get('priceMax') ? Number(sp.get('priceMax')) : undefined;

  try {
    // Build where clause
    const where: Record<string, unknown> = { status: 'active' };
    if (category) where.category = category;
    if (tier && tier !== 'all') where.tier = tier;
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
      if (priceMin !== undefined) (where.price as Record<string, number>).gte = priceMin;
      if (priceMax !== undefined) (where.price as Record<string, number>).lte = priceMax;
    }

    // Fetch by tier groups
    const [vip, featured, discounted, normalItems, total] = await Promise.all([
      prisma.feedItem.findMany({ where: { ...where, tier: 'vip' }, orderBy: { createdAt: 'desc' }, take: 6 }),
      prisma.feedItem.findMany({ where: { ...where, tier: 'featured' }, orderBy: { createdAt: 'desc' }, take: 12 }),
      prisma.feedItem.findMany({ where: { ...where, tier: 'discounted' }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.feedItem.findMany({
        where: { ...where, tier: 'normal' },
        orderBy: sort === 'price_asc' ? { price: 'asc' } : sort === 'price_desc' ? { price: 'desc' } : { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.feedItem.count({ where: { ...where, tier: 'normal' } }),
    ]);

    return json({
      vip, featured, discounted, normal: normalItems,
      meta: { total, page, hasMore: page * limit < total },
    });
  } catch {
    // DB not available — use demo data
    let items = [...DEMO_FEED];
    if (category) items = items.filter((i) => i.category === category);
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

// POST /api/feed — create new listing (FeedItem)
export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  try {
    const body = await req.json();
    const { title, description, price, originalPrice, images, category, subcategory, entityType, district, province, lat, lng, metadata, tier } = body;

    if (!title || !entityType) return errorJson('title, entityType шаардлагатай');

    // Generate refId
    const prefixMap: Record<string, string> = { agent: 'AGT', auto_dealer: 'AUT', company: 'COM', service: 'SRV', store: 'STR', user: 'USR' };
    const prefix = prefixMap[entityType] || 'USR';
    const refId = `${prefix}-${Date.now().toString(36).toUpperCase()}`;

    // Find entity ID based on user
    let entityId = user.id;
    if (entityType === 'agent') {
      const agent = await prisma.agent.findUnique({ where: { userId: user.id } });
      if (agent) entityId = agent.id;
    } else if (entityType === 'company') {
      const company = await prisma.company.findUnique({ where: { userId: user.id } });
      if (company) entityId = company.id;
    } else if (entityType === 'auto_dealer') {
      const dealer = await prisma.autoDealer.findUnique({ where: { userId: user.id } });
      if (dealer) entityId = dealer.id;
    } else if (entityType === 'service') {
      const provider = await prisma.serviceProvider.findUnique({ where: { userId: user.id } });
      if (provider) entityId = provider.id;
    }

    const item = await prisma.feedItem.create({
      data: {
        refId,
        title,
        description: description || null,
        price: price ? Number(price) : null,
        originalPrice: originalPrice ? Number(originalPrice) : null,
        images: sanitizeImageUrls(images),
        category: category || null,
        subcategory: subcategory || null,
        entityType,
        entityId,
        tier: tier || 'normal',
        status: 'active',
        district: district || null,
        province: province || null,
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
        metadata: metadata || {},
        ...(entityType === 'agent' ? { agentId: entityId } : {}),
        ...(entityType === 'company' ? { companyId: entityId } : {}),
        ...(entityType === 'auto_dealer' ? { autoDealerId: entityId } : {}),
        ...(entityType === 'service' ? { serviceProviderId: entityId } : {}),
      },
    });

    return json(item, 201);
  } catch (err: any) {
    if (err.code === 'P2002') return errorJson('Энэ зар аль хэдийн бүртгэлтэй');
    return errorJson('Зар нэмэхэд алдаа: ' + (err.message || ''));
  }
}
