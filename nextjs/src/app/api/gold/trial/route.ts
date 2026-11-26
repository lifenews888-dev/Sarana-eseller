import { requireAuth } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { goldService } from '@/lib/loyalty/GoldService';

export async function POST(req: NextRequest) {
  try {
    // Аюулгүй байдал: userId-г body-оос биш, нэвтэрсэн хэрэглэгчийн токеноос авна
    const authUser = requireAuth(req);
    if (authUser instanceof NextResponse) return authUser;
    const userId = authUser.id;

    const membership = await goldService.startTrial(userId);
    return NextResponse.json({ membership, message: '30 хоногийн үнэгүй туршилт эхэллээ!' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
