import { NextRequest, NextResponse } from 'next/server'
import { requireSeller } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { sanitizeImageUrls } from '@/lib/image-url'

function parseCSV(text: string) {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) throw new Error('CSV хоосон байна')

  const headers = lines[0]
    .split(',')
    .map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase())

  return lines.slice(1).map(line => {
    const vals: string[] = []
    let cur = ''
    let inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue }
      if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; continue }
      cur += ch
    }
    vals.push(cur.trim())
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] || '']))
  })
}

export async function POST(req: NextRequest) {
  const auth = requireSeller(req)
  if (auth instanceof NextResponse) return auth

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'Файл оруулна уу' }, { status: 400 })

  const shop = await prisma.shop.findUnique({ where: { userId: auth.id } })
  if (!shop) return NextResponse.json({ error: 'Дэлгүүр олдсонгүй' }, { status: 404 })

  const text = await file.text()
  let rows: Record<string, string>[]
  try {
    rows = parseCSV(text)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }

  const results = { success: 0, failed: 0, errors: [] as string[] }

  for (const row of rows.slice(0, 500)) {
    const name = row.name || row.title
    if (!name) {
      results.failed++
      continue
    }

    const price = parseInt(String(row.price || '0').replace(/[^\d]/g, '')) || 0
    const rawSalePrice = parseInt(String(row.saleprice || row.sale_price || '0').replace(/[^\d]/g, ''))
    const salePrice = rawSalePrice > 0 ? rawSalePrice : null

    const images = sanitizeImageUrls(
      (row.images || row.image || '')
        .split('|')
        .map((s: string) => s.trim())
        .filter(Boolean)
    )

    try {
      await prisma.product.create({
        data: {
          name,
          description: row.description || '',
          price,
          salePrice,
          images,
          stock: parseInt(row.stock || '0') || 0,
          category: row.category || 'other',
          userId: auth.id,
          isActive: (row.active || 'true').toLowerCase() !== 'false',
        },
      })
      results.success++
    } catch (e: any) {
      results.failed++
      if (results.errors.length < 20) {
        results.errors.push(`${name}: ${e.message}`)
      }
    }
  }

  return NextResponse.json({
    ...results,
    total: rows.length,
    message: `${results.success} бараа нэмэгдлээ`,
  })
}
