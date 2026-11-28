import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson } from '@/lib/api-auth';
import { requireProductOwner } from '@/lib/productOwnership';

type Ctx = { params: Promise<{ id: string; groupId: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id, groupId } = await ctx.params;
  const owner = await requireProductOwner(req, id);
  if ('error' in owner) return owner.error;
  const groupOk = await prisma.modifierGroup.findFirst({ where: { id: groupId, productId: id }, select: { id: true } });
  if (!groupOk) return errorJson('Сонголтын бүлэг олдсонгүй', 404);
  const body = await req.json();
  const group = await prisma.modifierGroup.update({
    where: { id: groupId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.required !== undefined && { required: body.required }),
      ...(body.multiple !== undefined && { multiple: body.multiple }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    },
    include: { options: true },
  });
  return json(group);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { id, groupId } = await ctx.params;
  const owner = await requireProductOwner(req, id);
  if ('error' in owner) return owner.error;
  const groupOk = await prisma.modifierGroup.findFirst({ where: { id: groupId, productId: id }, select: { id: true } });
  if (!groupOk) return errorJson('Сонголтын бүлэг олдсонгүй', 404);
  await prisma.modifierGroup.delete({ where: { id: groupId } });
  return json({ deleted: true });
}
