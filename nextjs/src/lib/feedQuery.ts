import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { buildMetadataMongoFilter } from '@/lib/listingFilters';
import { normalizeListingEntityType } from '@/lib/feedOwnership';
import { categoryDescendantValues, normalizeMarketplaceCategory } from '@/lib/marketplaceCategories';

function num(v: string | null): number | undefined {
  if (!v) return undefined;
  const n = Number(v.replace(/[,\s]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Зарын булангийн шүүлтүүрийг (category, search/q, district, province, entityType,
 * priceMin/priceMax эсвэл m_priceMin/m_priceMax, m_* metadata) Prisma where болгоно.
 * /api/feed болон хадгалсан хайлт хоёул үүнийг ашиглана — шүүлт нэг л газар.
 */
export async function buildFeedFilterWhere(sp: URLSearchParams, opts: { mine?: boolean } = {}): Promise<Prisma.FeedItemWhereInput> {
  const mine = Boolean(opts.mine);
  const category = sp.get('category');
  const search = sp.get('search') || sp.get('q');
  const district = sp.get('district');
  const province = sp.get('province');
  const entityType = normalizeListingEntityType(sp.get('entityType'));
  const priceMin = num(sp.get('priceMin')) ?? num(sp.get('m_priceMin'));
  const priceMax = num(sp.get('priceMax')) ?? num(sp.get('m_priceMax'));
  const and: Prisma.FeedItemWhereInput[] = [];

  const where: Prisma.FeedItemWhereInput = mine ? {} : { status: 'active' };
  if (category && category !== 'all') {
    const categoryRoot = normalizeMarketplaceCategory(category);
    const descendantValues = categoryDescendantValues(category);
    and.push(
      categoryRoot && categoryRoot !== 'all' && categoryRoot !== category
        ? { OR: [{ category }, { category: categoryRoot, subcategory: { in: descendantValues } }] }
        : { category },
    );
  }
  if (entityType && !mine) where.entityType = entityType;
  if (district && district !== 'Бүгд') where.district = district;
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
  // Нийтийн жагсаалтад хугацаа нь дууссан зарыг харуулахгүй
  if (!mine) {
    and.push({ OR: [{ expiresAt: null }, { expiresAt: { isSet: false } }, { expiresAt: { gt: new Date() } }] });
  }
  // Ангиллын нарийн шүүлтүүр (metadata.*) — Prisma MongoDB JSON шүүлт дэмждэггүй тул findRaw
  const metaFilter = category ? buildMetadataMongoFilter(normalizeMarketplaceCategory(category), sp) : null;
  if (metaFilter) {
    const rows = (await prisma.feedItem.findRaw({
      filter: { status: 'active', ...metaFilter },
      options: { projection: { _id: 1 }, limit: 3000 },
    })) as unknown as Array<{ _id: { $oid: string } | string }>;
    and.push({ id: { in: rows.map((r) => (typeof r._id === 'string' ? r._id : r._id.$oid)) } });
  }
  if (and.length) where.AND = and;
  return where;
}
