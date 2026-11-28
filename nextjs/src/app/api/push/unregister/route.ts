import { NextRequest, NextResponse } from 'next/server';
import { json, requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

// POST /api/push/unregister — апп-аас гарахад энэ хэрэглэгчийн утасны мэдэгдлийг зогсооно
// (дараагийн хүн тухайн утсаар нэвтэрсэн ч өмнөх хүний мэдэгдэл ирэхгүй)
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === 'string' ? body.token : '';

  await prisma.user.updateMany({
    where: { id: auth.id, ...(token ? { pushToken: token } : {}) },
    data: { pushToken: null },
  });
  await prisma.pushSubscription
    .deleteMany({
      where: { userId: auth.id, ...(token ? { endpoint: token } : { type: { in: ['EXPO_IOS', 'EXPO_ANDROID'] } }) },
    })
    .catch(() => null);
  return json({ ok: true });
}
