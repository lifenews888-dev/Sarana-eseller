import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;

  const body = await req.json();
  if (!body.productId) {
    return NextResponse.json({ error: 'productId шаардлагатай' }, { status: 400 });
  }

  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId: auth.id },
    select: { id: true, isActive: true },
  });

  if (!sellerProfile?.isActive) {
    return NextResponse.json({ error: 'Баталгаажсан борлуулагч эрх шаардлагатай' }, { status: 403 });
  }

  const product = await prisma.product.findFirst({
    where: { id: body.productId, isActive: true, allowAffiliate: true },
    select: { id: true },
  });

  if (!product) {
    return NextResponse.json({ error: 'Борлуулах боломжтой бараа олдсонгүй' }, { status: 404 });
  }

  const existing = await prisma.sellerProduct.findFirst({
    where: {
      productId: body.productId,
      sellerProfileId: sellerProfile.id,
    },
  });

  if (existing) {
    return NextResponse.json({ error: 'Already requested' }, { status: 409 });
  }

  const sellerProduct = await prisma.sellerProduct.create({
    data: {
      productId: body.productId,
      sellerProfileId: sellerProfile.id,
      isApproved: false,
    },
  });

  return NextResponse.json(sellerProduct, { status: 201 });
}
