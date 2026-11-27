import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api-envelope';
import { issuePhoneOtp, normalizeMnPhone } from '@/lib/phoneOtp';

// POST /api/auth/otp/send { phone, purpose?: 'register' | 'login' }
// Өмнө нь код зөвхөн логт бичигдэж, дугаар бүрт хуурамч хэрэглэгч үүсгэдэг байсан.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const phone = normalizeMnPhone(body?.phone);
  if (!phone) return fail('Утасны дугаар буруу байна (8 оронтой)', 400);
  const purpose = body?.purpose === 'register' ? 'register' : 'login';

  const r = await issuePhoneOtp(phone, purpose);
  if (!r.ok) return fail(r.error, r.status);
  return ok({ message: 'Код илгээгдлээ', ...(r.devCode ? { code: r.devCode } : {}) });
}
