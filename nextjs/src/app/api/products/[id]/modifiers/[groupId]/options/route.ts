import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson } from '@/lib/api-auth';
import { requireProductOwner } from '@/lib/productOwnership';

type Ctx = { params: Promise<{ id: string; groupId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id, groupId } = await ctx.params;
  const owner = await requireProductOwner(req, id);
  if ('error' in owner) return owner.error;
  const groupOk = await prisma.modifierGroup.findFirst({ where: { id: groupId, productId: id }, select: { id: true } });
  if (!groupOk) return errorJson('Сонголтын бүлэг олдсонгүй', 404);
  const { name, price } = await req.json();
  if (!name) return errorJson('Нэр шаардлагатай');

  const count = await prisma.modifierOption.count({ where: { groupId } });
  const option = await prisma.modifierOption.create({
    data: { groupId, name, price: Number(price) || 0, sortOrder: count },
  });
  return json(option, 201);
}
