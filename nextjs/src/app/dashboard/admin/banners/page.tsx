'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ExternalLink, Pause, Play, Plus, Save, Trash2, X } from 'lucide-react';
import { AD_SLOTS, BANNER_STATUS_LABEL } from '@/lib/bannerAds';

/* Баннер удирдлага — сурталчилгааны үнийн багц, төлбөр орсон баннерын шалгалт, идэвхтэй баннерууд.
   Бүх өгөгдөл бодит API-аас (хуурамч жишээ байхгүй). */

type Banner = {
  id: string; refId: string; title: string; slot: string; imageUrl: string; linkUrl: string;
  entityName?: string | null; status: string; isPaid: boolean; price?: number | null;
  startsAt: string; endsAt: string; impressions: number; clicks: number;
};
type Plan = {
  id: string; name: string; slot: string; durationDays: number; price: number; isActive: boolean;
  sortOrder: number; maxPerPeriod?: number | null; description?: string | null; features: string[];
};
type Stats = { active: number; pending: number; expiringToday: number; revenueThisMonth: number; totalImpressions: number };

const STATUS_FILTERS = ['all', 'PENDING', 'ACTIVE', 'AWAITING_PAYMENT', 'PAUSED', 'REJECTED', 'DRAFT'];
const fmt = (n: number) => `${Math.round(n).toLocaleString('en-US')}₮`;
const day = (s: string) => new Date(s).toLocaleDateString('mn-MN');

function hdr(): Record<string, string> {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}
async function api<T>(url: string, init?: RequestInit): Promise<T | null> {
  const r = await fetch(url, { ...init, headers: { ...hdr(), ...(init?.headers || {}) }, credentials: 'include', cache: 'no-store' }).catch(() => null);
  if (!r) return null;
  const b = await r.json().catch(() => null);
  return (b && typeof b === 'object' && 'data' in b ? b.data : b) as T;
}

export default function AdminBannersPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const loadStats = useCallback(() => { api<Stats>('/api/admin/banners/stats').then((d) => d && setStats(d)); }, []);
  const loadBanners = useCallback(() => {
    const p = new URLSearchParams({ page: String(page), limit: '20' });
    if (status !== 'all') p.set('status', status);
    api<{ banners: Banner[]; total: number }>(`/api/admin/banners?${p}`).then((d) => {
      setBanners(Array.isArray(d?.banners) ? d!.banners : []);
      setTotal(Number(d?.total) || 0);
    });
  }, [page, status]);

  useEffect(() => {
    const t = window.setTimeout(() => { loadStats(); loadBanners(); }, 0);
    return () => window.clearTimeout(t);
  }, [loadStats, loadBanners]);

  const review = async (b: Banner, action: 'approve' | 'reject' | 'pause' | 'resume') => {
    if (action === 'reject' && !window.confirm(`"${b.title}" баннерыг татгалзах уу? Төлбөрийг гараар буцаах шаардлагатай.`)) return;
    setBusy(b.id); setMsg('');
    const r = await api<{ error?: string }>(`/api/admin/banners/${b.id}/review`, { method: 'POST', body: JSON.stringify({ action }) });
    setBusy(null);
    if (r && 'error' in r && r.error) setMsg(r.error);
    loadBanners(); loadStats();
  };

  const remove = async (b: Banner) => {
    if (!window.confirm(`"${b.title}" баннерыг бүр мөсөн устгах уу? Буцаах боломжгүй.`)) return;
    setBusy(b.id);
    await api(`/api/admin/banners/${b.id}`, { method: 'DELETE' });
    setBusy(null);
    loadBanners(); loadStats();
  };

  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="min-h-screen space-y-6 bg-[var(--esl-bg-page)] p-6 text-[var(--esl-text-primary)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Баннер удирдлага</h1>
          <p className="mt-0.5 text-sm text-[var(--esl-text-muted)]">Үнийн багц, төлбөр орсон баннерын шалгалт, идэвхтэй баннерууд</p>
        </div>
        <div className="flex gap-2">
          <Link href="/advertise" target="_blank" className="flex items-center gap-1.5 rounded-xl border border-[var(--esl-border)] px-4 py-2.5 text-sm font-semibold text-[var(--esl-text-primary)] no-underline">
            <ExternalLink className="h-4 w-4" /> Үнийн хуудас
          </Link>
          <Link href="/dashboard/admin/banners/new" className="flex items-center gap-1.5 rounded-xl bg-[#E8242C] px-4 py-2.5 text-sm font-semibold text-white no-underline">
            <Plus className="h-4 w-4" /> Өөрсдийн баннер
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ['Идэвхтэй', stats?.active ?? 0],
          ['Шалгах хүлээж буй', stats?.pending ?? 0],
          ['Өнөөдөр дуусах', stats?.expiringToday ?? 0],
          ['Энэ сарын орлого', fmt(stats?.revenueThisMonth ?? 0)],
          ['Нийт харагдалт', (stats?.totalImpressions ?? 0).toLocaleString('en-US')],
        ].map(([l, v]) => (
          <div key={String(l)} className="rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-4">
            <p className="text-[11px] uppercase tracking-wider text-[var(--esl-text-muted)]">{l}</p>
            <p className="mt-1 text-xl font-black">{v}</p>
          </div>
        ))}
      </div>

      <PlansManager />

      <section className="overflow-hidden rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)]">
        <div className="flex flex-wrap gap-2 border-b border-[var(--esl-border)] p-4">
          {STATUS_FILTERS.map((s) => (
            <button key={s} type="button" onClick={() => { setStatus(s); setPage(1); }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${status === s ? 'border-[#E8242C] bg-[#E8242C] text-white' : 'border-[var(--esl-border)] text-[var(--esl-text-secondary)]'}`}>
              {s === 'all' ? 'Бүгд' : BANNER_STATUS_LABEL[s] || s}
            </button>
          ))}
        </div>
        {msg && <p className="px-4 pt-3 text-sm text-red-500">{msg}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--esl-border)] text-left text-[11px] uppercase tracking-wider text-[var(--esl-text-muted)]">
                <th className="px-4 py-3">Баннер</th><th className="px-4 py-3">Байршил</th><th className="px-4 py-3">Захиалагч</th>
                <th className="px-4 py-3">Хугацаа</th><th className="px-4 py-3">Төлөв</th><th className="px-4 py-3 text-right">Үзэлт / Даралт</th><th className="px-4 py-3 text-right">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {banners.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-[var(--esl-text-muted)]">Баннер алга</td></tr>
              ) : banners.map((b) => (
                <tr key={b.id} className={`border-b border-[var(--esl-border)] ${busy === b.id ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <a href={b.imageUrl} target="_blank" rel="noreferrer" className="block h-10 w-16 shrink-0 overflow-hidden rounded-md bg-[var(--esl-bg-elevated)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {b.imageUrl && <img src={b.imageUrl} alt="" className="h-full w-full object-cover" />}
                      </a>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{b.title}</p>
                        <a href={b.linkUrl} target="_blank" rel="noreferrer" className="block max-w-[220px] truncate text-[11px] text-[#E8242C] no-underline">{b.linkUrl}</a>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--esl-text-secondary)]">{AD_SLOTS[b.slot as keyof typeof AD_SLOTS]?.label || b.slot}</td>
                  <td className="px-4 py-3 text-xs text-[var(--esl-text-secondary)]">{b.entityName || '—'}{b.price ? <span className="block text-[var(--esl-text-muted)]">{fmt(b.price)}{b.isPaid ? ' · төлсөн' : ''}</span> : null}</td>
                  <td className="px-4 py-3 text-xs text-[var(--esl-text-secondary)]">{day(b.startsAt)} — {day(b.endsAt)}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-[var(--esl-bg-section)] px-2.5 py-1 text-[11px] font-semibold">{BANNER_STATUS_LABEL[b.status] || b.status}</span></td>
                  <td className="px-4 py-3 text-right text-xs text-[var(--esl-text-secondary)]">{b.impressions.toLocaleString('en-US')} / {b.clicks.toLocaleString('en-US')}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {b.status === 'PENDING' && <>
                        <IconBtn title="Батлах, нийтлэх" onClick={() => review(b, 'approve')} className="text-green-500"><Check className="h-4 w-4" /></IconBtn>
                        <IconBtn title="Татгалзах" onClick={() => review(b, 'reject')} className="text-red-500"><X className="h-4 w-4" /></IconBtn>
                      </>}
                      {b.status === 'ACTIVE' && <IconBtn title="Түр зогсоох" onClick={() => review(b, 'pause')}><Pause className="h-4 w-4" /></IconBtn>}
                      {b.status === 'PAUSED' && <IconBtn title="Үргэлжлүүлэх" onClick={() => review(b, 'resume')}><Play className="h-4 w-4" /></IconBtn>}
                      <IconBtn title="Устгах" onClick={() => remove(b)} className="hover:text-red-500"><Trash2 className="h-4 w-4" /></IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--esl-border)] px-4 py-3 text-xs text-[var(--esl-text-muted)]">
            <span>Нийт {total}</span>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border border-[var(--esl-border)] px-3 py-1 disabled:opacity-30">←</button>
              <span>{page}/{pages}</span>
              <button type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="rounded border border-[var(--esl-border)] px-3 py-1 disabled:opacity-30">→</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function IconBtn({ children, onClick, title, className = '' }: { children: React.ReactNode; onClick: () => void; title: string; className?: string }) {
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-[var(--esl-text-muted)] hover:bg-[var(--esl-bg-hover)] ${className}`}>
      {children}
    </button>
  );
}

const EMPTY_PLAN = { name: '', slot: 'HERO', durationDays: 7, price: 0, maxPerPeriod: '' as string | number, description: '', isActive: true };

/** Сурталчилгааны үнийн багцууд — /advertise хуудсанд эдгээр л харагдана */
function PlansManager() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [draft, setDraft] = useState(EMPTY_PLAN);
  const [edits, setEdits] = useState<Record<string, Partial<Plan>>>({});
  const [error, setError] = useState('');

  const load = useCallback(() => { api<Plan[]>('/api/admin/banners/plans').then((d) => setPlans(Array.isArray(d) ? d : [])); }, []);
  useEffect(() => { const t = window.setTimeout(load, 0); return () => window.clearTimeout(t); }, [load]);

  const create = async () => {
    setError('');
    if (!draft.name.trim() || draft.price <= 0 || draft.durationDays <= 0) { setError('Нэр, үнэ, хоногийг бөглөнө үү'); return; }
    const r = await api<{ id?: string; error?: string }>('/api/admin/banners/plans', { method: 'POST', body: JSON.stringify({ ...draft, maxPerPeriod: draft.maxPerPeriod === '' ? null : Number(draft.maxPerPeriod) }) });
    if (!r?.id) { setError(r?.error || 'Хадгалж чадсангүй'); return; }
    setDraft(EMPTY_PLAN); load();
  };
  const save = async (id: string) => {
    await api(`/api/admin/banners/plans/${id}`, { method: 'PATCH', body: JSON.stringify(edits[id] || {}) });
    setEdits((e) => { const n = { ...e }; delete n[id]; return n; }); load();
  };
  const toggle = async (p: Plan) => { await api(`/api/admin/banners/plans/${p.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !p.isActive }) }); load(); };
  const del = async (p: Plan) => {
    if (!window.confirm(`"${p.name}" багцыг устгах уу?`)) return;
    await api(`/api/admin/banners/plans/${p.id}`, { method: 'DELETE' }); load();
  };
  const set = (id: string, k: keyof Plan, v: string | number) => setEdits((e) => ({ ...e, [id]: { ...e[id], [k]: v } }));

  const cell = 'h-9 w-full rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-input,var(--esl-bg))] px-2 text-sm text-[var(--esl-text-primary)] outline-none focus:border-[#E8242C]';

  return (
    <section className="rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-4">
      <h2 className="text-base font-bold">Үнийн багцууд</h2>
      <p className="mb-3 text-xs text-[var(--esl-text-muted)]">Идэвхтэй багцууд /advertise хуудсанд харагдаж, хэрэглэгч QPay-ээр шууд захиална. &ldquo;Дээд тоо&rdquo; нь нэг байршилд зэрэг байх баннерын хязгаар.</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--esl-text-muted)]">
              <th className="py-2 pr-2">Нэр</th><th className="py-2 pr-2">Байршил</th><th className="py-2 pr-2">Хоног</th><th className="py-2 pr-2">Үнэ (₮)</th><th className="py-2 pr-2">Дээд тоо</th><th className="py-2 pr-2">Төлөв</th><th />
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => {
              const e = edits[p.id] || {};
              return (
                <tr key={p.id} className="border-t border-[var(--esl-border)]">
                  <td className="py-2 pr-2"><input className={cell} value={String(e.name ?? p.name)} onChange={(ev) => set(p.id, 'name', ev.target.value)} /></td>
                  <td className="py-2 pr-2 text-xs text-[var(--esl-text-secondary)]">{AD_SLOTS[p.slot as keyof typeof AD_SLOTS]?.label || p.slot}</td>
                  <td className="py-2 pr-2"><input type="number" className={cell} value={Number(e.durationDays ?? p.durationDays)} onChange={(ev) => set(p.id, 'durationDays', Number(ev.target.value))} /></td>
                  <td className="py-2 pr-2"><input type="number" className={cell} value={Number(e.price ?? p.price)} onChange={(ev) => set(p.id, 'price', Number(ev.target.value))} /></td>
                  <td className="py-2 pr-2"><input type="number" className={cell} value={String(e.maxPerPeriod ?? p.maxPerPeriod ?? '')} onChange={(ev) => set(p.id, 'maxPerPeriod', ev.target.value)} placeholder="хязгааргүй" /></td>
                  <td className="py-2 pr-2">
                    <button type="button" onClick={() => toggle(p)} className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${p.isActive ? 'bg-green-500/15 text-green-500' : 'bg-[var(--esl-bg-section)] text-[var(--esl-text-muted)]'}`}>{p.isActive ? 'Идэвхтэй' : 'Нуусан'}</button>
                  </td>
                  <td className="py-2">
                    <div className="flex justify-end gap-1">
                      {edits[p.id] && <IconBtn title="Хадгалах" onClick={() => save(p.id)} className="text-green-500"><Save className="h-4 w-4" /></IconBtn>}
                      <IconBtn title="Устгах" onClick={() => del(p)} className="hover:text-red-500"><Trash2 className="h-4 w-4" /></IconBtn>
                    </div>
                  </td>
                </tr>
              );
            })}
            <tr className="border-t border-[var(--esl-border)]">
              <td className="py-2 pr-2"><input className={cell} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Жишээ: 7 хоног" /></td>
              <td className="py-2 pr-2">
                <select className={cell} value={draft.slot} onChange={(e) => setDraft({ ...draft, slot: e.target.value })}>
                  {Object.entries(AD_SLOTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </td>
              <td className="py-2 pr-2"><input type="number" className={cell} value={draft.durationDays} onChange={(e) => setDraft({ ...draft, durationDays: Number(e.target.value) })} /></td>
              <td className="py-2 pr-2"><input type="number" className={cell} value={draft.price || ''} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} placeholder="0" /></td>
              <td className="py-2 pr-2"><input type="number" className={cell} value={draft.maxPerPeriod} onChange={(e) => setDraft({ ...draft, maxPerPeriod: e.target.value })} placeholder="хязгааргүй" /></td>
              <td colSpan={2} className="py-2">
                <button type="button" onClick={create} className="flex h-9 items-center gap-1.5 rounded-lg bg-[#E8242C] px-3 text-xs font-bold text-white"><Plus className="h-4 w-4" /> Багц нэмэх</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </section>
  );
}
