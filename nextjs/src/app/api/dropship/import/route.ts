import { NextRequest, NextResponse } from 'next/server'
import { getShopForRequest, requireSeller } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { sanitizeImageUrls } from '@/lib/image-url'
import { getPublicProductQualityIssue } from '@/lib/product-visibility'

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
  const productName = typeof name === 'string' ? name.trim() : ''
  const productDescription = typeof description === 'string' ? description : ''

  if (!supplierId || !supplierName || !productName) {
    return NextResponse.json({ error: 'Мэдээлэл дутуу' }, { status: 400 })
  }

  const numericSupplierPrice = Number(supplierPrice)
  const numericProfitMargin = Number(profitMargin)
  const cleanImages = sanitizeImageUrls(images)

  if (!Number.isFinite(numericSupplierPrice) || numericSupplierPrice <= 0) {
    return NextResponse.json({ error: 'Invalid supplier price' }, { status: 400 })
  }

  const shopId = await getShopForRequest(req, auth.id)
  if (!shopId) return NextResponse.json({ error: 'Дэлгүүр олдсонгүй' }, { status: 404 })

  // Аль хэдийн импортлогдсон эсэх шалгах
  const existing = await prisma.dropshipProduct.findFirst({
    where: {
      supplierId,
      supplierName,
      product: {
        is: {
          userId: auth.id,
          OR: [
            { shopId },
            { shopId: null },
          ],
        },
      },
    },
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
  const margin = Number.isFinite(numericProfitMargin) ? numericProfitMargin : 40
  const costMnt = Math.round(numericSupplierPrice * usdRate)
  const sellPrice = Math.round(costMnt * (1 + margin / 100))
  const qualityIssue = getPublicProductQualityIssue({
    name: productName,
    description: productDescription,
    price: sellPrice,
    images: cleanImages,
    isActive: true,
    isDemo: false,
  })

  if (qualityIssue) {
    return NextResponse.json({
      error: 'Product does not meet public marketplace quality requirements',
      qualityIssue,
    }, { status: 400 })
  }

  // Бараа үүсгэх
  const product = await prisma.product.create({
    data: {
      name: productName,
      description: productDescription,
      price: sellPrice,
      images: cleanImages,
      stock: supplierStock || 0,
      userId: auth.id,
      shopId,
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
      supplierPrice: numericSupplierPrice,
      supplierCurrency: supplierCurrency || 'USD',
      supplierStock: supplierStock || 0,
      profitMargin: margin,
      syncStatus: 'success',
      lastSyncAt: new Date(),
      supplierData: { costMnt, usdRate, importedAt: new Date().toISOString() },
    },
  })

  return NextResponse.json({ success: true, product, dropship, costMnt, sellPrice, usdRate })
}
