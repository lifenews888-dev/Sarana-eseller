'use client';

import { useCallback, useEffect, useState } from 'react';
import { HERDER_PROVINCES } from '@/lib/herder-delivery';

type Application = {
  id: string;
  herderName: string;
  phone: string;
  registerNumber: string;
  provinceName: string;
  district: string;
  livestock?: Record<string, number>;
  aDansNumber?: string;
  vetCertUri?: string;
  bankInfo?: { bankName: string; accountNumber: string };
  notes?: string;
  status: string;
  createdAt: string;
  rejectionReason?: string;
};
type Coordinator = { id: string; provinces: string[]; isActive: boolean; user: { name: string; phone?: string; email: string } | null };

const STATUS_LABEL: Record<string, string> = {
  pending: 'Хүлээгдэж буй',
  under_review: 'Нэмэлт шалгалт',
  approved: 'Батлагдсан',
  rejected: 'Татгалзсан',
  all: 'Бүгд',
};
const LIVESTOCK_LABEL: Record<string, string> = { horse: 'адуу', cow: 'үхэр', sheep: 'хонь', goat: 'ямаа', camel: 'тэмээ' };

function headers(): Record<string, string> {
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

export default function AdminHerdersPage() {
  const [status, setStatus] = useState('pending');
  const [apps, setApps] = useState<Application[] | null>(null);
  const [coords, setCoords] = useState<Coordinator[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [coordPhone, setCoordPhone] = useState('');
  const [coordProvinces, setCoordProvinces] = useState<string[]>([]);
  const [reasonFor, setReasonFor] = useState<{ id: string; action: 'reject' | 'request_review' } | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(() => {
    fetch(`/api/herder/coordinator/applications?status=${status}&limit=50`, { headers: headers(), credentials: 'include' })
      .then((r) => r.json())
      .then((b) => setApps(b?.success ? b.data.applications : []))
      .catch(() => setApps([]));
    fetch('/api/admin/herder-coordinators', { headers: headers(), credentials: 'include' })
      .then((r) => r.json())
      .then((b) => setCoords(b?.success ? b.data : []))
      .catch(() => setCoords([]));
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const review = async (id: string, action: 'approve' | 'reject' | 'request_review', note?: string) => {
    setBusy(id + action);
    const res = await fetch(`/api/herder/coordinator/applications/${id}`, {
      method: 'PUT', headers: headers(), credentials: 'include', body: JSON.stringify({ action, reason: note || undefined }),
    }).then((r) => r.json()).catch(() => null);
    setBusy(null);
    if (res?.success) { setReasonFor(null); setReason(''); }
    setMsg(res?.success ? 'Хадгалагдлаа' : res?.error || 'Алдаа гарлаа');
    load();
  };

  const saveCoordinator = async () => {
    setBusy('coord');
    const res = await fetch('/api/admin/herder-coordinators', {
      method: 'POST', headers: headers(), credentials: 'include', body: JSON.stringify({ phone: coordPhone, provinces: coordProvinces }),
    }).then((r) => r.json()).catch(() => null);
    setBusy(null);
    setMsg(res?.success ? 'Координатор хадгалагдлаа' : res?.error || 'Алдаа гарлаа');
    if (res?.success) { setCoordPhone(''); setCoordProvinces([]); }
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-extrabold text-[var(--esl-text-primary)]">🐑 Малчид</h1>
        <div className="ml-auto flex flex-wrap gap-1 rounded-xl border border-[var(--esl-border)] p-1">
          {Object.keys(STATUS_LABEL).map((s) => (
            <button key={s} type="button" onClick={() => { setApps(null); setStatus(s); }} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${status === s ? 'bg-brand text-white' : 'text-[var(--esl-text-secondary)]'}`}>
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>
      {msg ? <p className="text-sm font-semibold text-[var(--esl-text-secondary)]">{msg}</p> : null}

      {apps === null ? (
        <p className="text-sm text-[var(--esl-text-muted)]">Ачаалж байна...</p>
      ) : apps.length === 0 ? (
        <p className="rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-8 text-center text-sm text-[var(--esl-text-muted)]">Хүсэлт алга.</p>
      ) : (
        <div className="space-y-3">
          {apps.map((a) => (
            <div key={a.id} className="rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-[var(--esl-text-primary)]">{a.herderName} <span className="text-xs font-bold text-[var(--esl-text-muted)]">· {STATUS_LABEL[a.status] || a.status}</span></p>
                  <p className="text-sm text-[var(--esl-text-secondary)]">{a.provinceName}, {a.district} · {a.phone} · РД {a.registerNumber || '—'}</p>
                  <p className="text-sm text-[var(--esl-text-secondary)]">
                    Мал: {a.livestock ? Object.entries(a.livestock).map(([k, v]) => `${LIVESTOCK_LABEL[k] || k} ${v}`).join(', ') : '—'} · А данс: {a.aDansNumber || '—'}
                  </p>
                  {a.bankInfo ? <p className="text-sm text-[var(--esl-text-secondary)]">Данс: {a.bankInfo.bankName} {a.bankInfo.accountNumber}</p> : null}
                  {a.notes ? <p className="mt-1 whitespace-pre-line text-xs text-[var(--esl-text-muted)]">{a.notes}</p> : null}
                  {a.rejectionReason ? <p className="mt-1 text-xs font-semibold text-brand">Шалтгаан: {a.rejectionReason}</p> : null}
                  {a.vetCertUri ? <a href={a.vetCertUri} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-bold text-brand underline">Малын эмчийн гэрчилгээ харах</a> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {a.status !== 'approved' ? (
                    <button type="button" disabled={!!busy} onClick={() => review(a.id, 'approve')} className="rounded-lg bg-success px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">Батлах</button>
                  ) : null}
                  {a.status === 'pending' ? (
                    <button type="button" disabled={!!busy} onClick={() => { setReason(''); setReasonFor({ id: a.id, action: 'request_review' }); }} className="rounded-lg border border-[var(--esl-border)] px-3 py-1.5 text-xs font-bold text-[var(--esl-text-secondary)] disabled:opacity-50">Нэмэлт шалгах</button>
                  ) : null}
                  {a.status !== 'rejected' ? (
                    <button type="button" disabled={!!busy} onClick={() => { setReason(''); setReasonFor({ id: a.id, action: 'reject' }); }} className="rounded-lg border border-brand px-3 py-1.5 text-xs font-bold text-brand disabled:opacity-50">Татгалзах</button>
                  ) : null}
                </div>
              </div>
              {reasonFor?.id === a.id ? (
                <div className="mt-3 flex flex-wrap items-start gap-2 border-t border-[var(--esl-border)] pt-3">
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    maxLength={500}
                    placeholder={reasonFor.action === 'reject' ? 'Татгалзсан шалтгаан (малчинд харагдана)' : 'Юуг нэмж шалгах вэ?'}
                    className="min-w-[220px] flex-1 rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-input)] px-3 py-2 text-sm text-[var(--esl-text-primary)]"
                  />
                  <button
                    type="button"
                    disabled={!!busy || (reasonFor.action === 'reject' && !reason.trim())}
                    onClick={() => review(a.id, reasonFor.action, reason.trim())}
                    className="rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {reasonFor.action === 'reject' ? 'Татгалзах' : 'Илгээх'}
                  </button>
                  <button type="button" onClick={() => setReasonFor(null)} className="rounded-lg border border-[var(--esl-border)] px-3 py-2 text-xs font-bold text-[var(--esl-text-secondary)]">
                    Болих
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-4">
        <h2 className="text-base font-extrabold text-[var(--esl-text-primary)]">Орон нутгийн координатор</h2>
        <p className="mb-3 text-xs text-[var(--esl-text-muted)]">Координатор өөрийн аймгийн малчдын хүсэлтийг мобайл аппаас хянана.</p>
        <div className="flex flex-wrap items-center gap-2">
          <input value={coordPhone} onChange={(e) => setCoordPhone(e.target.value)} placeholder="Хэрэглэгчийн утас" className="rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-input)] px-3 py-2 text-sm text-[var(--esl-text-primary)]" />
          <button type="button" disabled={busy === 'coord' || !coordPhone || !coordProvinces.length} onClick={saveCoordinator} className="rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Хадгалах</button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {HERDER_PROVINCES.map((p) => {
            const on = coordProvinces.includes(p.code);
            return (
              <button key={p.code} type="button" onClick={() => setCoordProvinces((cur) => (on ? cur.filter((c) => c !== p.code) : [...cur, p.code]))} className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${on ? 'border-brand bg-brand text-white' : 'border-[var(--esl-border)] text-[var(--esl-text-secondary)]'}`}>
                {p.name}
              </button>
            );
          })}
        </div>
        {coords.length ? (
          <ul className="mt-4 space-y-1 text-sm text-[var(--esl-text-secondary)]">
            {coords.map((c) => (
              <li key={c.id}>
                <span className="font-bold text-[var(--esl-text-primary)]">{c.user?.name || '—'}</span> {c.user?.phone || c.user?.email} · {c.provinces.map((code) => HERDER_PROVINCES.find((p) => p.code === code)?.name || code).join(', ')}{c.isActive ? '' : ' (идэвхгүй)'}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
