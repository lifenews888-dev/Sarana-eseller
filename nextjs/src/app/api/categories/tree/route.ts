import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { categoryTreeFallback } from '@/lib/marketplaceCategories';

// GET /api/categories/tree — full category tree (public)
export async function GET(req: NextRequest) {
  const entityType = req.nextUrl.searchParams.get('entityType') || undefined;

  try {
    const categories = await prisma.category.findMany({
      where: {
        isApproved: true,
        isActive: true,
        level: 0,
        ...(entityType ? { entityTypes: { has: entityType } } : {}),
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

    if (categories.length > 0) {
      return NextResponse.json({ success: true, data: categories, source: 'db' });
    }
  } catch (error) {
    console.warn('[categories/tree] using fallback taxonomy', error);
  }

  return NextResponse.json({
    success: true,
    data: categoryTreeFallback(entityType),
    source: 'fallback',
  });
}
