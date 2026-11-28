import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson } from '@/lib/api-auth';
import { requireProductOwner } from '@/lib/productOwnership';

type Ctx = { params: Promise<{ id: string; groupId: string; optionId: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id, groupId, optionId } = await ctx.params;
  const owner = await requireProductOwner(req, id);
  if ('error' in owner) return owner.error;
  const groupOk = await prisma.modifierGroup.findFirst({ where: { id: groupId, productId: id }, select: { id: true } });
  const optionOk = groupOk && await prisma.modifierOption.findFirst({ where: { id: optionId, groupId }, select: { id: true } });
  if (!optionOk) return errorJson('Сонголт олдсонгүй', 404);
  const body = await req.json();
  const option = await prisma.modifierOption.update({
    where: { id: optionId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.price !== undefined && { price: Number(body.price) }),
      ...(body.available !== undefined && { available: body.available }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    },
  });
  return json(option);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { id, groupId, optionId } = await ctx.params;
  const owner = await requireProductOwner(req, id);
  if ('error' in owner) return owner.error;
  const groupOk = await prisma.modifierGroup.findFirst({ where: { id: groupId, productId: id }, select: { id: true } });
  const optionOk = groupOk && await prisma.modifierOption.findFirst({ where: { id: optionId, groupId }, select: { id: true } });
  if (!optionOk) return errorJson('Сонголт олдсонгүй', 404);
  await prisma.modifierOption.delete({ where: { id: optionId } });
  return json({ deleted: true });
}
