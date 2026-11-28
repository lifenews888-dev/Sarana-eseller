import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { ok, fail } from '@/lib/api-envelope';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  if (checkRateLimit(req).limited) {
    return Response.json({ success: false, error: 'Хэт олон хүсэлт. Түр хүлээгээд дахин оролдоно уу.' }, { status: 429 });
  }
  try {
    const { token, password } = await req.json();

    if (typeof token !== 'string' || typeof password !== 'string' || !token || !password) return fail('Token болон нууц үг шаардлагатай', 400);
    if (password.length < 6) return fail('Нууц үг хамгийн бага 6 тэмдэгт', 400);

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!resetToken) return fail('Буруу эсвэл хүчингүй линк', 400);
    if (resetToken.usedAt) return fail('Энэ линк аль хэдийн ашиглагдсан', 400);
    if (new Date() > resetToken.expiresAt) return fail('Линкийн хугацаа дууссан', 400);

    // Линкийг нэг л удаа ашиглана (зэрэг хүсэлтэд давхар хэрэглэгдэхгүй)
    const claimed = await prisma.passwordResetToken.updateMany({ where: { token, usedAt: null }, data: { usedAt: new Date() } });
    if (claimed.count === 0) return fail('Энэ линк аль хэдийн ашиглагдсан', 400);

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    });

    return ok({ message: 'Нууц үг амжилттай шинэчлэгдлээ!' });
  } catch {
    return fail('Алдаа гарлаа', 500);
  }
}
