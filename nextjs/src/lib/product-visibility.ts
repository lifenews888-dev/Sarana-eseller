import type { Prisma } from '@prisma/client';

const BLOCKED_PUBLIC_PRODUCT_NAME_PATTERNS = [
  'e2e',
  'test',
  'тест',
  'dummy',
  'placeholder',
];

export const PUBLIC_PRODUCT_MIN_PRICE = 1;

const publicProductBaseWhere: Prisma.ProductWhereInput = {
  isActive: true,
  isDemo: false,
  price: { gt: PUBLIC_PRODUCT_MIN_PRICE },
  NOT: BLOCKED_PUBLIC_PRODUCT_NAME_PATTERNS.map((pattern) => ({
    name: { contains: pattern, mode: 'insensitive' },
  })),
};

export function publicProductWhere(...clauses: Prisma.ProductWhereInput[]): Prisma.ProductWhereInput {
  return {
    AND: [
      publicProductBaseWhere,
      ...clauses.filter((clause) => Object.keys(clause).length > 0),
    ],
  };
}

export function isPublicLaunchProduct(product: {
  name?: string | null;
  description?: string | null;
  price?: number | null;
  isActive?: boolean | null;
  isDemo?: boolean | null;
}) {
  if (!product.isActive || product.isDemo) return false;
  if (typeof product.price !== 'number' || product.price <= PUBLIC_PRODUCT_MIN_PRICE) return false;

  const searchable = `${product.name || ''} ${product.description || ''}`.toLowerCase();
  return !BLOCKED_PUBLIC_PRODUCT_NAME_PATTERNS.some((pattern) => searchable.includes(pattern));
}
