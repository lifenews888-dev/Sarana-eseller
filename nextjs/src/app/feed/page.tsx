import FeedPageClient, { type EntityType, type FeedSortKey, type ItemTier } from './FeedPageClient';

type FeedSearchParams = Promise<Record<string, string | string[] | undefined>>;

const ENTITY_TYPES = new Set(['store', 'agent', 'company', 'auto_dealer', 'service', 'user']);
const DISTRICTS = new Set(['Бүгд', 'СБД', 'ХУД', 'БЗД', 'ЧД', 'БГД', 'СХД', 'НД', 'БНД']);
const SORT_KEYS = new Set<FeedSortKey>(['newest', 'price_asc', 'price_desc', 'popular']);
const ITEM_TIERS = new Set<ItemTier>(['vip', 'featured', 'discounted', 'normal']);

function readParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function normalizeEntityType(value: string): EntityType | '' {
  return ENTITY_TYPES.has(value) ? (value as EntityType) : '';
}

function normalizeDistrict(value: string): string {
  return DISTRICTS.has(value) ? value : 'Бүгд';
}

function normalizeSort(value: string): FeedSortKey {
  return SORT_KEYS.has(value as FeedSortKey) ? (value as FeedSortKey) : 'newest';
}

function normalizeTier(value: string): ItemTier | '' {
  return ITEM_TIERS.has(value as ItemTier) ? (value as ItemTier) : '';
}

export default async function FeedPage({ searchParams }: { searchParams: FeedSearchParams }) {
  const params = await searchParams;
  const initialCategory = readParam(params.category) || 'all';
  const initialEntityType = normalizeEntityType(readParam(params.entityType));
  const initialTier = normalizeTier(readParam(params.tier));
  const initialSearch = readParam(params.q).trim().slice(0, 120);
  const initialDistrict = normalizeDistrict(readParam(params.district));
  const initialProvince = readParam(params.province).trim().slice(0, 64);
  const initialSort = normalizeSort(readParam(params.sort));

  return (
    <FeedPageClient
      initialCategory={initialCategory}
      initialEntityType={initialEntityType}
      initialTier={initialTier}
      initialSearch={initialSearch}
      initialDistrict={initialDistrict}
      initialProvince={initialProvince}
      initialSort={initialSort}
    />
  );
}
