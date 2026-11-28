import { NextRequest, NextResponse } from 'next/server';
import { releaseDueEscrows } from '@/lib/escrow';

// Хүргэгдээд 72 цаг өнгөрсөн, гомдолгүй захиалгын төлбөрийг дэлгүүрт шилжүүлнэ
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    return NextResponse.json(await releaseDueEscrows());
  } catch (e) {
    console.error('[cron/escrow-release]', e);
    return NextResponse.json({ error: 'Cron алдаа' }, { status: 500 });
  }
}
