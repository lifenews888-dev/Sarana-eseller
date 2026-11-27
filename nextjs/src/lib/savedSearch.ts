import { prisma } from '@/lib/prisma';
import { buildFeedFilterWhere } from '@/lib/feedQuery';
import { categoryLabel } from '@/lib/marketplaceCategories';

// Хайлтад хамаарах параметрүүд (эрэмбэ, хуудас, tier зэргийг хадгалахгүй)
const KEEP = new Set(['category', 'q', 'search', 'district', 'province', 'entityType', 'priceMin', 'priceMax']);

export function normalizeSavedQuery(raw: string): string {
  const src = new URLSearchParams(raw.startsWith('?') ? raw.slice(1) : raw);
  const out = new URLSearchParams();
  src.forEach((v, k) => {
    const val = v.trim().slice(0, 80);
    if (!val || val === 'all' || val === 'Бүгд') return;
    if (KEEP.has(k) || k.startsWith('m_')) out.set(k === 'search' ? 'q' : k, val);
  });
  out.sort();
  return out.toString();
}

export function describeSavedQuery(query: string): string {
  const sp = new URLSearchParams(query);
  const parts: string[] = [];
  const cat = sp.get('category');
  if (cat) parts.push(categoryLabel(cat) || cat);
  if (sp.get('q')) parts.push(`"${sp.get('q')}"`);
  sp.forEach((v, k) => {
    if (k === 'm_priceMin') parts.push(`${Number(v).toLocaleString('en-US')}₮-с дээш`);
    else if (k === 'm_priceMax') parts.push(`${Number(v).toLocaleString('en-US')}₮ хүртэл`);
    else if (k.startsWith('m_')) parts.push(v);
  });
  if (sp.get('district')) parts.push(sp.get('district')!);
  return parts.join(' · ') || 'Бүх зар';
}

/** lastSeenAt-аас хойш нэмэгдсэн, хайлтад тохирох зарын тоо */
export async function countNewForSearch(query: string, since: Date): Promise<number> {
  const where = await buildFeedFilterWhere(new URLSearchParams(query));
  return prisma.feedItem.count({ where: { AND: [where, { createdAt: { gt: since } }] } });
}

export async function countNewForUser(userId: string): Promise<{ total: number; byId: Record<string, number> }> {
  const searches = await prisma.savedSearch.findMany({ where: { userId }, take: 20 });
  const counts = await Promise.all(searches.map((s) => countNewForSearch(s.query, s.lastSeenAt).catch(() => 0)));
  const byId: Record<string, number> = {};
  searches.forEach((s, i) => { byId[s.id] = counts[i]; });
  return { total: counts.reduce((a, b) => a + b, 0), byId };
}
