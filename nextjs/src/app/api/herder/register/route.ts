import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { HERDER_PROVINCES, LIVESTOCK_TYPES } from '@/lib/herder-delivery';

// POST /api/herder/register — Register as a herder seller
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { province, district, herderName, livestockType, description } = body;

    // Validate required fields
    if (!province || !district || !herderName) {
      return errorJson('Аймаг, сум, малчны нэр заавал шаардлагатай');
    }

    // Validate province
    const validProvince = HERDER_PROVINCES.find(p => p.code === province || p.name === province);
    if (!validProvince) {
      return errorJson('Буруу аймгийн код');
    }

    // Validate livestock types
    const types: string[] = Array.isArray(livestockType) ? livestockType : [];
    if (types.length === 0) {
      return errorJson('Мал сүргийн төрлөө сонгоно уу');
    }
    const validTypes = types.every(t => (LIVESTOCK_TYPES as readonly string[]).includes(t));
    if (!validTypes) {
      return errorJson('Буруу мал сүргийн төрөл');
    }

    // Check if user already has a herder shop
    const existingShop = await prisma.shop.findFirst({ where: { userId: auth.id },
      include: { herderShop: true },
    });

    if (existingShop?.herderShop) {
      return errorJson('Та аль хэдийн малчны дэлгүүр үүсгэсэн байна');
    }

    // Create or use existing shop
    let shopId: string;
    if (existingShop) {
      shopId = existingShop.id;
    } else {
      const slug = `herder-${herderName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      const shop = await prisma.shop.create({
        data: {
          userId: auth.id,
          name: `${herderName} — Малчин`,
          slug,
          address: `${validProvince.name}, ${district}`,
          industry: 'herder',
        },
      });
      shopId = shop.id;
    }

    // Create HerderShop
    const herderShop = await prisma.herderShop.create({
      data: {
        shopId,
        province: validProvince.code,
        district,
        herderName,
        livestockType: types,
        description: description || null,
      },
      include: { shop: true },
    });

    return json(herderShop, 201);
  } catch (err) {
    console.error('[herder/register]', err);
    return errorJson('Малчны бүртгэл амжилтгүй боллоо', 500);
  }
}
