import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  const auth = requireAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const shops = await prisma.shop.findMany({
      where: { userId: auth.id, isBlocked: false },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    })

    const stores = shops.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
    }))

    return NextResponse.json({ stores })
  } catch {
    return NextResponse.json({ stores: [] })
  }
}
