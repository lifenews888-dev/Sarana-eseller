import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exchangeCode, getUserInfo } from '@/lib/dan';
import { safeRelativeRedirect } from '@/lib/safe-redirect';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'eseller-jwt-secret-key-change-in-production-2026';

function getDanFallbackEmail(registerNumber: string, phone: string): string {
  const stableId = (registerNumber || phone).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `dan-${stableId || crypto.randomBytes(6).toString('hex')}@eseller.mn`;
}

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');
    const error = request.nextUrl.searchParams.get('error');
    const state = request.nextUrl.searchParams.get('state');
    const redirectTarget = safeRelativeRedirect(request.cookies.get('dan_oauth_redirect')?.value);
    const storedState = request.cookies.get('dan_oauth_state')?.value;

    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=dan_${error}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/login?error=dan_no_code', request.url)
      );
    }

    if (!state || state !== storedState) {
      return NextResponse.redirect(
        new URL('/login?error=dan_invalid_state', request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCode(code);

    // Get user info from ДАН
    const danUser = await getUserInfo(tokens.access_token);

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: danUser.phone },
          ...(danUser.email ? [{ email: danUser.email }] : []),
        ],
      },
    });

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(randomPassword, 12);
      const email = danUser.email || getDanFallbackEmail(danUser.register_number, danUser.phone);

      user = await prisma.user.create({
        data: {
          name: `${danUser.last_name} ${danUser.first_name}`,
          phone: danUser.phone,
          email,
          password: hashedPassword,
          role: 'buyer',
          username: email.split('@')[0],
        },
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, entityType: user.entityType },
      JWT_SECRET,
      { expiresIn: '30d' },
    );

    const userData = {
      _id: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      username: user.username,
      avatar: user.avatar,
      entityType: user.entityType,
    };

    const redirectUrl = new URL('/login', request.url);
    if (redirectTarget) redirectUrl.searchParams.set('redirect', redirectTarget);
    redirectUrl.hash = `google_auth=${encodeURIComponent(JSON.stringify({ token, user: userData }))}`;

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete('dan_oauth_state');
    response.cookies.delete('dan_oauth_redirect');

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });
    response.cookies.set('dan_user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: unknown) {
    console.error('ДАН callback алдаа:', error);
    return NextResponse.redirect(
      new URL('/login?error=dan_failed', request.url)
    );
  }
}
