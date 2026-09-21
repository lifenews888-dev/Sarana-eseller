import { NextRequest, NextResponse } from 'next/server';
import { requireAdminDB } from '@/lib/api-auth';

// GET /api/admin/maintenance — check status
export async function GET(req: NextRequest) {
  const admin = await requireAdminDB(req);
  if (admin instanceof NextResponse) return admin;

  return NextResponse.json({
    maintenance: process.env.MAINTENANCE_MODE === 'true',
    note: 'Maintenance mode is controlled via MAINTENANCE_MODE env variable in Vercel.',
  });
}
