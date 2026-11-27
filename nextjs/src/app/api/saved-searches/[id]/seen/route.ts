import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';

// POST /api/saved-searches/:id/seen — шинэ зарын тоог тэглэнэ (хэрэглэгч хайлтаа нээсэн)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) return errorJson('Буруу ID', 400);
  await prisma.savedSearch.updateMany({ where: { id, userId: auth.id }, data: { lastSeenAt: new Date() } });
  return json({ ok: true });
}
