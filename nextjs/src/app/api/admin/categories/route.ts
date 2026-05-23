import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { categoryTreeFallback, flattenCategoryTree } from '@/lib/marketplaceCategories'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }],
    })

    // Build tree
    const map = new Map<string, typeof categories[0] & { children: typeof categories }>()
    const roots: (typeof categories[0] & { children: typeof categories })[] = []

    for (const cat of categories) {
      map.set(cat.id, { ...cat, children: [] })
    }

    for (const cat of categories) {
      const node = map.get(cat.id)!
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children.push(node)
      } else {
        roots.push(node)
      }
    }

    const stats = {
      total: categories.length,
      roots: categories.filter((c) => c.level === 0).length,
      subs: categories.filter((c) => c.level === 1).length,
      leafs: categories.filter((c) => c.level === 2).length,
      featured: categories.filter((c) => c.isFeatured).length,
    }

    return NextResponse.json({ categories: roots, flat: categories, stats, source: 'db' })
  } catch (error) {
    console.warn('[admin/categories] using fallback taxonomy', error)
    const categories = categoryTreeFallback()
    const flat = flattenCategoryTree(categories)
    const stats = {
      total: flat.length,
      roots: flat.filter((c) => c.level === 0).length,
      subs: flat.filter((c) => c.level === 1).length,
      leafs: flat.filter((c) => c.level >= 2).length,
      featured: flat.filter((c) => c.isFeatured).length,
    }
    return NextResponse.json({ categories, flat, stats, source: 'fallback' })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const category = await prisma.category.create({
    data: {
      slug: body.slug,
      name: body.name,
      nameEn: body.nameEn,
      icon: body.icon,
      parentId: body.parentId || null,
      level: body.level || 0,
      sortOrder: body.sortOrder || 0,
      entityTypes: body.entityTypes || [],
      isFeatured: body.isFeatured || false,
      isApproved: body.isApproved ?? true,
      createdBy: body.createdBy,
    },
  })

  return NextResponse.json(category, { status: 201 })
}
