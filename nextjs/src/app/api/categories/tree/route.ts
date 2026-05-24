import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { categoryTreeFallback } from '@/lib/marketplaceCategories';

// GET /api/categories/tree — full category tree (public)
export async function GET() {
  // entityType is accepted for backward compatibility, but category browsing is
  // intentionally one unified marketplace flow across all seller/listing types.
  const fallback = categoryTreeFallback();

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
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    if (categories.length >= fallback.length) {
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
