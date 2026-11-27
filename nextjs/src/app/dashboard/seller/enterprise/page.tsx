'use client';

import { useState, useEffect, useCallback } from 'react';
import { Globe, Check, Loader2, Palette, ExternalLink, Eye, X } from 'lucide-react';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function EnterpriseSetupPage() {
  const [subdomain, setSubdomain] = useState('');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#1B3A5C');
  const [accentColor, setAccentColor] = useState('#E67E22');
  const [logoUrl, setLogoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [enterprise, setEnterprise] = useState<{ plan?: string; primaryColor?: string; subdomain?: string } | null>(null);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetch('/api/enterprise/my', { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => { if (d.data) setEnterprise(d.data); })
      .catch(() => {});
  }, []);

  // Debounced real-time availability check
  const checkAvailability = useCallback(async (slug: string) => {
    if (slug.length < 3) { setAvailable(null); return; }
    setChecking(true);
    try {
      const res = await fetch(`/api/enterprise/check-subdomain?subdomain=${slug}`);
      const data = await res.json();
      setAvailable(data.available);
      if (!data.available && data.error) setError(data.error);
      else setError('');
    } catch {}
    setChecking(false);
  }, []);

  useEffect(() => {
    if (subdomain.length < 3) return;
    const timer = setTimeout(() => checkAvailability(subdomain), 500);
    return () => clearTimeout(timer);
  }, [subdomain, checkAvailability]);

  const setup = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/enterprise/setup', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain, primaryColor, accentColor, logoUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setEnterprise(data.data?.enterprise);
      } else {
        setError(data.error || 'Алдаа гарлаа');
      }
    } catch {
      setError('Сүлжээний алдаа');
    }
    setSaving(false);
  };

  // ═══ Already set up — show status + preview ═══
  if (enterprise) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="bg-[var(--esl-bg-card)] rounded-xl border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-6 h-6 text-green-600" />
            <h1 className="text-xl font-bold">Enterprise идэвхтэй</h1>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-[var(--esl-text-secondary)]">Subdomain</span>
              <a href={`https://${enterprise.subdomain}.eseller.mn`} target="_blank" rel="noreferrer"
                className="text-blue-600 flex items-center gap-1">
                {enterprise.subdomain}.eseller.mn <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-[var(--esl-text-secondary)]">Багц</span>
              <span className="font-medium">{enterprise.plan}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-[var(--esl-text-secondary)]">Үндсэн өнгө</span>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded" style={{ background: enterprise.primaryColor }} />
                {enterprise.primaryColor}
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="bg-[var(--esl-bg-card)] rounded-xl border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-[var(--esl-bg-section)]">
            <span className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4" /> Дэлгүүрийн preview
            </span>
            <a href={`https://${enterprise.subdomain}.eseller.mn`} target="_blank" rel="noreferrer"
              className="text-xs text-blue-600 flex items-center gap-1">
              Шинэ табд нээх <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <iframe
            src={`/shop-sub/${enterprise.subdomain}`}
            className="w-full border-none"
            style={{ height: 500 }}
            title="Shop Preview"
          />
        </div>
      </div>
    );
  }

  // ═══ Setup form ═══
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-[var(--esl-bg-card)] rounded-xl border p-6">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-6 h-6 text-blue-900" />
          <div>
            <h1 className="text-xl font-bold">Enterprise тохиргоо</h1>
            <p className="text-sm text-[var(--esl-text-secondary)]">Өөрийн subdomain + брэнд үүсгэх</p>
          </div>
        </div>

        {/* Subdomain — realtime check */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Subdomain</label>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[var(--esl-bg-section)] border rounded-lg overflow-hidden flex-1">
              <input
                value={subdomain}
                onChange={(e) => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                  setSubdomain(val);
                  setAvailable(null);
                }}
                placeholder="nomin"
                className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
              />
              <span className="text-sm text-[var(--esl-text-muted)] px-2">.eseller.mn</span>
            </div>
            {checking && <Loader2 className="w-4 h-4 animate-spin text-[var(--esl-text-muted)]" />}
            {!checking && available === true && <Check className="w-5 h-5 text-green-500" />}
            {!checking && available === false && <X className="w-5 h-5 text-red-500" />}
          </div>
          {available === true && subdomain.length >= 3 && (
            <p className="text-green-600 text-xs mt-1">✓ {subdomain}.eseller.mn боломжтой!</p>
          )}
          {available === false && (
            <p className="text-red-500 text-xs mt-1">✗ Энэ subdomain аль хэдийн бүртгэлтэй</p>
          )}
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Үндсэн өнгө</label>
            <div className="flex items-center gap-2">
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
              <input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Товчны өнгө</label>
            <div className="flex items-center gap-2">
              <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
              <input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" />
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Лого URL</label>
          <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>

        {/* Live Preview */}
        <div className="mb-6 rounded-lg overflow-hidden border">
          <div style={{ background: primaryColor }} className="px-4 py-3 flex items-center gap-3">
            {logoUrl && <img src={logoUrl} alt="" className="h-8 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
            <span className="text-white font-bold">{subdomain || 'nomin'}.eseller.mn</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
              <span className="text-white/70 text-xs">Нүүр</span>
              <span className="text-white/70 text-xs">Бараа</span>
              <span className="text-white/70 text-xs">Бидний тухай</span>
              <span className="text-white text-xs">🛒</span>
            </div>
          </div>
          <div className="p-6 bg-[var(--esl-bg-section)]">
            <div className="text-center py-4" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`, borderRadius: 8 }}>
              <p className="text-white font-bold text-lg">{subdomain || 'Таны дэлгүүр'}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[var(--esl-bg-card)] rounded-lg p-3 border">
                  <div className="aspect-square bg-[var(--esl-bg-muted)] rounded mb-2" />
                  <div className="h-2 bg-[var(--esl-bg-elevated)] rounded mb-1 w-3/4" />
                  <div className="h-3 rounded w-1/2" style={{ background: accentColor, opacity: 0.7 }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          onClick={setup}
          disabled={saving || !subdomain || subdomain.length < 3 || available === false}
          className="w-full bg-blue-900 text-white py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Palette className="w-4 h-4" />}
          Enterprise идэвхжүүлэх
        </button>
      </div>
    </div>
  );
}
