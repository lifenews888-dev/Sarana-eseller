import { NextRequest, NextResponse } from 'next/server';
import { requireAdminDB } from '@/lib/api-auth';
import { getModerationSettings, saveModerationSettings } from '@/lib/chatModeration';

// GET/PUT /api/admin/chat-moderation — зарын чатын spam шүүлтийн тохиргоо
export async function GET(req: NextRequest) {
  const admin = await requireAdminDB(req);
  if (admin instanceof NextResponse) return admin;
  return NextResponse.json(await getModerationSettings());
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdminDB(req);
  if (admin instanceof NextResponse) return admin;
  const body = await req.json().catch(() => ({}));
  try {
    return NextResponse.json(await saveModerationSettings(body));
  } catch {
    return NextResponse.json({ error: 'Хадгалж чадсангүй' }, { status: 500 });
  }
}
