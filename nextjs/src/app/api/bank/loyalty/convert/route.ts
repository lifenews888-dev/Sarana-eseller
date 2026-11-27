import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { convertBankPoints, type BankName } from '@/lib/bank-loyalty';

// POST /api/bank/loyalty/convert — convert bank points to eseller points
export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { bank, cardNumber, points } = await req.json();
  if (!bank || !cardNumber || !points || points <= 0) {
    return errorJson('bank, cardNumber, points (>0) шаардлагатай');
  }

  try {
    const result = await convertBankPoints(user.id, bank as BankName, points, cardNumber);
    return json({
      message: `${points} ${bank} оноо → ${result.esellerPoints} eseller оноо болголоо!`,
      esellerPoints: result.esellerPoints,
    });
  } catch (err: unknown) {
    return errorJson((err instanceof Error ? err.message : String(err)) || 'Хөрвүүлэхэд алдаа гарлаа', 500);
  }
}
