import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSeller, getShopForRequest, errorJson } from '@/lib/api-auth';
import { validateCoords } from '@/lib/location/validateCoords';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/seller/locations/[id]
export async function GET(req: NextRequest, ctx: Ctx) {
  const user = requireSeller(req);
  if (user instanceof NextResponse) return user;

  try {
    const { id } = await ctx.params;
    const shopId = await getShopForRequest(req, user.id);
    if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);

    const location = await prisma.storeLocation.findFirst({
      where: { id, entityId: shopId },
    });
    if (!location) return errorJson('Байршил олдсонгүй', 404);

    return NextResponse.json(location);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// PATCH /api/seller/locations/[id]
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = requireSeller(req);
  if (user instanceof NextResponse) return user;

  try {
    const { id } = await ctx.params;
    const shopId = await getShopForRequest(req, user.id);
    if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);

    // Ownership check
    const existing = await prisma.storeLocation.findFirst({
      where: { id, entityId: shopId },
    });
    if (!existing) return errorJson('Байршил олдсонгүй', 404);

    const body = await req.json();
    const coordCheck = validateCoords(
      body.lat ?? existing.lat,
      body.lng ?? existing.lng
    );

    const updated = await prisma.storeLocation.update({
      where: { id },
      data: {
        ...body,
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

// DELETE /api/seller/locations/[id] — soft delete
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = requireSeller(req);
  if (user instanceof NextResponse) return user;

  try {
    const { id } = await ctx.params;
    const shopId = await getShopForRequest(req, user.id);
    if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);

    const location = await prisma.storeLocation.findFirst({
      where: { id, entityId: shopId },
    });
    if (!location) return errorJson('Байршил олдсонгүй', 404);

    // Can't delete primary if others exist
    if (location.isPrimary) {
      const count = await prisma.storeLocation.count({
        where: { entityId: shopId, isActive: true },
      });
      if (count > 1) {
        return errorJson('Үндсэн байршлыг устгах боломжгүй. Эхлээд өөр байршлыг үндсэн болго', 400);
      }
    }

    await prisma.storeLocation.update({
      where: { id },
      data: { isActive: false },
    });

    return new NextResponse(null, { status: 204 });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
