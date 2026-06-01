import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exchangeCode, getUserInfo } from '@/lib/dan';
import { safeRelativeRedirect } from '@/lib/safe-redirect';
import crypto from 'crypto';

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

    // In production, create a session/JWT here
    // For now, redirect with userId
    const dashboardUrl = new URL(redirectTarget || '/dashboard', request.url);
    dashboardUrl.searchParams.set('userId', user.id);

    const response = NextResponse.redirect(dashboardUrl);
    response.cookies.delete('dan_oauth_state');
    response.cookies.delete('dan_oauth_redirect');

    // Set a basic auth cookie (replace with proper JWT in production)
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
