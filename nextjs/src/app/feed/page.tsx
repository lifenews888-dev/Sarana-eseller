import FeedPageClient, { type EntityType } from './FeedPageClient';

type FeedSearchParams = Promise<Record<string, string | string[] | undefined>>;

const ENTITY_TYPES = new Set(['store', 'agent', 'company', 'auto_dealer', 'service', 'user']);

function readParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function normalizeEntityType(value: string): EntityType | '' {
  return ENTITY_TYPES.has(value) ? (value as EntityType) : '';
}

export default async function FeedPage({ searchParams }: { searchParams: FeedSearchParams }) {
  const params = await searchParams;
  const initialCategory = readParam(params.category) || 'all';
  const initialEntityType = normalizeEntityType(readParam(params.entityType));

  return (
    <FeedPageClient
      initialCategory={initialCategory}
      initialEntityType={initialEntityType}
    />
  );
}
