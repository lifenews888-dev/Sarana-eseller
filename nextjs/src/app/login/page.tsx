'use client';

import { useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, roleHome } from '@/lib/auth';
import { AuthAPI, type AuthResponse } from '@/lib/api';
import { safeRelativeRedirect } from '@/lib/safe-redirect';
import EsellerLogo from '@/components/shared/EsellerLogo';
import MobileNav from '@/components/shared/MobileNav';
import { Store, Megaphone, ShoppingBag, Truck, AlertTriangle, CheckCircle, Hand, Rocket, Eye, EyeOff } from 'lucide-react';

const ROLES = [
  { value: 'seller', icon: Store, label: 'Дэлгүүр эзэн', desc: 'Бараагаа байршуулж зарлуул', badge: '70–85%', color: 'border-green-500/20' },
  { value: 'affiliate', icon: Megaphone, label: 'Борлуулагч', desc: 'Линкээр зарж комисс ол', badge: '10–20%', color: 'border-amber-500/20' },
  { value: 'buyer', icon: ShoppingBag, label: 'Худалдан авагч', desc: 'Бараа худалдаж авах', badge: 'Үнэгүй', color: 'border-blue-500/20' },
  { value: 'delivery', icon: Truck, label: 'Жолооч', desc: 'Захиалга хүргэж орлого ол', badge: 'Хүргэлт бүрт', color: 'border-cyan-500/20' },
];

type LoginEnvelope = Partial<AuthResponse> & {
  success?: boolean;
  data?: unknown;
};

function isAuthResponse(value: unknown): value is AuthResponse {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AuthResponse>;
  return typeof candidate.token === 'string' && Boolean(candidate.user);
}

function readRedirectTargetFromLocation(): string {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  const target = params.get('redirect') || params.get('next');
  return safeRelativeRedirect(target);
}

function buildAuthHref(path: string, params: Record<string, string | undefined>, redirectTarget: string): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  if (redirectTarget) search.set('redirect', redirectTarget);
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('buyer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState('');

  const { login, isLoggedIn, user } = useAuth();
  const router = useRouter();

  // Pull `?redirect=/some/path` or legacy `?next=/some/path` to preserve in-progress flows.
  const getRedirectTarget = useCallback((role?: string): string => {
    return redirectTarget || readRedirectTargetFromLocation() || roleHome(role);
  }, [redirectTarget]);

  useEffect(() => {
    if (isLoggedIn && user) router.replace(getRedirectTarget(user.role));
  }, [isLoggedIn, user, router, getRedirectTarget]);

  useEffect(() => {
    setRedirectTarget(readRedirectTargetFromLocation());

    if (window.location.hash === '#register') setMode('register');

    // Handle Google OAuth callback
    const hash = window.location.hash;
    if (hash.startsWith('#google_auth=')) {
      try {
        const data = JSON.parse(decodeURIComponent(hash.slice('#google_auth='.length)));
        if (data.token && data.user) {
          login(data.token, data.user);
          setSuccess('Google-ээр амжилттай нэвтэрлээ!');
          window.location.hash = '';
          setTimeout(() => router.push(getRedirectTarget(data.user.role)), 700);
        }
      } catch {}
    }

    // Handle Google OAuth errors
    const params = new URLSearchParams(window.location.search);
    const googleError = params.get('error');
    if (googleError) {
      const msgs: Record<string, string> = {
        google_denied: 'Google нэвтрэлтийг цуцаллаа',
        token_failed: 'Google токен авахад алдаа гарлаа',
        server_error: 'Серверийн алдаа гарлаа',
      };
      setError(msgs[googleError] || 'Google нэвтрэлтийн алдаа');
    }
  }, [getRedirectTarget, login, router]);

  const pwStrength = (v: string) => {
    if (!v) return { score: 0, label: '', color: '' };
    const strong = v.length >= 10 && /[A-Z]/.test(v) && /\d/.test(v);
    const med = v.length >= 6 && (/[A-Z]/.test(v) || /\d/.test(v));
    if (strong) return { score: 3, label: '— Хүчтэй', color: '#059669' };
    if (med) return { score: 2, label: '— Дунд', color: '#F59E0B' };
    return { score: 1, label: '— Сул', color: '#EF4444' };
  };

  const pw = pwStrength(password);

  const doLogin = async () => {
    if (!email || !password) { setError('Бүх талбарыг бөглөнө үү'); return; }
    setLoading(true); setError('');
    try {
      // Try Next.js API first (direct DB), then backend
      let data: AuthResponse | null = null;
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const json = await res.json() as LoginEnvelope;
        // New envelope: { success: true, data: { token, user } }
        // Legacy:       { token, user }
        // Express backend fallback uses AuthAPI.login below.
        if (json?.success && isAuthResponse(json.data)) data = json.data;
        else if (isAuthResponse(json)) data = json;
      } catch {}

      if (!data) {
        data = await AuthAPI.login(email, password);
      }

      if (data?.token) {
        login(data.token, data.user);
        setSuccess('Амжилттай нэвтэрлээ!');
        setTimeout(() => router.push(getRedirectTarget(data.user.role)), 700);
      } else {
        setError('Имэйл эсвэл нууц үг буруу');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Холболтын алдаа');
    } finally { setLoading(false); }
  };

  const doRegister = async () => {
    if (!name || !email || !password) { setError('Бүх талбарыг бөглөнө үү'); return; }
    if (password.length < 6) { setError('Нууц үг дор хаяж 6 тэмдэгт'); return; }
    setLoading(true); setError('');
    try {
      const data = await AuthAPI.register(name, email, password, role);
      if (data.token) {
        login(data.token, data.user);
        setSuccess('Бүртгэл амжилттай!');
        setTimeout(() => router.push(getRedirectTarget(data.user.role)), 700);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Холболтын алдаа');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL - Desktop only */}
      <div
        className="hidden lg:flex flex-col justify-between w-[48%] p-10 relative overflow-hidden"
        style={{ background: 'var(--esl-bg-page)', color: 'var(--esl-text-primary)' }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-[30%] left-[20%] w-[300px] h-[300px] rounded-full bg-brand/8 blur-[100px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[200px] h-[200px] rounded-full bg-blue-600/6 blur-[80px]" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 no-underline mb-12">
            <EsellerLogo size={26} />
            <span className="text-xl font-black" style={{ color: 'var(--esl-text-primary)' }}>eseller<em className="text-brand not-italic">.mn</em></span>
          </Link>

          <h2 className="text-4xl font-black leading-[1.1] mb-4">
            Борлуулалт<br /><em className="text-brand not-italic">хамтдаа л байна.</em>
          </h2>
          <p className="text-sm leading-relaxed max-w-sm" style={{ color: 'var(--esl-text-muted)' }}>
            Барааны эзэн дангаараа борлуулж чадахгүй. Борлуулагчтай нэгдэж, хамтдаа ашиг ол.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          {[
            { ic: Store, t: 'Дэлгүүр эзэн', d: 'Бараагаа байршуул.', earn: '70–85%' },
            { ic: Megaphone, t: 'Борлуулагч', d: 'Сүлжээгээр зарж комисс ол.', earn: '10–20%' },
            { ic: ShoppingBag, t: 'Худалдан авагч', d: 'Хамгийн сайн бараа, шилдэг үнэ.', earn: '2–4ц хүргэлт' },
            { ic: Truck, t: 'Жолооч', d: 'Цагаа тохируулж орлого ол.', earn: 'Хүргэлт бүрт' },
          ].map((r) => (
            <div key={r.t} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: 'var(--esl-bg-card)', border: '1px solid var(--esl-border)' }}>
              <r.ic className="w-5 h-5 shrink-0" style={{ color: 'var(--esl-text-primary)' }} />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold" style={{ color: 'var(--esl-text-primary)' }}>{r.t}</h4>
                <p className="text-xs" style={{ color: 'var(--esl-text-muted)' }}>{r.d}</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ color: 'var(--esl-text-muted)', background: 'var(--esl-bg-elevated)' }}>{r.earn}</span>
            </div>
          ))}
        </div>

        <p className="relative z-10 text-xs" style={{ color: 'var(--esl-text-muted)' }}>
          &copy; 2026 eseller.mn &middot; Улаанбаатар, Монгол
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center p-6" style={{ background: 'var(--esl-bg-page)' }}>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 no-underline mb-8 lg:hidden justify-center">
            <EsellerLogo size={24} />
            <span className="text-lg font-black" style={{ color: 'var(--esl-text-primary)' }}>eseller<em className="text-brand not-italic">.mn</em></span>
          </Link>

          {/* Tabs */}
          <div className="flex rounded-2xl p-1 shadow-sm mb-8" style={{ background: 'var(--esl-bg-card)', border: '1px solid var(--esl-border)' }}>
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-none cursor-pointer transition-all ${
                mode === 'login' ? 'bg-brand text-white shadow-md' : 'bg-transparent'
              }`}
              style={mode !== 'login' ? { color: 'var(--esl-text-muted)' } : undefined}
            >
              Нэвтрэх
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-none cursor-pointer transition-all ${
                mode === 'register' ? 'bg-brand text-white shadow-md' : 'bg-transparent'
              }`}
              style={mode !== 'register' ? { color: 'var(--esl-text-muted)' } : undefined}
            >
              Бүртгүүлэх
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm font-semibold px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-600 text-sm font-semibold px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" /> {success}
            </div>
          )}

          {mode === 'login' ? (
            <>
              <div className="text-xl font-black mb-1 flex items-center gap-2" style={{ color: 'var(--esl-text-primary)' }}>Сайн уу! <Hand className="w-5 h-5" /></div>
              <div className="text-sm mb-6" style={{ color: 'var(--esl-text-muted)' }}>Данс руугаа нэвтрэх</div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--esl-text-muted)' }}>Имэйл хаяг</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(204,0,0,.12)] transition"
                    style={{ border: '1.5px solid var(--esl-border)', background: 'var(--esl-bg-card)', color: 'var(--esl-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--esl-text-muted)' }}>Нууц үг</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(204,0,0,.12)] transition pr-12"
                      style={{ border: '1.5px solid var(--esl-border)', background: 'var(--esl-bg-card)', color: 'var(--esl-text-primary)' }}
                      onKeyDown={(e) => e.key === 'Enter' && doLogin()}
                    />
                    <button
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-sm"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff className="w-4 h-4" style={{ color: 'var(--esl-text-muted)' }} /> : <Eye className="w-4 h-4" style={{ color: 'var(--esl-text-muted)' }} />}
                    </button>
                  </div>
                  <div className="text-right">
                    <Link href="/forgot-password" className="text-xs font-semibold no-underline" style={{ color: 'var(--esl-text-muted)' }}>Нууц үг мартсан уу?</Link>
                  </div>
                </div>

                <button
                  onClick={doLogin}
                  disabled={loading}
                  className="w-full bg-brand text-white py-3.5 rounded-xl font-bold text-base border-none cursor-pointer shadow-[0_2px_8px_rgba(204,0,0,.25)] hover:bg-brand-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Нэвтрэх...' : 'Нэвтрэх'}
                </button>
              </div>

              {/* DAN OAuth separator and button */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px" style={{ background: 'var(--esl-border)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--esl-text-muted)' }}>эсвэл</span>
                <div className="flex-1 h-px" style={{ background: 'var(--esl-border)' }} />
              </div>

              <a
                href={buildAuthHref('/api/auth/google', {}, redirectTarget)}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm border-none cursor-pointer transition-all hover:shadow-md no-underline"
                style={{ background: 'var(--esl-bg-card)', border: '1.5px solid var(--esl-border)', color: 'var(--esl-text-primary)' }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Google-ээр нэвтрэх
              </a>

              <a
                href={buildAuthHref('/api/auth/dan', {}, redirectTarget)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-base text-white border-none cursor-pointer transition-all hover:opacity-90 no-underline mt-3"
                style={{ background: '#2563EB' }}
              >
                🇲🇳 ДАН-аар нэвтрэх
              </a>
              <p className="text-center text-xs mt-2" style={{ color: 'var(--esl-text-muted)' }}>
                E-Mongolia иргэний нэвтрэлт
              </p>

              <p className="text-center text-sm mt-6" style={{ color: 'var(--esl-text-muted)' }}>
                Данс байхгүй юу?{' '}
                <button onClick={() => setMode('register')} className="text-brand font-bold bg-transparent border-none cursor-pointer">
                  Бүртгүүлэх
                </button>
              </p>
            </>
          ) : (
            <>
              <div className="text-xl font-black mb-1 flex items-center gap-2" style={{ color: 'var(--esl-text-primary)' }}>Нэгдэцгээе! <Rocket className="w-5 h-5" /></div>
              <div className="text-sm mb-6" style={{ color: 'var(--esl-text-muted)' }}>Та ямар үүргээр нэгдэх вэ?</div>

              <div className="space-y-4">
                {/* Role selector */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--esl-text-muted)' }}>Үүрэг сонгох</label>
                  <div className="space-y-2">
                    {ROLES.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setRole(r.value)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left cursor-pointer transition-all ${
                          role === r.value
                            ? 'shadow-[0_0_0_3px_rgba(204,0,0,.12)]'
                            : 'hover:opacity-80'
                        }`}
                        style={{
                          background: 'var(--esl-bg-card)',
                          border: role === r.value ? '1.5px solid var(--brand, #CC0000)' : '1.5px solid var(--esl-border)',
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                          style={{ border: role === r.value ? '2px solid var(--brand, #CC0000)' : '2px solid var(--esl-border)' }}
                        >
                          {role === r.value && <div className="w-2 h-2 rounded-full bg-brand" />}
                        </div>
                        <r.icon className="w-5 h-5" style={{ color: 'var(--esl-text-primary)' }} />
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-bold" style={{ color: 'var(--esl-text-primary)' }}>{r.label}</h5>
                          <p className="text-xs" style={{ color: 'var(--esl-text-muted)' }}>{r.desc}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg" style={{ color: 'var(--esl-text-muted)', background: 'var(--esl-bg-elevated)' }}>
                          {r.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--esl-text-muted)' }}>Бүтэн нэр</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Таны нэр"
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(204,0,0,.12)] transition"
                    style={{ border: '1.5px solid var(--esl-border)', background: 'var(--esl-bg-card)', color: 'var(--esl-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--esl-text-muted)' }}>Имэйл хаяг</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(204,0,0,.12)] transition"
                    style={{ border: '1.5px solid var(--esl-border)', background: 'var(--esl-bg-card)', color: 'var(--esl-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--esl-text-muted)' }}>
                    Нууц үг{' '}
                    {password && <span style={{ color: pw.color }} className="text-[11px] font-medium normal-case tracking-normal">{pw.label}</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Дор хаяж 6 тэмдэгт"
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(204,0,0,.12)] transition pr-12"
                      style={{ border: '1.5px solid var(--esl-border)', background: 'var(--esl-bg-card)', color: 'var(--esl-text-primary)' }}
                      onKeyDown={(e) => e.key === 'Enter' && doRegister()}
                    />
                    <button
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-sm"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff className="w-4 h-4" style={{ color: 'var(--esl-text-muted)' }} /> : <Eye className="w-4 h-4" style={{ color: 'var(--esl-text-muted)' }} />}
                    </button>
                  </div>
                  {password && (
                    <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: 'var(--esl-bg-elevated)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${(pw.score / 3) * 100}%`, background: pw.color }}
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={doRegister}
                  disabled={loading}
                  className="w-full bg-brand text-white py-3.5 rounded-xl font-bold text-base border-none cursor-pointer shadow-[0_2px_8px_rgba(204,0,0,.25)] hover:bg-brand-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Бүртгүүлж байна...' : 'Бүртгүүлэх →'}
                </button>
              </div>

              {/* DAN OAuth separator and button */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px" style={{ background: 'var(--esl-border)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--esl-text-muted)' }}>эсвэл</span>
                <div className="flex-1 h-px" style={{ background: 'var(--esl-border)' }} />
              </div>

              <a
                href={buildAuthHref('/api/auth/google', { role }, redirectTarget)}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm border-none cursor-pointer transition-all hover:shadow-md no-underline"
                style={{ background: 'var(--esl-bg-card)', border: '1.5px solid var(--esl-border)', color: 'var(--esl-text-primary)' }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Google-ээр бүртгүүлэх
              </a>

              <a
                href={buildAuthHref('/api/auth/dan', {}, redirectTarget)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-base text-white border-none cursor-pointer transition-all hover:opacity-90 no-underline mt-3"
                style={{ background: '#2563EB' }}
              >
                🇲🇳 ДАН-аар нэвтрэх
              </a>
              <p className="text-center text-xs mt-2" style={{ color: 'var(--esl-text-muted)' }}>
                E-Mongolia иргэний нэвтрэлт
              </p>

              <p className="text-center text-sm mt-6" style={{ color: 'var(--esl-text-muted)' }}>
                Данс байгаа юу?{' '}
                <button onClick={() => setMode('login')} className="text-brand font-bold bg-transparent border-none cursor-pointer">
                  Нэвтрэх
                </button>
              </p>
            </>
          )}
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
