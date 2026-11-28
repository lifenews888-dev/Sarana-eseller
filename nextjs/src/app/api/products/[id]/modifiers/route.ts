import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson } from '@/lib/api-auth';
import { requireProductOwner } from '@/lib/productOwnership';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/products/[id]/modifiers
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const groups = await prisma.modifierGroup.findMany({
    where: { productId: id },
    include: { options: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { sortOrder: 'asc' },
  });
  return json(groups);
}

// POST /api/products/[id]/modifiers
export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const owner = await requireProductOwner(req, id);
  if ('error' in owner) return owner.error;
  const { name, required, multiple } = await req.json();
  if (!name) return errorJson('Нэр шаардлагатай');

  const count = await prisma.modifierGroup.count({ where: { productId: id } });
  const group = await prisma.modifierGroup.create({
    data: { productId: id, name, required: !!required, multiple: !!multiple, sortOrder: count },
    include: { options: true },
  });
  return json(group, 201);
}
