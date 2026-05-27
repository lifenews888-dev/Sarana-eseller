import { NextRequest, NextResponse } from 'next/server'
import { requireSeller } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { sanitizeImageUrls } from '@/lib/image-url'

// PUT — Feed URL тохируулах
export async function PUT(req: NextRequest) {
  const auth = requireSeller(req)
  if (auth instanceof NextResponse) return auth

  const { feedUrl, feedType, feedInterval } = await req.json()

  const shop = await prisma.shop.findUnique({ where: { userId: auth.id } })
  if (!shop) return NextResponse.json({ error: 'Дэлгүүр олдсонгүй' }, { status: 404 })

  const integration = await prisma.storeIntegration.upsert({
    where:  { shopId: shop.id },
    create: { shopId: shop.id, feedUrl, feedType, feedInterval: feedInterval || 60 },
    update: { feedUrl, feedType, feedInterval: feedInterval || 60 },
  })

  return NextResponse.json({ integration })
}

// POST — Feed-с бараа sync хийх
export async function POST(req: NextRequest) {
  const auth = requireSeller(req)
  if (auth instanceof NextResponse) return auth

  const shop = await prisma.shop.findUnique({
    where: { userId: auth.id },
    include: { integration: true },
  })

  if (!shop?.integration?.feedUrl) {
    return NextResponse.json({ error: 'Feed URL тохируулагдаагүй' }, { status: 400 })
  }

  const { integration } = shop

  await prisma.storeIntegration.update({
    where: { id: integration.id },
    data: { syncStatus: 'syncing' },
  })

  try {
    const res = await fetch(integration.feedUrl!, { signal: AbortSignal.timeout(30000) })
    const content = await res.text()

    let products: any[] = []

    if (integration.feedType === 'json') {
      const data = JSON.parse(content)
      products = Array.isArray(data) ? data : data.products || data.items || []
    } else if (integration.feedType === 'csv') {
      const lines = content.split('\n').filter(Boolean)
      const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''))
      products = lines.slice(1).map((line: string) => {
        const vals = line.split(',').map((v: string) => v.trim().replace(/"/g, ''))
        return Object.fromEntries(headers.map((h: string, i: number) => [h, vals[i]]))
      })
    } else {
      // XML/RSS parse
      const itemMatches = content.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)
      for (const m of itemMatches) {
        const item = m[1]
        const get = (tag: string) =>
          item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`))?.[1] ||
          item.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`))?.[1] ||
          ''
        products.push({
          name: get('title') || get('name'),
          description: get('description'),
          price: parseFloat(get('price') || get('g:price') || '0'),
          image: get('image_link') || get('g:image_link') || get('image'),
        })
      }
    }

    // Бараа DB-д хадгалах
    let synced = 0
    for (const p of products.slice(0, 500)) {
      const name = p.name || p.title
      if (!name) continue

      try {
        await prisma.product.create({
          data: {
            name,
            description: p.description || '',
            price: Math.round(parseFloat(String(p.price).replace(/[^\d.]/g, '')) || 0),
            images: sanitizeImageUrls(p.image ? [p.image] : p.images),
            userId: auth.id,
            isActive: true,
          },
        })
        synced++
      } catch {}
    }

    await prisma.storeIntegration.update({
      where: { id: integration.id },
      data: {
        syncStatus: 'success',
        lastSyncAt: new Date(),
        totalSynced: { increment: synced },
        syncError: null,
      },
    })

    return NextResponse.json({ success: true, synced, total: products.length })
  } catch (e: any) {
    await prisma.storeIntegration.update({
      where: { id: integration.id },
      data: { syncStatus: 'error', syncError: e.message },
    })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
