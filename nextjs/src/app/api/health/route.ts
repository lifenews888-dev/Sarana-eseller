import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'sarana-eseller',
    checks: {
      uploadStorage: {
        configured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      },
    },
    timestamp: new Date().toISOString(),
  });
}
