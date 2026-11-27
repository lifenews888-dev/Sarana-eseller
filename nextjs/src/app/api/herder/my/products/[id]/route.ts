import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { json, errorJson, requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { getMyHerderShop, toMyHerderProduct } from '@/lib/herder';
import { parseHerderProductInput } from '@/lib/herderProductInput';

type Ctx = { params: Promise<{ id: string }> };

async function loadOwned(req: NextRequest, ctx: Ctx) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return { error: auth };
  const { id } = await ctx.params;
  const herder = await getMyHerderShop(auth.id);
  if (!herder) return { error: errorJson('Малчны бүртгэл олдсонгүй', 404) };
  if (!/^[a-f\d]{24}$/i.test(id)) return { error: errorJson('Бүтээгдэхүүн олдсонгүй', 404) };
  const product = await prisma.product.findFirst({ where: { id, shopId: herder.shopId } });
  if (!product) return { error: errorJson('Бүтээгдэхүүн олдсонгүй', 404) };
  return { herder, product };
}

// PUT /api/herder/my/products/[id]
export async function PUT(req: NextRequest, ctx: Ctx) {
  const loaded = await loadOwned(req, ctx);
  if ('error' in loaded) return loaded.error;
  const { herder, product } = loaded;

  const body = await req.json().catch(() => ({}));
  const parsed = parseHerderProductInput(body, true);
  if ('error' in parsed) return errorJson(parsed.error);
  const { requiresColdChain, ...fields } = parsed.data;

  const meta = product.metadata && typeof product.metadata === 'object' && !Array.isArray(product.metadata)
    ? (product.metadata as Record<string, unknown>)
    : {};
  const updated = await prisma.product.update({
    where: { id: product.id },
    data: {
      ...(fields as Prisma.ProductUncheckedUpdateInput),
      ...(typeof body.isActive === 'boolean' ? { isActive: body.isActive } : {}),
      ...(requiresColdChain !== undefined ? { metadata: { ...meta, requiresColdChain } } : {}),
    },
  });
  return json(toMyHerderProduct(updated, herder));
}

// DELETE /api/herder/my/products/[id] — захиалгын түүх хадгалагдахын тулд идэвхгүй болгоно
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const loaded = await loadOwned(req, ctx);
  if ('error' in loaded) return loaded.error;
  await prisma.product.update({ where: { id: loaded.product.id }, data: { isActive: false } });
  return json({ success: true });
}
