import { requireAdmin } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { goldService } from '@/lib/loyalty/GoldService';

export async function POST(req: NextRequest) {
  // Аюулгүй байдал: зөвхөн админ (өмнө нь нэвтрэлтгүй дуудагдах боломжтой байсан)
  const adminUser = requireAdmin(req);
  if (adminUser instanceof NextResponse) return adminUser;
  try {
    const { userId, plan, paymentId } = await req.json();
    if (!userId || !plan) return NextResponse.json({ error: 'userId and plan required' }, { status: 400 });

    const membership = await goldService.activate(userId, plan, paymentId || 'demo');
    return NextResponse.json({ membership, message: 'Gold гишүүнчлэл идэвхжлээ!' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
