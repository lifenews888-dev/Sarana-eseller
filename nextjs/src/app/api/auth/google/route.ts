import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { fail } from '@/lib/api-envelope';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const VALID_ROLES = ['seller', 'affiliate', 'buyer', 'delivery'];

function safeRelativePath(target: string | null): string {
  return target && target.startsWith('/') && !target.startsWith('//') ? target : '';
}

export async function GET(req: NextRequest) {
  if (!GOOGLE_CLIENT_ID) {
    return fail('Google OAuth тохиргоо дутуу', 500);
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://eseller.mn';
  const nonce = crypto.randomBytes(16).toString('hex');

  // Role from query param (e.g. /api/auth/google?role=seller)
  const role = req.nextUrl.searchParams.get('role');
  const safeRole = role && VALID_ROLES.includes(role) ? role : 'buyer';
  const redirectTarget = safeRelativePath(
    req.nextUrl.searchParams.get('redirect') || req.nextUrl.searchParams.get('next'),
  );

  // Encode nonce + role into state
  const state = `${nonce}:${safeRole}`;

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${baseUrl}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'consent',
  });

  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  res.cookies.set('google_oauth_state', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  if (redirectTarget) {
    res.cookies.set('google_oauth_redirect', redirectTarget, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });
  }

  return res;
}
