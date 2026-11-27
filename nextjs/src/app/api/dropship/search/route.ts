import { NextRequest, NextResponse } from 'next/server'

async function searchAliExpress(keyword: string, page = 1) {
  const res = await fetch(
    `https://aliexpress-datahub.p.rapidapi.com/item_search_3?q=${encodeURIComponent(keyword)}&page=${page}`,
    {
      headers: {
        'x-rapidapi-host': 'aliexpress-datahub.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY || '',
      },
      signal: AbortSignal.timeout(10000),
    },
  )
  if (!res.ok) throw new Error('AliExpress API алдаа')
  return res.json()
}

async function searchCJDropshipping(keyword: string) {
  const authRes = await fetch(
    'https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.CJ_EMAIL || '',
        password: process.env.CJ_PASSWORD || '',
      }),
    },
  )
  const auth = await authRes.json()
  const token = auth.data?.accessToken
  if (!token) throw new Error('CJ auth алдаа')

  const res = await fetch(
    `https://developers.cjdropshipping.com/api2.0/v1/product/list?productName=${encodeURIComponent(keyword)}&pageNum=1&pageSize=20`,
    { headers: { 'CJ-Access-Token': token } },
  )
  return res.json()
}

type AliItem = {
  itemId?: string | number; title?: string; subject?: string; price?: string | number;
  sku?: { def?: { promotionPrice?: string | number; price?: string | number } };
  image?: string; itemUrl?: string; quantity?: number; averageStarRate?: number; averageStar?: number;
  sales?: number; totalOrders?: number;
}
type AliEntry = AliItem & { item?: AliItem; delivery?: { deliveryDays?: string } }
type CjItem = { pid?: string; productName?: string; sellPrice?: string | number; productImage?: string; inventory?: number; logisticsTime?: string }
type DropshipSearchItem = Record<string, unknown>

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const source = searchParams.get('source') || 'aliexpress'
  const page = parseInt(searchParams.get('page') || '1')

  if (!q) return NextResponse.json({ error: 'Хайлтын үг оруулна уу' }, { status: 400 })

  try {
    let products: DropshipSearchItem[] = []

    if (source === 'aliexpress') {
      const data = await searchAliExpress(q, page)

      // Debug
      console.log('RAW keys:', Object.keys(data))
      console.log('result keys:', Object.keys(data.result || {}))

      const items =
        data.result?.resultList ||
        data.result?.items ||
        data.resultList ||
        data.items ||
        []

      console.log('items count:', items.length)
      if (items.length > 0) {
        console.log('first item keys:', Object.keys(items[0]))
        console.log('first item sample:', JSON.stringify(items[0]).slice(0, 400))
      }

      products = (items as AliEntry[]).map((entry) => {
        const item = entry.item || entry
        const delivery = entry.delivery || {}
        return {
          supplierId: String(item.itemId || ''),
          supplierName: 'aliexpress',
          name: item.title || item.subject || '',
          supplierPrice: parseFloat(String(
            item.sku?.def?.promotionPrice ||
            item.sku?.def?.price ||
            item.price || 0)
          ),
          supplierCurrency: 'USD',
          images: item.image
            ? [`https:${item.image}`]
            : [],
          supplierUrl: item.itemUrl
            ? `https:${item.itemUrl}`
            : `https://www.aliexpress.com/item/${item.itemId}.html`,
          supplierStock: item.quantity || 999,
          rating: item.averageStarRate || item.averageStar || 0,
          orders: item.sales || item.totalOrders || 0,
          shipping: delivery.deliveryDays || '15-30 хоног',
        }
      })

    } else if (source === 'cj') {
      const data = await searchCJDropshipping(q)
      products = ((data.data?.list || []) as CjItem[]).map((item) => ({
        supplierId: item.pid,
        supplierName: 'cj',
        name: item.productName,
        supplierPrice: parseFloat(String(item.sellPrice || 0)),
        supplierCurrency: 'USD',
        images: item.productImage ? [item.productImage] : [],
        supplierUrl: `https://cjdropshipping.com/product/${item.pid}.html`,
        supplierStock: item.inventory || 0,
        shipping: item.logisticsTime || '7-15 хоног',
      }))
    }

    return NextResponse.json({ products, source, query: q })

  } catch (err: unknown) {
    console.error('Dropship search error:', (err instanceof Error ? err.message : String(err)))
    // Fallback demo data
    const demo = Array.from({ length: 8 }, (_, i) => ({
      supplierId: `demo-${i + 1}`,
      supplierName: source,
      name: `${q} — Бараа ${i + 1}`,
      supplierPrice: Math.round(Math.random() * 50 + 5),
      supplierCurrency: 'USD',
      images: [`https://picsum.photos/300/300?random=${i}`],
      supplierUrl: `https://${source}.com/item/${i + 1}`,
      supplierStock: Math.round(Math.random() * 500 + 10),
      shipping: '15-30 хоног',
    }))
    return NextResponse.json({ products: demo, source, query: q, demo: true })
  }
}
