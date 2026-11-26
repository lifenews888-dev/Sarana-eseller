import { NextRequest, NextResponse } from 'next/server';

// GET /api/affiliate/track?code=abc123 — хуучин холбоос; /r/:code руу шилжүүлнэ.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code') || '';
  return NextResponse.redirect(`${req.nextUrl.origin}/r/${encodeURIComponent(code)}`, 302);
}
