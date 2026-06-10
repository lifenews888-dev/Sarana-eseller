import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSeller, getShopForRequest, errorJson } from '@/lib/api-auth';
import { geocodeAddress } from '@/lib/maps/googleMaps';

type Ctx = { params: Promise<{ id: string }> };

// POST /api/seller/locations/[id]/verify — хаягаас автомат geocode хийж координат тогтоох
export async function POST(req: NextRequest, ctx: Ctx) {
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

    const fullAddress = [location.district, location.khoroo, location.address]
      .filter(Boolean).join(', ');

    const result = await geocodeAddress(fullAddress);

    if (!result) {
      return NextResponse.json({
        success: false,
        message: 'Хаяг олдсонгүй. Газрын зураг дээр гараар тэмдэглэнэ үү.',
      });
    }

    if (!result.inMongolia) {
      return NextResponse.json({
        success: false,
        message: `Координат Монголоос гадна байна (${result.lat.toFixed(4)}, ${result.lng.toFixed(4)})`,
      });
    }

    await prisma.storeLocation.update({
      where: { id },
      data: {
        lat:              result.lat,
        lng:              result.lng,
        coordStatus:      'valid_mongolia',
        coordNeedsUpdate: false,
        coordCheckedAt:   new Date(),
      },
    });

    return NextResponse.json({
      success:       true,
      lat:           result.lat,
      lng:           result.lng,
      formattedAddr: result.formattedAddr,
      confidence:    result.confidence,
      message:       `Байршил олдлоо (${result.confidence === 'high' ? 'нарийн' : 'ойролцоо'})`,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
