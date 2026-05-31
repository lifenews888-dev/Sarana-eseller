import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'sarana-eseller',
    timestamp: new Date().toISOString(),
  });
}
