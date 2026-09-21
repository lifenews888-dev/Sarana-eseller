import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminDB, requireAuth } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const auth = requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const body = await req.json()

  const request = await prisma.categoryRequest.create({
    data: {
      name: body.name,
      parentId: body.parentId || null,
      parentName: body.parentName || null,
      reason: body.reason,
      requestedBy: auth.id,
      shopName: body.shopName,
    },
  })

  return NextResponse.json(request, { status: 201 })
}

export async function GET(req: NextRequest) {
  const admin = await requireAdminDB(req)
  if (admin instanceof NextResponse) return admin

  const requests = await prisma.categoryRequest.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ requests })
}
