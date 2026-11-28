import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/api-auth';
import { ok, fail } from '@/lib/api-envelope';
import { normalizeMnPhone, verifyPhoneOtp } from '@/lib/phoneOtp';
import { checkRateLimit } from '@/lib/rate-limit';

// POST /api/auth/otp/verify { phone, code } — утасны кодоор нэвтрэх (бүртгэлтэй хэрэглэгч)
export async function POST(req: NextRequest) {
  if (checkRateLimit(req).limited) {
    return Response.json({ success: false, error: 'Хэт олон хүсэлт. Түр хүлээгээд дахин оролдоно уу.' }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const phone = normalizeMnPhone(body?.phone);
  if (!phone || !body?.code) return fail('Утас, код оруулна уу', 400);

  const user = await prisma.user.findFirst({ where: { phone } });
  if (!user) return fail('Энэ дугаараар бүртгэл олдсонгүй', 404);

  const v = await verifyPhoneOtp(phone, 'login', String(body.code));
  if (!v.ok) return fail(v.error, 400);

  const token = signToken({ id: user.id, role: user.role });
  return ok({
    token,
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
  });
}
