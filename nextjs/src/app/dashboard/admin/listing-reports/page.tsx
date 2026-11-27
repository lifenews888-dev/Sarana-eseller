'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type Report = { id: string; reason: string; reasonLabel: string; note?: string | null; status: string; createdAt: string };
type Row = {
  feedItem: { id: string; title: string; status: string; price?: number | null };
  count: number;
  reports: Report[];
};

function headers(): Record<string, string> {
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

export default function AdminListingReportsPage() {
  const [status, setStatus] = useState<'open' | 'all'>('open');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/admin/listing-reports?status=${status}`, { headers: headers(), credentials: 'include' })
      .then((r) => r.json())
      .then((b) => setRows(b?.success ? b.data : []))
      .catch(() => setRows([]));
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const act = async (feedItemId: string, action: 'suspend' | 'dismiss' | 'restore') => {
    setBusy(feedItemId + action);
    await fetch('/api/admin/listing-reports', {
      method: 'PATCH', headers: headers(), credentials: 'include', body: JSON.stringify({ feedItemId, action }),
    }).catch(() => null);
    setBusy(null);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-extrabold text-[var(--esl-text-primary)]">🚩 Зарын гомдол</h1>
        <div className="ml-auto flex gap-1 rounded-xl border border-[var(--esl-border)] p-1">
          {(['open', 'all'] as const).map((s) => (
            <button key={s} type="button" onClick={() => { setRows(null); setStatus(s); }} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${status === s ? 'bg-brand text-white' : 'text-[var(--esl-text-secondary)]'}`}>
              {s === 'open' ? 'Шийдээгүй' : 'Бүгд'}
            </button>
          ))}
        </div>
      </div>

      {rows === null ? (
        <p className="text-sm text-[var(--esl-text-muted)]">Ачаалж байна...</p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-8 text-center text-sm text-[var(--esl-text-muted)]">Гомдол алга.</p>
      ) : (
        rows.map((row) => (
          <div key={row.feedItem.id} className="rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/feed/${row.feedItem.id}`} target="_blank" className="font-bold text-[var(--esl-text-primary)] no-underline hover:underline">{row.feedItem.title}</Link>
              <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-bold text-brand">{row.count} гомдол</span>
              <span className="rounded-full border border-[var(--esl-border)] px-2 py-0.5 text-[11px] text-[var(--esl-text-muted)]">{row.feedItem.status}</span>
              <div className="ml-auto flex gap-2">
                {row.feedItem.status === 'suspended' ? (
                  <button type="button" disabled={!!busy} onClick={() => act(row.feedItem.id, 'restore')} className="rounded-lg border border-[var(--esl-border)] px-3 py-1.5 text-xs font-bold text-[var(--esl-text-primary)]">Сэргээх</button>
                ) : (
                  <button type="button" disabled={!!busy} onClick={() => act(row.feedItem.id, 'suspend')} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white">Зарыг хаах</button>
                )}
                <button type="button" disabled={!!busy} onClick={() => act(row.feedItem.id, 'dismiss')} className="rounded-lg border border-[var(--esl-border)] px-3 py-1.5 text-xs font-bold text-[var(--esl-text-secondary)]">Хэрэгсэхгүй</button>
              </div>
            </div>
            <ul className="mt-3 space-y-1">
              {row.reports.map((r) => (
                <li key={r.id} className="text-xs text-[var(--esl-text-secondary)]">
                  <b>{r.reasonLabel}</b>{r.note ? ` — ${r.note}` : ''} · {new Date(r.createdAt).toLocaleString('mn-MN')} · {r.status}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
