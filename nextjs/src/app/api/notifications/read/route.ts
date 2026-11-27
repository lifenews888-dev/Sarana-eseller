import { NextRequest, NextResponse } from 'next/server';
import { json, requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

// POST /api/notifications/read { ids?: string[] } — ids байхгүй бол бүгдийг уншсан болгоно
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => ({}));
  const ids = Array.isArray(body.ids)
    ? body.ids.filter((id: unknown): id is string => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id)).slice(0, 100)
    : null;

  const result = await prisma.userNotification.updateMany({
    where: { userId: auth.id, readAt: null, ...(ids ? { id: { in: ids } } : {}) },
    data: { readAt: new Date() },
  });
  return json({ updated: result.count });
}
