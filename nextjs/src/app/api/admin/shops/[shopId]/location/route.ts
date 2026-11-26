import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireAuth } from '@/lib/api-auth';

type Ctx = { params: Promise<{ shopId: string }> };

// PATCH /api/admin/shops/[shopId]/location — update location + verify
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  if (!['admin', 'superadmin', 'super_admin'].includes(auth.role)) return errorJson('Админ эрх шаардлагатай', 403);

  const { shopId } = await ctx.params;
  const body = await req.json();
  const { lat, lng, district, khoroo, locationNote, locationStatus } = body;

  const data: Record<string, unknown> = {};
  if (lat !== undefined) data.lat = Number(lat);
  if (lng !== undefined) data.lng = Number(lng);
  if (district !== undefined) data.district = district;
  if (khoroo !== undefined) data.khoroo = khoroo;
  if (locationNote !== undefined) data.locationNote = locationNote;
  if (locationStatus !== undefined) {
    data.locationStatus = locationStatus;
    if (locationStatus === 'verified') data.locationVerifiedAt = new Date();
  }

  const shop = await prisma.shop.update({
    where: { id: shopId },
    data,
  });

  return json(shop);
}
