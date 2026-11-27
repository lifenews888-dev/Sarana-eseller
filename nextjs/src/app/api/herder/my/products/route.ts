import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { json, errorJson, requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { getMyHerderShop, isActiveHerder, pageParams, pagesFor, toMyHerderProduct } from '@/lib/herder';
import { parseHerderProductInput } from '@/lib/herderProductInput';

// GET /api/herder/my/products?status=active|all&page&limit
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const herder = await getMyHerderShop(auth.id);
  if (!herder) return errorJson('Малчны бүртгэл олдсонгүй', 404);

  const sp = req.nextUrl.searchParams;
  const { page, limit, skip } = pageParams(sp);
  const where: Prisma.ProductWhereInput = { shopId: herder.shopId };
  if (sp.get('status') !== 'all') where.isActive = true;

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.product.count({ where }),
  ]);
  return json({ products: products.map((p) => toMyHerderProduct(p, herder)), total, page, pages: pagesFor(total, limit) });
}

// POST /api/herder/my/products — зөвхөн баталгаажсан малчин
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const herder = await getMyHerderShop(auth.id);
  if (!herder) return errorJson('Малчны бүртгэл олдсонгүй', 404);
  if (!isActiveHerder(herder)) return errorJson('Бүртгэл баталгаажсаны дараа бүтээгдэхүүн нэмнэ', 403);

  const parsed = parseHerderProductInput(await req.json().catch(() => ({})), false);
  if ('error' in parsed) return errorJson(parsed.error);
  const { requiresColdChain, ...fields } = parsed.data;

  const product = await prisma.product.create({
    data: {
      ...(fields as Prisma.ProductUncheckedCreateInput),
      name: String(fields.name),
      price: Number(fields.price),
      userId: auth.id,
      shopId: herder.shopId,
      isActive: true,
      entityType: 'STORE',
      metadata: { herder: true, ...(requiresColdChain !== undefined ? { requiresColdChain } : {}) },
    },
  });
  return json(toMyHerderProduct(product, herder), 201);
}
