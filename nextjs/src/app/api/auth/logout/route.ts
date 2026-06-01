import { ok } from '@/lib/api-envelope';

// Clear the httpOnly auth-token cookie used by Edge middleware role
// enforcement. Client-side localStorage is cleared separately in
// AuthProvider.logout(). Kept POST-only so CSRF-style GET navigations
// don't accidentally sign the user out.
export async function POST() {
  const res = ok({ ok: true });
  res.cookies.delete('auth-token');
  res.cookies.delete('token');
  res.cookies.delete('dan_user_id');
  res.cookies.delete('dan_oauth_state');
  res.cookies.delete('dan_oauth_redirect');
  res.cookies.delete('google_oauth_state');
  res.cookies.delete('google_oauth_redirect');
  return res;
}
