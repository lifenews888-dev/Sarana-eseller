import type { Prisma } from '@prisma/client';
import { isValidPublicImageUrl } from '@/lib/image-url';

const BLOCKED_PUBLIC_PRODUCT_NAME_PATTERNS = [
  'e2e',
  'test',
  'тест',
  'Ñ‚ÐµÑÑ‚',
  'dummy',
  'placeholder',
  'sample',
  'demo',
  'asdf',
  'qwer',
];

const BLOCKED_PUBLIC_PRODUCT_EXACT_NAMES = [
  'h',
  'hh',
  'hhh',
  'aaa',
  'abc',
  'xxx',
  '123',
];

export const PUBLIC_PRODUCT_MIN_PRICE = 1000;

/**
 * Mongo quirk: older product docs omitted `isDemo`. Prisma schema default makes
 * reads look like `false`, but queries only match explicit `false` until docs
 * are backfilled (`scripts/fix-marketplace-surfaces.ts`). After backfill,
 * `isDemo: false` is the reliable public filter.
 *
 * Name/placeholder junk is filtered in JS via `isPublicLaunchProduct` —
 * large `NOT: [{ OR: contains...}]` trees under-match on Mongo and hide
 * almost the entire catalog.
 */
const publicProductBaseWhere: Prisma.ProductWhereInput = {
  isActive: true,
  isDemo: false,
  price: { gte: PUBLIC_PRODUCT_MIN_PRICE },
};

/** True when salePrice is set above list price (broken "SALE" badge). */
export function hasInvertedSalePrice(product: PublicProductInput): boolean {
  const price = typeof product.price === 'number' && Number.isFinite(product.price) ? product.price : null;
  const salePrice =
    typeof product.salePrice === 'number' && Number.isFinite(product.salePrice) ? product.salePrice : null;
  return price !== null && salePrice !== null && salePrice > 0 && salePrice > price;
}

/**
 * Normalize inverted sale prices for public display:
 * if sale > price, treat sale as the list price and clear the discount.
 */
export function normalizePublicPricing<T extends PublicProductInput>(product: T): T {
  if (!hasInvertedSalePrice(product)) return product;
  return {
    ...product,
    price: product.salePrice as number,
    salePrice: null,
  };
}

export function publicProductWhere(...clauses: Prisma.ProductWhereInput[]): Prisma.ProductWhereInput {
  return {
    AND: [
      publicProductBaseWhere,
      ...clauses.filter((clause) => Object.keys(clause).length > 0),
    ],
  };
}

export type PublicProductInput = {
  name?: string | null;
  description?: string | null;
  price?: number | null;
  salePrice?: number | null;
  images?: unknown;
  isActive?: boolean | null;
  isDemo?: boolean | null;
};

type PublicProductPageOptions<T extends PublicProductInput> = {
  page: number;
  limit: number;
  fetchBatch: (params: { skip: number; take: number }) => Promise<T[]>;
  scanBatchSize?: number;
  scanMaxRows?: number;
};

export type PublicProductPage<T extends PublicProductInput> = {
  products: T[];
  total: number;
  page: number;
  pages: number;
  hasMore: boolean;
  scanned: number;
  reachedEnd: boolean;
};

const PUBLIC_PRODUCT_SCAN_BATCH_SIZE = 100;
export const PUBLIC_PRODUCT_SCAN_MAX_ROWS = 2000;

export function getPublicProductEffectivePrice(product: PublicProductInput): number | null {
  const price = typeof product.price === 'number' && Number.isFinite(product.price)
    ? product.price
    : null;
  const salePrice = typeof product.salePrice === 'number' && Number.isFinite(product.salePrice)
    ? product.salePrice
    : null;

  if (salePrice !== null && salePrice > 0 && price !== null && salePrice < price) {
    return salePrice;
  }

  return price;
}

export function hasPublicProductImage(product: PublicProductInput): boolean {
  return Array.isArray(product.images) && product.images.some(isValidPublicImageUrl);
}

export function hasBlockedPublicProductName(product: PublicProductInput): boolean {
  const name = (product.name || '').trim().toLowerCase();
  const searchable = `${product.name || ''} ${product.description || ''}`.toLowerCase();

  if (!name) return true;
  if (BLOCKED_PUBLIC_PRODUCT_EXACT_NAMES.includes(name)) return true;
  return BLOCKED_PUBLIC_PRODUCT_NAME_PATTERNS.some((pattern) => searchable.includes(pattern));
}

export function getPublicProductQualityIssue(product: PublicProductInput): string | null {
  if (product.isActive === false) return 'inactive product';
  if (product.isDemo === true) return 'demo product';
  if (hasBlockedPublicProductName(product)) return 'placeholder product name';

  // Inverted sale is data corruption, not a hide reason — normalizePublicPricing
  // repairs it for display. Effective price still uses list price when inverted.
  const effectivePrice = getPublicProductEffectivePrice(product);
  if (effectivePrice === null || effectivePrice < PUBLIC_PRODUCT_MIN_PRICE) {
    return `public product price below ${PUBLIC_PRODUCT_MIN_PRICE} MNT`;
  }

  if (!hasPublicProductImage(product)) return 'missing public product image';
  return null;
}

export function isPublicLaunchProduct(product: PublicProductInput) {
  return getPublicProductQualityIssue(product) === null;
}

export function filterPublicLaunchProducts<T extends PublicProductInput>(products: T[]): T[] {
  return products.filter(isPublicLaunchProduct).map(normalizePublicPricing);
}

/** Validate salePrice on write paths. Returns error message or null. */
export function getSalePriceWriteError(price: unknown, salePrice: unknown): string | null {
  if (salePrice === null || salePrice === undefined || salePrice === '' || salePrice === 0) {
    return null;
  }
  const p = Number(price);
  const s = Number(salePrice);
  if (!Number.isFinite(p) || p < 0) return 'price must be a non-negative number';
  if (!Number.isFinite(s) || s < 0) return 'salePrice must be a non-negative number';
  if (s > 0 && s >= p) return 'salePrice must be lower than price';
  if (s > 0 && s < PUBLIC_PRODUCT_MIN_PRICE) {
    return `salePrice must be at least ${PUBLIC_PRODUCT_MIN_PRICE} MNT`;
  }
  return null;
}

export async function fetchPublicLaunchProductPage<T extends PublicProductInput>({
  page,
  limit,
  fetchBatch,
  scanBatchSize = PUBLIC_PRODUCT_SCAN_BATCH_SIZE,
  scanMaxRows = PUBLIC_PRODUCT_SCAN_MAX_ROWS,
}: PublicProductPageOptions<T>): Promise<PublicProductPage<T>> {
  const visibleProducts: T[] = [];
  const batchSize = Math.max(1, scanBatchSize);
  const maxRows = Math.max(batchSize, scanMaxRows);
  let scanned = 0;
  let reachedEnd = false;

  while (scanned < maxRows) {
    const take = Math.min(batchSize, maxRows - scanned);
    const batch = await fetchBatch({ skip: scanned, take });

    if (batch.length === 0) {
      reachedEnd = true;
      break;
    }

    scanned += batch.length;
    visibleProducts.push(...filterPublicLaunchProducts(batch));

    if (batch.length < take) {
      reachedEnd = true;
      break;
    }
  }

  const start = (page - 1) * limit;
  const total = visibleProducts.length;

  return {
    products: visibleProducts.slice(start, start + limit),
    total,
    page,
    pages: Math.ceil(total / limit),
    hasMore: start + limit < total || !reachedEnd,
    scanned,
    reachedEnd,
  };
}
