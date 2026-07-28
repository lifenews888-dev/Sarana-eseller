// ══════════════════════════════════════════════════════════════
// eseller.mn — Referral Tracking System
// ══════════════════════════════════════════════════════════════

const SKEY = 'eseller_ref';
const CNAME = 'eseller_ref';
const TTL = 30 * 24 * 60 * 60; // 30 days

export const Ref = {
  capture() {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (!ref) return;

    sessionStorage.setItem(SKEY, ref);
    localStorage.setItem(SKEY, ref);
    document.cookie = `${CNAME}=${encodeURIComponent(ref)};path=/;max-age=${TTL};SameSite=Lax`;

    // Track click silently (same-origin Next API)
    fetch('/api/affiliate/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        referralCode: ref,
        page: window.location.pathname,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});

    // Clean URL
    params.delete('ref');
    const clean = params.toString();
    const newUrl = window.location.pathname + (clean ? '?' + clean : '') + window.location.hash;
    window.history.replaceState(null, '', newUrl);
  },

  get(): string | null {
    if (typeof window === 'undefined') return null;
    return (
      sessionStorage.getItem(SKEY) ||
      localStorage.getItem(SKEY) ||
      getCookie()
    );
  },

  has(): boolean {
    return !!this.get();
  },

  clear() {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(SKEY);
    localStorage.removeItem(SKEY);
    document.cookie = `${CNAME}=;path=/;max-age=0`;
  },
};

function getCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + CNAME + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}
