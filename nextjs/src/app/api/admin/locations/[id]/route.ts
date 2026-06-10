import { NextRequest, NextResponse } from 'next/server';
import { requireAdminDB } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { validateCoords } from '@/lib/location/validateCoords';

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/admin/locations/[id] - update a location coordinate record as admin
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdminDB(req);
  if (admin instanceof NextResponse) return admin;

  try {
    const { id } = await ctx.params;
    const existing = await prisma.storeLocation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    const body = await req.json();
    const lat = body.lat ?? existing.lat;
    const lng = body.lng ?? existing.lng;
    const coordCheck = validateCoords(lat, lng);

    const updated = await prisma.storeLocation.update({
      where: { id },
      data: {
        ...(body.district !== undefined && { district: body.district }),
        ...(body.khoroo !== undefined && { khoroo: body.khoroo }),
        ...(body.lat !== undefined && { lat: body.lat }),
        ...(body.lng !== undefined && { lng: body.lng }),
        coordStatus: coordCheck.status,
        coordNeedsUpdate: coordCheck.needsUpdate,
        coordCheckedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
