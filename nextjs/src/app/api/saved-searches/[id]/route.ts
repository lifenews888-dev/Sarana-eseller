import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';

// DELETE /api/saved-searches/:id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) return errorJson('Буруу ID', 400);
  const r = await prisma.savedSearch.deleteMany({ where: { id, userId: auth.id } });
  return r.count ? json({ deleted: true }) : errorJson('Олдсонгүй', 404);
}
