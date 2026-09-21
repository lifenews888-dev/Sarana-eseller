import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminDB } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  const admin = await requireAdminDB(req)
  if (admin instanceof NextResponse) return admin

  const applications = await prisma.influencerApplication.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      seller: {
        select: {
          id: true,
          displayName: true,
          username: true,
          sellerType: true,
          followers: true,
          totalSales: true,
          totalEarned: true,
          influencerVerified: true,
          socialLinks: true,
        },
      },
    },
  })

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'PENDING').length,
    approved: applications.filter((a) => a.status === 'APPROVED').length,
    rejected: applications.filter((a) => a.status === 'REJECTED').length,
  }

  return NextResponse.json({ applications, stats })
}
