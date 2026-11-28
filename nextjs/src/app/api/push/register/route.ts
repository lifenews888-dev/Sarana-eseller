import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

// POST /api/push/register — Web Push or Expo Push token
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();

    // Web Push subscription (object with endpoint)
    if (body.endpoint) {
      await prisma.pushSubscription.upsert({
        where: { userId_endpoint: { userId: auth.id, endpoint: body.endpoint } },
        create: { userId: auth.id, subscription: JSON.stringify(body), endpoint: body.endpoint, type: 'WEB' },
        update: { subscription: JSON.stringify(body) },
      });
      return NextResponse.json({ success: true, type: 'WEB' });
    }

    // Expo Push token (mobile app)
    if (body.token && body.platform) {
      const type = body.platform === 'ios' ? 'EXPO_IOS' : 'EXPO_ANDROID';
      await prisma.pushSubscription.upsert({
        where: { userId_endpoint: { userId: auth.id, endpoint: body.token } },
        create: { userId: auth.id, endpoint: body.token, type, subscription: JSON.stringify(body) },
        update: { subscription: JSON.stringify(body), type },
      });
      // Нэг утас нэг л хэрэглэгчид мэдэгдэл авна: өмнө нь энэ утсаар нэвтэрсэн хүмүүсээс токеныг салгана
      await prisma.user.updateMany({
        where: { pushToken: body.token, NOT: { id: auth.id } },
        data: { pushToken: null },
      });
      await prisma.pushSubscription.deleteMany({ where: { endpoint: body.token, NOT: { userId: auth.id } } });
      // Also write to User.pushToken so sendExpoPush() can find it
      await prisma.user.update({
        where: { id: auth.id },
        data: { pushToken: body.token },
      });
      return NextResponse.json({ success: true, type });
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  } catch (e) {
    // PushSubscription model байхгүй бол fallback
    return NextResponse.json({ success: true, note: 'push registration skipped' });
  }
}
