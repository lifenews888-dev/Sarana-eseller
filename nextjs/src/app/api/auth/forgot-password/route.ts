import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendEmail, buildEmailTemplate } from '@/lib/marketing/EmailService';
import { ok, fail } from '@/lib/api-envelope';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  if (checkRateLimit(req).limited) {
    return Response.json({ success: false, error: 'Хэт олон хүсэлт. Түр хүлээгээд дахин оролдоно уу.' }, { status: 429 });
  }
  try {
    const { email } = await req.json();
    if (!email) return fail('Email шаардлагатай', 400);

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success (don't reveal if email exists)
    if (!user) return ok({ message: 'Хэрэв бүртгэлтэй бол сэргээх линк илгээгдлээ' });

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { email, token, expiresAt },
    });

    // Send email
    const resetUrl = `${process.env.NEXT_PUBLIC_URL || 'https://eseller.mn'}/reset-password/${token}`;
    const html = buildEmailTemplate(
      'Нууц үг сэргээх',
      `<p>Та нууц үг сэргээх хүсэлт илгээсэн байна.</p>
       <p>Доорх товчийг дарж шинэ нууц үг тохируулна уу.</p>
       <p style="color:#888;font-size:12px">Энэ линк 1 цагийн дотор хүчинтэй.</p>`,
      resetUrl,
      'Нууц үг сэргээх →'
    );
    await sendEmail(email, 'Нууц үг сэргээх — eseller.mn', html);

    return ok({ message: 'Сэргээх линк илгээгдлээ! Имэйл шалгана уу.' });
  } catch {
    return fail('Алдаа гарлаа', 500);
  }
}
