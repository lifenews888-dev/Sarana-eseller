import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, getPreferredShopId } from '@/lib/api-auth'
import { getOwnerShopAllowance } from '@/lib/subscription-server'
import { PLANS } from '@/lib/subscription'

const INDUSTRY_TYPE: Record<string, string> = {
  general: 'store',
  order: 'order_store',
  digital: 'digital',
  preorder: 'pre_order',
}

// GET /api/seller/my-stores — эзэмшигчийн бүх дэлгүүр + идэвхтэй дэлгүүр + нэмэлт дэлгүүрийн эрх
export async function GET(req: NextRequest) {
  const auth = requireAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const [shops, allowance] = await Promise.all([
      prisma.shop.findMany({
        where: { userId: auth.id, isBlocked: false },
        select: {
          id: true,
          name: true,
          slug: true,
          storefrontSlug: true,
          logo: true,
          industry: true,
          createdAt: true,
          subscription: { select: { planKey: true, status: true, expiresAt: true } },
        },
        take: 50,
        orderBy: { createdAt: 'asc' },
      }),
      getOwnerShopAllowance(auth.id),
    ])

    const preferred = getPreferredShopId(req)
    const activeId = shops.find((s) => s.id === preferred)?.id || shops[0]?.id || null
    const now = new Date()

    const stores = shops.map((s) => {
      const sub = s.subscription
      const paidActive = !!sub && sub.status === 'active' && (!sub.expiresAt || new Date(sub.expiresAt) > now)
      const planKey = paidActive ? sub!.planKey : 'free'
      return {
        id: s.id,
        name: s.name,
        slug: s.storefrontSlug || s.slug,
        logo: s.logo,
        industry: s.industry,
        entityType: INDUSTRY_TYPE[s.industry || 'general'] || 'store',
        planKey,
        planName: PLANS[planKey]?.name ?? planKey,
        active: s.id === activeId,
      }
    })

    return NextResponse.json({ stores, activeShopId: activeId, allowance })
  } catch {
    return NextResponse.json({ stores: [], activeShopId: null, allowance: null })
  }
}
