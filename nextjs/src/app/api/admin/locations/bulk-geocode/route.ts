import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { geocodeAddress } from '@/lib/maps/googleMaps';
import { requireAdminDB } from '@/lib/api-auth';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// POST /api/admin/locations/bulk-geocode — координатгүй бүх байршлыг автомат geocode хийх
export async function POST(req: NextRequest) {
  const admin = await requireAdminDB(req);
  if (admin instanceof NextResponse) return admin;

  try {
    const locations = await prisma.storeLocation.findMany({
      where: { isActive: true, coordNeedsUpdate: true },
    });

    const results = { success: 0, failed: 0 };

    for (const loc of locations) {
      // Rate limit: Google Geocoding API = 50 req/sec
      await sleep(25);

      const fullAddress = [loc.district, loc.khoroo, loc.address]
        .filter(Boolean).join(', ');

      const geo = await geocodeAddress(fullAddress);

      if (!geo || !geo.inMongolia) {
        results.failed++;
        continue;
      }

      await prisma.storeLocation.update({
        where: { id: loc.id },
        data: {
          lat:              geo.lat,
          lng:              geo.lng,
          coordStatus:      'valid_mongolia',
          coordNeedsUpdate: false,
          coordCheckedAt:   new Date(),
        },
      });

      results.success++;
    }

    return NextResponse.json({
      total:   locations.length,
      ...results,
      message: `${results.success} байршил шинэчлэгдлээ, ${results.failed} олдсонгүй`,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
