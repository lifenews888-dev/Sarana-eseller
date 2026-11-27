'use client';

import { useCallback, useEffect, useState } from 'react';

type Row = {
  id: string;
  company: string;
  contact: string;
  phone: string;
  email?: string | null;
  details: string;
  quantity?: number | null;
  status: string;
  adminNote?: string | null;
  createdAt: string;
};

const STATUS_LABEL: Record<string, string> = { new: 'Шинэ', contacted: 'Холбогдсон', closed: 'Хаасан' };

function headers(): Record<string, string> {
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

export default function AdminCorporateOrdersPage() {
  const [status, setStatus] = useState('new');
  const [rows, setRows] = useState<Row[] | null>(null);

  const load = useCallback(() => {
    fetch(`/api/admin/corporate-orders?status=${status}`, { headers: headers(), credentials: 'include' })
      .then((r) => r.json())
      .then((b) => setRows(b?.success ? b.data : []))
      .catch(() => setRows([]));
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const setRowStatus = async (id: string, next: string) => {
    await fetch('/api/admin/corporate-orders', {
      method: 'PATCH', headers: headers(), credentials: 'include', body: JSON.stringify({ id, status: next }),
    }).catch(() => null);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-extrabold text-[var(--esl-text-primary)]">🏢 Байгууллагын захиалга</h1>
        <div className="ml-auto flex gap-1 rounded-xl border border-[var(--esl-border)] p-1">
          {Object.keys(STATUS_LABEL).map((s) => (
            <button key={s} type="button" onClick={() => { setRows(null); setStatus(s); }} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${status === s ? 'bg-brand text-white' : 'text-[var(--esl-text-secondary)]'}`}>
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {rows === null ? (
        <p className="text-sm text-[var(--esl-text-muted)]">Ачаалж байна...</p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-8 text-center text-sm text-[var(--esl-text-muted)]">Хүсэлт алга.</p>
      ) : (
        rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-4">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-[var(--esl-text-primary)]">{r.company}</p>
                <p className="text-sm text-[var(--esl-text-secondary)]">
                  {r.contact} · <a href={`tel:${r.phone}`} className="underline">{r.phone}</a>{r.email ? ` · ${r.email}` : ''}{r.quantity ? ` · ${r.quantity} ширхэг` : ''}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-[var(--esl-text-primary)]">{r.details}</p>
                <p className="mt-1 text-xs text-[var(--esl-text-muted)]">{new Date(r.createdAt).toLocaleString('mn-MN')}</p>
              </div>
              <div className="flex gap-2">
                {Object.keys(STATUS_LABEL).filter((s) => s !== r.status).map((s) => (
                  <button key={s} type="button" onClick={() => setRowStatus(r.id, s)} className="rounded-lg border border-[var(--esl-border)] px-3 py-1.5 text-xs font-bold text-[var(--esl-text-secondary)]">
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
