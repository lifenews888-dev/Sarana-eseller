import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminDB } from '@/lib/api-auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminDB(req)
  if (admin instanceof NextResponse) return admin

  const { id } = await params
  const body = await req.json()

  const app = await prisma.influencerApplication.findUnique({
    where: { id },
  })

  if (!app) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (body.action === 'approve') {
    // Update application
    await prisma.influencerApplication.update({
      where: { id },
      data: {
        status: 'APPROVED',
        adminNote: body.adminNote,
        reviewedAt: new Date(),
      },
    })

    // Update seller profile
    await prisma.sellerProfile.update({
      where: { id: app.sellerId },
      data: {
        sellerType: body.tier || app.targetTier,
        influencerVerified: true,
        influencerNote: `Approved: ${body.tier || app.targetTier}`,
      },
    })

    return NextResponse.json({ success: true })
  }

  if (body.action === 'reject') {
    await prisma.influencerApplication.update({
      where: { id },
      data: {
        status: 'REJECTED',
        adminNote: body.adminNote,
        reviewedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
