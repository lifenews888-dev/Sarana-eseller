import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireAuth } from '@/lib/api-auth';
import { isValidPublicImageUrl } from '@/lib/image-url';

// GET /api/admin/banners?status=&slot=&search=&page=1&limit=10
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  if (auth.role !== 'admin' && auth.role !== 'superadmin') return errorJson('Админ эрх шаардлагатай', 403);

  try {
    const sp = req.nextUrl.searchParams;
    const status = sp.get('status');
    const slot = sp.get('slot');
    const search = sp.get('search');
    const page = Math.max(1, Number(sp.get('page') || '1'));
    const limit = Math.min(50, Number(sp.get('limit') || '10'));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (slot) where.slot = slot;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { refId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [banners, total] = await Promise.all([
      prisma.banner.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.banner.count({ where }),
    ]);

    return json({ banners, total, page, pages: Math.ceil(total / limit) });
  } catch (e: unknown) {
    return errorJson((e as Error).message, 500);
  }
}

// POST /api/admin/banners
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  if (auth.role !== 'admin' && auth.role !== 'superadmin') return errorJson('Админ эрх шаардлагатай', 403);

  try {
    const body = await req.json();
    const { title, slot, imageUrl, linkUrl, startsAt, endsAt, ...rest } = body;
    if (!title || !slot || !imageUrl || !linkUrl || !startsAt || !endsAt) {
      return errorJson('title, slot, imageUrl, linkUrl, startsAt, endsAt шаардлагатай');
    }
    if (!isValidPublicImageUrl(imageUrl)) {
      return errorJson('imageUrl must be a public URL', 400);
    }

    // Auto refId: BNR-YYMM-XXXX
    const now = new Date();
    const prefix = `BNR-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const last = await prisma.banner.findFirst({
      where: { refId: { startsWith: prefix } },
      orderBy: { refId: 'desc' },
    });
    const seq = last ? Number(last.refId.split('-')[2]) + 1 : 1;
    const refId = `${prefix}-${String(seq).padStart(4, '0')}`;

    const banner = await prisma.banner.create({
      data: {
        refId,
        title,
        slot,
        imageUrl,
        linkUrl,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        createdById: auth.id,
        ...rest,
      },
    });

    return json(banner, 201);
  } catch (e: unknown) {
    return errorJson((e as Error).message, 500);
  }
}
