import { NextRequest, NextResponse } from 'next/server'
import { requireSeller } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

// USD → MNT ханш
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

export async function POST(req: NextRequest) {
  const auth = requireSeller(req)
  if (auth instanceof NextResponse) return auth

  const {
    supplierId,
    supplierName,
    supplierUrl,
    name,
    supplierPrice,
    supplierCurrency,
    images,
    supplierStock,
    profitMargin = 40,
    category,
    description,
  } = await req.json()

  if (!supplierId || !supplierName || !name) {
    return NextResponse.json({ error: 'Мэдээлэл дутуу' }, { status: 400 })
  }

  if (!supplierPrice || supplierPrice <= 0) {
    return NextResponse.json({ error: 'Нийлүүлэгчийн үнэ тодорхойгүй байна. Бараагаа гараар нэмнэ үү.' }, { status: 400 })
  }

  const shop = await prisma.shop.findUnique({ where: { userId: auth.id } })
  if (!shop) return NextResponse.json({ error: 'Дэлгүүр олдсонгүй' }, { status: 404 })

  // Аль хэдийн импортлогдсон эсэх шалгах
  const existing = await prisma.dropshipProduct.findFirst({
    where: { supplierId, supplierName },
    include: { product: true },
  })
  if (existing) {
    return NextResponse.json({
      error: `"${existing.product.name}" нэртэйгээр аль хэдийн нэмэгдсэн`,
      existingProductId: existing.productId,
    }, { status: 409 })
  }

  // Үнэ тооцоолох
  const usdRate = supplierCurrency === 'USD' ? await getUsdRate() : 1
  const costMnt = Math.round(supplierPrice * usdRate)
  const sellPrice = Math.round(costMnt * (1 + profitMargin / 100))

  // Бараа үүсгэх
  const product = await prisma.product.create({
    data: {
      name,
      description: description || '',
      price: sellPrice,
      images: images || [],
      stock: supplierStock || 0,
      userId: auth.id,
      isActive: true,
      category: category || 'dropship',
    },
  })

  // Dropship мэдээлэл холбох
  const dropship = await prisma.dropshipProduct.create({
    data: {
      productId: product.id,
      supplierName,
      supplierId,
      supplierUrl: supplierUrl || '',
      supplierPrice,
      supplierCurrency: supplierCurrency || 'USD',
      supplierStock: supplierStock || 0,
      profitMargin,
      syncStatus: 'success',
      lastSyncAt: new Date(),
      supplierData: { costMnt, usdRate, importedAt: new Date().toISOString() },
    },
  })

  return NextResponse.json({ success: true, product, dropship, costMnt, sellPrice, usdRate })
}
