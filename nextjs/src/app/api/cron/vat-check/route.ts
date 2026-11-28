import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkVatThreshold } from '@/lib/tax/vatMonitor'
import { isCronAuthorized } from '@/lib/cron-auth';

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const shops = await prisma.shop.findMany({
    where: { isBlocked: false },
    select: { id: true, industry: true },
  })

  const results = []
  for (const shop of shops) {
    const result = await checkVatThreshold(shop.id, shop.industry || 'store')
    if (result.status !== 'ok') {
      results.push(result)
    }
  }

  return NextResponse.json({
    checked: shops.length,
    warnings: results.filter((r) => r.status === 'warning').length,
    exceeded: results.filter((r) => r.status === 'exceeded').length,
    timestamp: new Date().toISOString(),
  })
}
