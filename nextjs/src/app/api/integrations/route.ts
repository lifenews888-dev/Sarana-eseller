import { NextRequest, NextResponse } from 'next/server'
import { getShopForRequest, requireSeller } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// GET — интеграцийн мэдээлэл авах
export async function GET(req: NextRequest) {
  const auth = requireSeller(req)
  if (auth instanceof NextResponse) return auth

  const shopId = await getShopForRequest(req, auth.id)
  const shop = shopId ? await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      integration: {
        include: { importedUrls: { take: 10, orderBy: { createdAt: 'desc' } } },
      },
    },
  }) : null
  if (!shop) return NextResponse.json({ error: 'Дэлгүүр олдсонгүй' }, { status: 404 })

  if (!shop.integration) {
    const integration = await prisma.storeIntegration.create({
      data: {
        shopId:    shop.id,
        apiKey:    crypto.randomUUID(),
        apiSecret: crypto.randomBytes(32).toString('hex'),
      },
    })
    return NextResponse.json({ integration })
  }

  return NextResponse.json({ integration: shop.integration })
}

// POST — API key шинэчлэх (regenerate)
export async function POST(req: NextRequest) {
  const auth = requireSeller(req)
  if (auth instanceof NextResponse) return auth

  const shopId = await getShopForRequest(req, auth.id)
  const shop = shopId ? await prisma.shop.findUnique({ where: { id: shopId } }) : null
  if (!shop) return NextResponse.json({ error: 'Дэлгүүр олдсонгүй' }, { status: 404 })

  const integration = await prisma.storeIntegration.upsert({
    where:  { shopId: shop.id },
    create: {
      shopId:    shop.id,
      apiKey:    crypto.randomUUID(),
      apiSecret: crypto.randomBytes(32).toString('hex'),
    },
    update: {
      apiKey:    crypto.randomUUID(),
      apiSecret: crypto.randomBytes(32).toString('hex'),
    },
  })

  return NextResponse.json({ integration })
}
