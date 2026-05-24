import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { categoryTreeFallback, flattenCategoryTree } from '@/lib/marketplaceCategories';

type CategoryTreeLike = {
  children?: CategoryTreeLike[];
};

function maxTreeDepth(nodes: CategoryTreeLike[], level = 0): number {
  if (nodes.length === 0) return level;
  return Math.max(
    ...nodes.map((node) =>
      (node.children || []).length > 0
        ? maxTreeDepth(node.children || [], level + 1)
        : level
    )
  );
}

function flattenTree(nodes: CategoryTreeLike[]): CategoryTreeLike[] {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children || [])]);
}

function hasCompleteMarketplaceDepth(categories: CategoryTreeLike[], fallback: CategoryTreeLike[]): boolean {
  return categories.length >= fallback.length
    && flattenTree(categories).length >= flattenTree(fallback).length
    && maxTreeDepth(categories) >= maxTreeDepth(fallback);
}

// GET /api/categories/tree — full category tree (public)
export async function GET() {
  // entityType is accepted for backward compatibility, but category browsing is
  // intentionally one unified marketplace flow across all seller/listing types.
  const fallback = categoryTreeFallback();
  const fallbackFlat = flattenCategoryTree(fallback);

  try {
    const categories = await prisma.category.findMany({
      where: {
        isApproved: true,
        isActive: true,
        level: 0,
      },
      include: {
        children: {
          where: { isApproved: true, isActive: true },
          include: {
            children: {
              where: { isApproved: true, isActive: true },
              include: {
                children: {
                  where: { isApproved: true, isActive: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    if (
      categories.length >= fallback.length
      && flattenTree(categories).length >= fallbackFlat.length
      && hasCompleteMarketplaceDepth(categories, fallback)
    ) {
      return NextResponse.json({ success: true, data: categories, source: 'db' });
    }
  } catch (error) {
    console.warn('[categories/tree] using fallback taxonomy', error);
  }

  return NextResponse.json({
    success: true,
    data: fallback,
    source: 'fallback',
  });
}
