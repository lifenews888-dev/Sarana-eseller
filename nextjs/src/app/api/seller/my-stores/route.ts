import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

type SellerStore = {
  id: string
  name: string
  slug: string
  entityType: 'store' | 'pre_order' | 'digital' | 'agent' | 'company' | 'auto_dealer' | 'service'
  storeType: 'product' | 'service' | 'hybrid'
  href: string
  logo?: string | null
  isVerified?: boolean
  createdAt?: string
}

function shopEntityType(industry?: string | null): SellerStore['entityType'] {
  if (industry === 'preorder') return 'pre_order'
  if (industry === 'digital') return 'digital'
  return 'store'
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const [shops, agent, company, autoDealer, serviceProvider] = await Promise.all([
      prisma.shop.findMany({
        where: { userId: auth.id, isBlocked: false },
        include: { shopType: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.agent.findUnique({ where: { userId: auth.id } }),
      prisma.company.findUnique({ where: { userId: auth.id } }),
      prisma.autoDealer.findUnique({ where: { userId: auth.id } }),
      prisma.serviceProvider.findUnique({ where: { userId: auth.id } }),
    ])

    const stores: SellerStore[] = shops.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.storefrontSlug || s.slug,
      entityType: shopEntityType(s.industry),
      storeType: (s.shopType?.type as SellerStore['storeType']) || (s.industry === 'service' ? 'service' : 'product'),
      href: `/s/${s.storefrontSlug || s.slug}`,
      logo: s.logo,
      isVerified: s.locationStatus === 'verified',
      createdAt: s.createdAt.toISOString(),
    }))

    if (agent) stores.push({
      id: agent.id,
      name: agent.name,
      slug: agent.slug,
      entityType: 'agent',
      storeType: 'product',
      href: `/entity/agent/${agent.slug}`,
      logo: agent.profilePhoto,
      isVerified: agent.isVerified,
      createdAt: agent.createdAt.toISOString(),
    })

    if (company) stores.push({
      id: company.id,
      name: company.name,
      slug: company.slug,
      entityType: 'company',
      storeType: 'product',
      href: `/entity/company/${company.slug}`,
      logo: company.logo,
      isVerified: company.isVerified,
      createdAt: company.createdAt.toISOString(),
    })

    if (autoDealer) stores.push({
      id: autoDealer.id,
      name: autoDealer.name,
      slug: autoDealer.slug,
      entityType: 'auto_dealer',
      storeType: 'product',
      href: `/entity/auto_dealer/${autoDealer.slug}`,
      logo: autoDealer.logo,
      isVerified: autoDealer.isVerified,
      createdAt: autoDealer.createdAt.toISOString(),
    })

    if (serviceProvider) stores.push({
      id: serviceProvider.id,
      name: serviceProvider.name,
      slug: serviceProvider.slug,
      entityType: 'service',
      storeType: 'service',
      href: `/entity/service/${serviceProvider.slug}`,
      logo: serviceProvider.logo,
      isVerified: serviceProvider.isVerified,
      createdAt: serviceProvider.createdAt.toISOString(),
    })

    stores.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))

    return NextResponse.json({
      stores,
      activeStoreId: stores[0]?.id || null,
      canCreateMoreStores: true,
    })
  } catch (error) {
    console.error('[seller/my-stores]', error)
    return NextResponse.json({ stores: [], activeStoreId: null, canCreateMoreStores: true })
  }
}
