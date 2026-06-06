export const STORE_DIRECTORY_TYPES = ['all', 'store', 'service', 'agent', 'company', 'auto_dealer'] as const;
export type StoreDirectoryType = (typeof STORE_DIRECTORY_TYPES)[number];

export const STORE_DIRECTORY_SORTS = ['featured', 'rating', 'newest', 'name'] as const;
export type StoreDirectorySort = (typeof STORE_DIRECTORY_SORTS)[number];

export type StoreDirectoryFacet = {
  value: string;
  label: string;
  count: number;
};

export type StoreDirectoryFacets = {
  types: Record<StoreDirectoryType, number>;
  districts: StoreDirectoryFacet[];
  categories: StoreDirectoryFacet[];
};

export type StoreDirectoryItem = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  href: string;
  logo?: string | null;
  coverImage?: string | null;
  previewImages?: string[];
  description?: string | null;
  category?: string | null;
  address?: string | null;
  district?: string | null;
  phone?: string | null;
  entityType: Exclude<StoreDirectoryType, 'all'>;
  directoryType: Exclude<StoreDirectoryType, 'all'>;
  storeType?: string | null;
  isVerified: boolean;
  rating?: number | null;
  reviewCount?: number | null;
  productCount: number;
  serviceCount: number;
  listingCount: number;
  createdAt: string;
  keywords: string[];
};

export const STORE_DIRECTORY_TYPE_LABELS: Record<StoreDirectoryType, string> = {
  all: 'Бүгд',
  store: 'Дэлгүүр',
  service: 'Үйлчилгээ',
  agent: 'Агент',
  company: 'Компани',
  auto_dealer: 'Авто',
};

export const STORE_DIRECTORY_SORT_LABELS: Record<StoreDirectorySort, string> = {
  featured: 'Онцлох',
  rating: 'Үнэлгээ',
  newest: 'Шинэ',
  name: 'Нэр',
};

export function isStoreDirectoryType(value: string | null): value is StoreDirectoryType {
  return STORE_DIRECTORY_TYPES.includes(value as StoreDirectoryType);
}

export function isStoreDirectorySort(value: string | null): value is StoreDirectorySort {
  return STORE_DIRECTORY_SORTS.includes(value as StoreDirectorySort);
}

export function normalizeFacetValue(value?: string | null) {
  return (value || '').trim().toLowerCase();
}
