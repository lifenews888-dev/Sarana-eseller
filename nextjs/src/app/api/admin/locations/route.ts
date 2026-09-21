import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminDB } from '@/lib/api-auth';

// GET /api/admin/locations — list all store locations for admin
export async function GET(req: NextRequest) {
  const admin = await requireAdminDB(req);
  if (admin instanceof NextResponse) return admin;

  try {
    const locations = await prisma.storeLocation.findMany({
      where: { isActive: true },
      orderBy: [{ coordNeedsUpdate: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(locations);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
