import { NextRequest, NextResponse } from 'next/server'
import { getShopForRequest, requireSeller } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

async function getUsdRate(): Promise<number> {
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(5000),
    })
    const d = await r.json()
    return d.rates?.MNT || 3450
  } catch {
    return 3450
  }
}

// POST — dropship барааны үнэ/нөөц sync хийх
export async function POST(req: NextRequest) {
  const auth = requireSeller(req)
  if (auth instanceof NextResponse) return auth

  const shopId = await getShopForRequest(req, auth.id)
  if (!shopId) return NextResponse.json({ error: 'Дэлгүүр олдсонгүй' }, { status: 404 })

  const dropships = await prisma.dropshipProduct.findMany({
    where: { product: { userId: auth.id, shopId }, autoSync: true },
    include: { product: true },
  })

  const usdRate = await getUsdRate()
  let synced = 0
  let errors = 0

  for (const d of dropships) {
    try {
      await prisma.dropshipProduct.update({
        where: { id: d.id },
        data: { syncStatus: 'syncing' },
      })

      const costMnt = d.supplierCurrency === 'USD'
        ? Math.round(d.supplierPrice * usdRate)
        : Math.round(d.supplierPrice)
      const newPrice = Math.round(costMnt * (1 + d.profitMargin / 100))

      await prisma.product.update({
        where: { id: d.productId },
        data: { price: newPrice, stock: d.supplierStock },
      })

      await prisma.dropshipProduct.update({
        where: { id: d.id },
        data: {
          syncStatus: 'success',
          lastSyncAt: new Date(),
          syncError: null,
          supplierData: {
            ...((d.supplierData as Record<string, unknown>) || {}),
            usdRate,
            costMnt,
            lastRateUpdate: new Date().toISOString(),
          },
        },
      })

      synced++
    } catch (e: unknown) {
      await prisma.dropshipProduct.update({
        where: { id: d.id },
        data: { syncStatus: 'error', syncError: (e as Error).message },
      })
      errors++
    }
  }

  return NextResponse.json({ synced, errors, total: dropships.length, usdRate })
}

// GET — dropship барааны жагсаалт
export async function GET(req: NextRequest) {
  const auth = requireSeller(req)
  if (auth instanceof NextResponse) return auth

  const shopId = await getShopForRequest(req, auth.id)
  if (!shopId) return NextResponse.json({ error: 'Дэлгүүр олдсонгүй' }, { status: 404 })

  const products = await prisma.dropshipProduct.findMany({
    where: { product: { userId: auth.id, shopId } },
    include: { product: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ products })
}
