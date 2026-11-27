import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendSms, isSmsConfigured } from '@/lib/smsGateway';

const TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

export function normalizeMnPhone(raw: unknown): string | null {
  const d = String(raw || '').replace(/[\s-]/g, '').replace(/^\+?976/, '');
  return /^[6-9]\d{7}$/.test(d) ? d : null;
}

function hash(phone: string, code: string) {
  const secret = process.env.JWT_SECRET || 'eseller-otp';
  return crypto.createHmac('sha256', secret).update(`${phone}:${code}`).digest('hex');
}

export type IssueResult = { ok: true; devCode?: string } | { ok: false; status: number; error: string };

/** Код үүсгэж SMS-ээр илгээнэ. */
export async function issuePhoneOtp(phone: string, purpose: 'register' | 'login'): Promise<IssueResult> {
  const last = await prisma.phoneOtp.findFirst({ where: { phone, purpose }, orderBy: { createdAt: 'desc' } });
  if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    return { ok: false, status: 429, error: 'Кодыг 1 минутын дараа дахин авна уу' };
  }
  const code = crypto.randomInt(100000, 1000000).toString();
  const isDev = process.env.NODE_ENV === 'development';
  if (!isSmsConfigured() && !isDev) {
    return { ok: false, status: 503, error: 'SMS үйлчилгээ түр ажиллахгүй байна' };
  }
  await prisma.phoneOtp.deleteMany({ where: { phone, purpose } });
  await prisma.phoneOtp.create({ data: { phone, purpose, codeHash: hash(phone, code), expiresAt: new Date(Date.now() + TTL_MS) } });

  if (isSmsConfigured()) {
    const sent = await sendSms(phone, `eseller.mn баталгаажуулах код: ${code}. 5 минут хүчинтэй.`);
    if (!sent.ok) {
      console.error('[otp] SMS failed:', sent.error);
      return { ok: false, status: 502, error: 'SMS илгээж чадсангүй. Дахин оролдоно уу.' };
    }
    return { ok: true };
  }
  return { ok: true, devCode: code };
}

/** Кодыг шалгана. Амжилттай бол кодыг устгана. 5 удаа буруу оруулбал хүчингүй болно. */
export async function verifyPhoneOtp(phone: string, purpose: 'register' | 'login', code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const rec = await prisma.phoneOtp.findFirst({ where: { phone, purpose }, orderBy: { createdAt: 'desc' } });
  if (!rec || rec.expiresAt < new Date()) return { ok: false, error: 'Код хүчингүй эсвэл хугацаа дууссан. Шинэ код авна уу.' };
  if (rec.attempts >= MAX_ATTEMPTS) return { ok: false, error: 'Хэт олон буруу оролдлого. Шинэ код авна уу.' };
  const a = Buffer.from(rec.codeHash);
  const b = Buffer.from(hash(phone, String(code || '').trim()));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    await prisma.phoneOtp.update({ where: { id: rec.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, error: 'Код буруу байна' };
  }
  await prisma.phoneOtp.deleteMany({ where: { phone, purpose } });
  return { ok: true };
}
