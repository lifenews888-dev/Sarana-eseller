import { NextRequest, NextResponse } from 'next/server'
import { requireSeller } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

// URL-аас бараа мэдээлэл scrape хийх
async function scrapeProduct(url: string) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EsellerBot/1.0)' },
    signal: AbortSignal.timeout(10000),
  })
  const html = await res.text()

  // OpenGraph meta татах
  const getOG = (prop: string) => {
    const m =
      html.match(new RegExp(`<meta[^>]*property=["']og:${prop}["'][^>]*content=["']([^"']+)["']`, 'i')) ||
      html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${prop}["']`, 'i'))
    return m?.[1] || ''
  }

  // JSON-LD structured data
  let jsonLd: Record<string, any> = {}
  const ldMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i)
  if (ldMatch) {
    try { jsonLd = JSON.parse(ldMatch[1]) } catch {}
  }

  // Үнэ олох
  const pricePatterns = [
    /["']price["']\s*:\s*["']?([\d,\.]+)/i,
    /itemprop=["']price["'][^>]*content=["']([\d,\.]+)/i,
  ]
  let price = jsonLd?.offers?.price || jsonLd?.price || ''
  if (!price) {
    for (const p of pricePatterns) {
      const m = html.match(p)
      if (m) { price = m[1].replace(/[,\s]/g, ''); break }
    }
  }

  // Зураг олох
  const images: string[] = []
  const ogImage = getOG('image')
  if (ogImage) images.push(ogImage)

  const imgMatches = html.matchAll(/<img[^>]*src=["']([^"']+(?:jpg|jpeg|png|webp)[^"']*)["']/gi)
  for (const m of imgMatches) {
    if (images.length >= 5) break
    const src = m[1]
    if (src.startsWith('http') && !images.includes(src)) images.push(src)
  }

  // Эх сайтыг тодорхойлох
  const hostname = new URL(url).hostname
  const sourceType = hostname.includes('shopify')
    ? 'shopify'
    : hostname.includes('woocommerce') || html.includes('woocommerce')
      ? 'woocommerce'
      : hostname.includes('aliexpress')
        ? 'aliexpress'
        : hostname.includes('unegui')
          ? 'unegui'
          : 'custom'

  return {
    name: getOG('title') || jsonLd?.name || html.match(/<title>([^<]+)/)?.[1] || '',
    description: getOG('description') || jsonLd?.description || '',
    price: Math.round(parseFloat(String(price).replace(/[^\d.]/g, '')) || 0),
    images,
    sourceType,
    url,
  }
}

export async function POST(req: NextRequest) {
  const auth = requireSeller(req)
  if (auth instanceof NextResponse) return auth

  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: 'URL шаардлагатай' }, { status: 400 })

  try { new URL(url) } catch {
    return NextResponse.json({ error: 'URL буруу байна' }, { status: 400 })
  }

  const shop = await prisma.shop.findFirst({ where: { userId: auth.id } })
  if (!shop) return NextResponse.json({ error: 'Дэлгүүр олдсонгүй' }, { status: 404 })

  // Integration байхгүй бол үүсгэх
  const integration = await prisma.storeIntegration.upsert({
    where:  { shopId: shop.id },
    create: { shopId: shop.id },
    update: {},
  })

  // Import record үүсгэх
  const imported = await prisma.importedUrl.create({
    data: { integrationId: integration.id, url, status: 'pending' },
  })

  try {
    const scraped = await scrapeProduct(url)

    await prisma.importedUrl.update({
      where: { id: imported.id },
      data: { status: 'success', rawData: scraped as any, sourceType: scraped.sourceType },
    })

    return NextResponse.json({ success: true, data: scraped, importId: imported.id })
  } catch (e: any) {
    await prisma.importedUrl.update({
      where: { id: imported.id },
      data: { status: 'failed', error: e.message },
    })
    return NextResponse.json({ error: e.message }, { status: 422 })
  }
}
