import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeMarketplaceCategory } from '@/lib/marketplaceCategories';
import { filtersForCategory } from '@/lib/listingFilters';

// GET /api/feed/facets?category=vehicles — брэнд тус бүрийн идэвхтэй зарын тоо ("Toyota 124")
export async function GET(req: NextRequest) {
  const root = normalizeMarketplaceCategory(req.nextUrl.searchParams.get('category'));
  const facetDefs = filtersForCategory(root).filter((d) => d.kind === 'facet');
  if (facetDefs.length === 0) return NextResponse.json({ success: true, data: {} });

  try {
    const now = new Date();
    const data: Record<string, { value: string; count: number }[]> = {};
    for (const def of facetDefs) {
      const rows = (await prisma.feedItem.aggregateRaw({
        pipeline: [
          {
            $match: {
              status: 'active',
              category: root,
              [`metadata.${def.field}`]: { $type: 'string', $ne: '' },
              $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: { $date: now.toISOString() } } }],
            },
          },
          { $group: { _id: { $trim: { input: `$metadata.${def.field}` } }, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 40 },
        ],
      })) as unknown as Array<{ _id: string; count: number }>;
      data[def.key] = rows.filter((r) => r._id).map((r) => ({ value: r._id, count: r.count }));
    }
    return NextResponse.json(
      { success: true, data },
      { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' } },
    );
  } catch (e) {
    console.error('[feed facets]', e);
    return NextResponse.json({ success: true, data: {} });
  }
}
