import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api-envelope';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/api-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { consumeMobileAuthCode } from '@/lib/mobileAuthHandoff';

// POST /api/auth/mobile-exchange { code } — Google/ДАН-аас апп руу ирсэн нэг удаагийн кодыг токен болгоно
export async function POST(req: NextRequest) {
  if (checkRateLimit(req).limited) return fail('Хэт олон оролдлого. Түр хүлээнэ үү.', 429);
  const body = await req.json().catch(() => ({}));
  const userId = await consumeMobileAuthCode(typeof body.code === 'string' ? body.code : '');
  if (!userId) return fail('Нэвтрэх код хүчингүй эсвэл хугацаа дууссан. Дахин оролдоно уу.', 401);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return fail('Хэрэглэгч олдсонгүй', 404);

  const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name, entityType: user.entityType });
  return ok({
    token,
    user: {
      _id: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      username: user.username,
      avatar: user.avatar,
      entityType: user.entityType,
    },
  });
}
