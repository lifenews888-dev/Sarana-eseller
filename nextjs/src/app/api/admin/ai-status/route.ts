import { NextRequest, NextResponse } from 'next/server';
import { requireAdminDB } from '@/lib/api-auth';

// GET /api/admin/ai-status — ANTHROPIC_API_KEY ажиллаж байгаа эсэхийг шалгана (түлхүүрийг өөрийг нь харуулахгүй)
export async function GET(req: NextRequest) {
  const admin = await requireAdminDB(req);
  if (admin instanceof NextResponse) return admin;

  const key = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
  if (!key) return NextResponse.json({ configured: false, ok: false, model, note: 'ANTHROPIC_API_KEY тохируулаагүй — туслах бот бэлэн хариугаар ажиллана' });

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: 5, messages: [{ role: 'user', content: 'ping' }] }),
    });
    const data = await res.json().catch(() => null);
    return NextResponse.json({
      configured: true,
      ok: res.ok,
      status: res.status,
      model,
      error: res.ok ? null : { type: data?.error?.type, message: data?.error?.message },
    });
  } catch (e) {
    return NextResponse.json({ configured: true, ok: false, model, error: { message: e instanceof Error ? e.message : 'network' } });
  }
}
