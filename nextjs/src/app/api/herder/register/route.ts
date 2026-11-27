import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { LIVESTOCK_TYPES } from '@/lib/herder-delivery';
import { findProvince } from '@/lib/herder';

const REGISTER_NUMBER_RE = /^[А-ЯӨҮЁ]{2}\d{8}$/u;
const LIVESTOCK_KEYS = ['horse', 'cow', 'sheep', 'goat', 'camel'] as const;
const LIVESTOCK_LABEL: Record<(typeof LIVESTOCK_KEYS)[number], string> = {
  horse: 'адуу',
  cow: 'үхэр',
  sheep: 'хонь',
  goat: 'ямаа',
  camel: 'тэмээ',
};

function str(value: unknown, max = 200): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function publicUrl(value: unknown): string | null {
  const v = str(value, 1000);
  return /^https:\/\//i.test(v) ? v : null;
}

// POST /api/herder/register — малчнаар бүртгүүлэх хүсэлт (координатор баталгаажуулна)
// Мобайл: { firstName, lastName, registerNumber, phone, province, district, livestock, aDansNumber,
//           vetCertUri, bankName, bankAccount, gps, notes }
// Хуучин хэлбэр: { province, district, herderName, livestockType[], description }
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json().catch(() => ({}));

    const province = findProvince(body.province);
    if (!province) return errorJson('Аймгаа зөв сонгоно уу');
    const district = str(body.district, 120);
    if (!district) return errorJson('Сум, багийн нэрээ оруулна уу');

    const firstName = str(body.firstName, 80);
    const lastName = str(body.lastName, 80);
    const herderName = str(body.herderName, 120) || [lastName, firstName].filter(Boolean).join(' ');
    if (!herderName) return errorJson('Овог, нэрээ оруулна уу');

    const registerNumber = str(body.registerNumber, 10).toUpperCase();
    if (registerNumber && !REGISTER_NUMBER_RE.test(registerNumber)) {
      return errorJson('Регистрийн дугаар буруу байна (жишээ: УБ12345678)');
    }
    const phone = str(body.phone, 20).replace(/\D/g, '');
    if (phone && phone.length < 8) return errorJson('Утасны дугаар буруу байна');

    const rawLivestock = body.livestock && typeof body.livestock === 'object' ? body.livestock : {};
    const livestock: Record<string, number> = {};
    for (const key of LIVESTOCK_KEYS) {
      const n = Math.floor(Number((rawLivestock as Record<string, unknown>)[key]) || 0);
      if (n > 0) livestock[key] = Math.min(n, 1_000_000);
    }
    let livestockType: string[] = Object.keys(livestock).map((k) => LIVESTOCK_LABEL[k as keyof typeof LIVESTOCK_LABEL]);
    if (Array.isArray(body.livestockType)) {
      const extra = body.livestockType
        .map((t: unknown) => String(t))
        .filter((t: string) => (LIVESTOCK_TYPES as readonly string[]).includes(t));
      livestockType = Array.from(new Set([...livestockType, ...extra]));
    }
    if (livestockType.length === 0) return errorJson('Мал сүргийн тоогоо оруулна уу');

    const bankName = str(body.bankName, 80);
    const bankAccount = str(body.bankAccount, 30).replace(/\D/g, '');
    const gps =
      body.gps && Number.isFinite(Number(body.gps.latitude)) && Number.isFinite(Number(body.gps.longitude))
        ? { latitude: Number(body.gps.latitude), longitude: Number(body.gps.longitude) }
        : undefined;

    const existingShops = await prisma.shop.findMany({ where: { userId: auth.id }, include: { herderShop: true } });
    const existingHerder = existingShops.find((s) => s.herderShop)?.herderShop;

    const data = {
      province: province.code,
      district,
      herderName,
      livestockType,
      description: str(body.description, 2000) || str(body.notes, 2000) || null,
      firstName: firstName || null,
      lastName: lastName || null,
      registerNumber: registerNumber || null,
      phone: phone || null,
      livestock,
      aDansNumber: str(body.aDansNumber, 40) || null,
      vetCertUrl: publicUrl(body.vetCertUrl ?? body.vetCertUri),
      bankInfo: bankName && bankAccount ? { bankName, accountNumber: bankAccount, accountName: herderName } : undefined,
      gps,
      notes: str(body.notes, 2000) || null,
    };

    if (existingHerder) {
      if (existingHerder.status !== 'rejected') {
        const pending = existingHerder.status === 'pending' || existingHerder.status === 'under_review';
        return errorJson(pending ? 'Таны хүсэлт хянагдаж байна' : 'Та аль хэдийн малчнаар бүртгэлтэй байна', 409);
      }
      // Татгалзсан хүсэлтээ засаад дахин илгээнэ
      const updated = await prisma.herderShop.update({
        where: { id: existingHerder.id },
        data: { ...data, status: 'pending', rejectionReason: null, reviewedAt: null },
      });
      return json({ success: true, applicationId: updated.id, message: 'Хүсэлтийг дахин илгээлээ. Координатор 24-48 цагт хянана.' }, 201);
    }

    // Энгийн дэлгүүрийг малчных болгохгүйн тулд тусдаа дэлгүүр үүсгэнэ
    {
      const shop = await prisma.shop.create({
        data: {
          userId: auth.id,
          name: `${herderName} — Малчин`,
          slug: `herder-${Date.now().toString(36)}-${auth.id.slice(-6).toLowerCase()}`,
          phone: phone || undefined,
          address: `${province.name}, ${district}`,
          industry: 'herder',
        },
      });
      const herderShop = await prisma.herderShop.create({ data: { shopId: shop.id, ...data, status: 'pending' } });
      return json({ success: true, applicationId: herderShop.id, message: 'Хүсэлт илгээлээ. Координатор 24-48 цагт хянана.' }, 201);
    }
  } catch (err) {
    console.error('[herder/register]', err);
    return errorJson('Малчны бүртгэл амжилтгүй боллоо', 500);
  }
}
