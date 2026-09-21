import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  const auth = requireAuth(req)
  if (auth instanceof NextResponse) return auth

  // Return current seller profile + pending application
  try {
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: auth.id },
      include: {
        influencerApps: {
          where: { status: 'PENDING' },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!seller) {
      return NextResponse.json({ sellerType: 'REGULAR' })
    }

    return NextResponse.json({
      sellerType: seller.sellerType,
      followers: seller.followers,
      influencerVerified: seller.influencerVerified,
      pendingApp: seller.influencerApps[0] || null,
    })
  } catch {
    return NextResponse.json({ sellerType: 'REGULAR' })
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const body = await req.json()

  try {
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: auth.id },
    })

    if (!seller) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 })
    }

    // Check for existing pending application
    const existing = await prisma.influencerApplication.findFirst({
      where: { sellerId: seller.id, status: 'PENDING' },
    })

    if (existing) {
      return NextResponse.json({ error: 'pending' }, { status: 400 })
    }

    // Create application
    const app = await prisma.influencerApplication.create({
      data: {
        sellerId: seller.id,
        targetTier: body.targetTier || 'MICRO',
        instagram: body.instagram || null,
        tiktok: body.tiktok || null,
        facebook: body.facebook || null,
        youtube: body.youtube || null,
        followers: body.followers || 0,
        screenshot: body.screenshot || null,
        note: body.note || null,
      },
    })

    // Update seller's applied timestamp + social links
    await prisma.sellerProfile.update({
      where: { id: seller.id },
      data: {
        influencerAppliedAt: new Date(),
        followers: body.followers || seller.followers,
        socialLinks: {
          instagram: body.instagram || undefined,
          tiktok: body.tiktok || undefined,
          facebook: body.facebook || undefined,
          youtube: body.youtube || undefined,
        },
      },
    })

    return NextResponse.json({ success: true, id: app.id }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
