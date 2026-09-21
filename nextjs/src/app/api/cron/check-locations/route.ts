import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateCoords } from '@/lib/location/validateCoords';

// Vercel Cron: 7 хоног бүр Пүрэв гаригт 10:00-д ажиллана
// vercel.json: { "crons": [{ "path": "/api/cron/check-locations", "schedule": "0 10 * * 4" }] }

export async function GET(req: NextRequest) {
  // Cron secret шалгалт
  const authHeader = req.headers.get('authorization');
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 });
  }
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const locations = await prisma.storeLocation.findMany({
      where: { isActive: true },
    });

    let valid = 0;
    let flagged = 0;

    for (const loc of locations) {
      const check = validateCoords(loc.lat, loc.lng);

      // Статус DB-д шинэчлэх
      await prisma.storeLocation.update({
        where: { id: loc.id },
        data: {
          coordStatus: check.status,
          coordNeedsUpdate: check.needsUpdate,
          coordCheckedAt: new Date(),
        },
      });

      if (check.needsUpdate) {
        flagged++;
      } else {
        valid++;
      }
    }

    return NextResponse.json({
      total: locations.length,
      valid,
      flagged,
      checkedAt: new Date().toISOString(),
    });
  } catch (e: unknown) {
    console.error('Coord check cron error:', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
