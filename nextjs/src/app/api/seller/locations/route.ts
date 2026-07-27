import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSeller, getShopForRequest, errorJson } from '@/lib/api-auth';
import { validateCoords } from '@/lib/location/validateCoords';

// GET /api/seller/locations — list all locations for seller
export async function GET(req: NextRequest) {
  const user = requireSeller(req);
  if (user instanceof NextResponse) return user;

  try {
    const shopId = await getShopForRequest(req, user.id);
    if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter');

    const where: Record<string, unknown> = { entityId: shopId, isActive: true };
    if (filter === 'needs_coords') {
      where.coordNeedsUpdate = true;
    }

    const locations = await prisma.storeLocation.findMany({
      where,
      orderBy: [{ coordNeedsUpdate: 'desc' }, { isPrimary: 'desc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json(locations);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/seller/locations — create new location
export async function POST(req: NextRequest) {
  const user = requireSeller(req);
  if (user instanceof NextResponse) return user;

  try {
    const shopId = await getShopForRequest(req, user.id);
    if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);

    const body = await req.json();

    // First location is automatically primary
    const count = await prisma.storeLocation.count({
      where: { entityId: shopId, isActive: true },
    });

    const coordCheck = validateCoords(body.lat, body.lng);

    const location = await prisma.storeLocation.create({
      data: {
        entityId: shopId,
        name: body.name,
        isPrimary: count === 0,
        district: body.district,
        khoroo: body.khoroo,
        address: body.address,
        landmark: body.landmark || null,
        lat: body.lat || null,
        lng: body.lng || null,
        hours: body.hours || {},
        phone: body.phone,
        phone2: body.phone2 || null,
        email: body.email || null,
        website: body.website || null,
        facebook: body.facebook || null,
        instagram: body.instagram || null,
        whatsapp: body.whatsapp || null,
        features: body.features || [],
        notes: body.notes || null,
        coordStatus: coordCheck.status,
        coordNeedsUpdate: coordCheck.needsUpdate,
        coordCheckedAt: new Date(),
      },
    });

    return NextResponse.json({
      ...location,
      coordWarning: coordCheck.needsUpdate ? coordCheck.message : null,
    }, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
