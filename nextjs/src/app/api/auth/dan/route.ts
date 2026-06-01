import { NextRequest, NextResponse } from 'next/server';
import { getAuthURL } from '@/lib/dan';
import { safeRelativeRedirect } from '@/lib/safe-redirect';

export async function GET(request: NextRequest) {
  const state = crypto.randomUUID();
  const redirectTarget = safeRelativeRedirect(
    request.nextUrl.searchParams.get('redirect') || request.nextUrl.searchParams.get('next'),
  );

  // In production, store state in session/cookie for CSRF protection
  const url = getAuthURL(state);

  const response = NextResponse.redirect(url);
  response.cookies.set('dan_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  if (redirectTarget) {
    response.cookies.set('dan_oauth_redirect', redirectTarget, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });
  }

  return response;
}
