import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminDB } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  const admin = await requireAdminDB(req)
  if (admin instanceof NextResponse) return admin

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const where = status && status !== 'ALL' ? { status } : {}

  const disputes = await prisma.dispute.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  const stats = {
    total: await prisma.dispute.count(),
    open: await prisma.dispute.count({ where: { status: 'OPEN' } }),
    resolved: await prisma.dispute.count({ where: { status: 'RESOLVED' } }),
    rejected: await prisma.dispute.count({ where: { status: 'REJECTED' } }),
  }

  return NextResponse.json({ disputes, stats })
}

export async function POST(req: NextRequest) {
  const admin = await requireAdminDB(req)
  if (admin instanceof NextResponse) return admin

  const body = await req.json()

  const count = await prisma.dispute.count()
  const code = `DSP-${String(count + 1).padStart(4, '0')}`

  const dispute = await prisma.dispute.create({
    data: {
      code,
      orderId: body.orderId,
      commissionId: body.commissionId,
      sellerId: body.sellerId,
      shopId: body.shopId,
      sellerName: body.sellerName,
      shopName: body.shopName,
      reason: body.reason,
      description: body.description,
    },
  })

  return NextResponse.json(dispute, { status: 201 })
}
