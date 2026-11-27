import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/seller-page/:username — борлуулагчийн нийтийн хуудасны бодит мэдээлэл.
// Олдохгүй бол 404 (өмнө нь бүх хэрэглэгчид зохиомол "Б. Баяраа" харагддаг байсан).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const clean = decodeURIComponent(username || '').trim();
  if (!clean || clean.length > 64) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  try {
    const profile = await prisma.sellerProfile.findUnique({
      where: { username: clean },
      select: {
        id: true, username: true, displayName: true, bio: true, avatar: true,
        isVerified: true, isActive: true, commissionRate: true, totalSales: true,
      },
    });
    if (!profile || !profile.isActive) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const links = await prisma.sellerProduct.findMany({
      where: { sellerProfileId: profile.id, isApproved: true },
      orderBy: { sortOrder: 'asc' },
      take: 60,
      select: {
        customPrice: true,
        product: { select: { id: true, name: true, price: true, salePrice: true, images: true, rating: true, isActive: true } },
      },
    });

    const products = links
      .filter((l) => l.product && l.product.isActive)
      .map((l) => ({
        id: l.product.id,
        name: l.product.name,
        price: l.customPrice ?? l.product.price,
        salePrice: l.product.salePrice ?? undefined,
        image: l.product.images?.[0] || '',
        rating: l.product.rating ?? undefined,
      }));

    const { id: _id, isActive: _a, ...seller } = profile;
    void _id; void _a;
    return NextResponse.json({ seller, products });
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
}
