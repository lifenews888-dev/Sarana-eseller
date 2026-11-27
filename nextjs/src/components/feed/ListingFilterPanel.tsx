'use client';

import { useEffect, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { filtersForCategory } from '@/lib/listingFilters';

type Facets = Record<string, { value: string; count: number }[]>;

/**
 * Ангиллын нарийн шүүлтүүр (машин: марк/он/гүйлт..., байр: өрөө/м²..., утас: брэнд/багтаамж).
 * values: { brand: 'Toyota', yearMin: '2015', ... } — m_ угтваргүй.
 */
export default function ListingFilterPanel({
  root,
  values,
  onChange,
}: {
  root: string;
  values: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  const defs = filtersForCategory(root);
  const [facets, setFacets] = useState<Facets>({});
  const [draft, setDraft] = useState<Record<string, string>>(values);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!defs.some((d) => d.kind === 'facet')) return;
    let cancelled = false;
    fetch(`/api/feed/facets?category=${encodeURIComponent(root)}`)
      .then((r) => r.json())
      .then((b) => { if (!cancelled) setFacets(b?.data || {}); })
      .catch(() => null);
    return () => { cancelled = true; };
  }, [root]); // eslint-disable-line react-hooks/exhaustive-deps

  if (defs.length === 0) return null;

  const activeCount = Object.values(values).filter(Boolean).length;
  const set = (key: string, value: string, immediate = false) => {
    const next = { ...draft, [key]: value };
    if (!value) delete next[key];
    setDraft(next);
    if (immediate) onChange(next);
  };

  const inputCls = 'h-10 w-full rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-3 text-sm text-[var(--esl-text-primary)] outline-none focus:border-[#E8242C]';

  return (
    <section className="mb-4 rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-4">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 text-sm font-bold text-[var(--esl-text-primary)]">
        <SlidersHorizontal className="h-4 w-4" /> Дэлгэрэнгүй шүүлтүүр
        {activeCount > 0 && <span className="rounded-full bg-[#E8242C] px-2 text-[11px] text-white">{activeCount}</span>}
        <span className="ml-auto text-xs font-normal text-[var(--esl-text-muted)]">{open ? 'Хураах' : 'Дэлгэх'}</span>
      </button>

      {open && (
        <>
          {defs.filter((d) => d.kind === 'facet').map((d) => (
            (facets[d.key]?.length ?? 0) > 0 && (
              <div key={d.key} className="mt-3">
                <p className="mb-1.5 text-xs font-bold text-[var(--esl-text-secondary)]">{d.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {facets[d.key]!.map((f) => {
                    const on = (values[d.key] || '').toLowerCase() === f.value.toLowerCase();
                    return (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => set(d.key, on ? '' : f.value, true)}
                        className={`rounded-full border px-3 py-1 text-xs ${on ? 'border-[#E8242C] bg-[#E8242C] text-white' : 'border-[var(--esl-border)] text-[var(--esl-text-secondary)]'}`}
                      >
                        {f.value} <span className={on ? 'text-white/80' : 'text-[var(--esl-text-muted)]'}>{f.count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          ))}

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {defs.filter((d) => d.kind !== 'facet').map((d) => (
              <label key={d.key} className="block">
                <span className="mb-1 block text-[11px] font-bold text-[var(--esl-text-muted)]">{d.label}</span>
                {d.kind === 'select' ? (
                  <select value={draft[d.key] || ''} onChange={(e) => set(d.key, e.target.value, true)} className={inputCls}>
                    <option value="">Бүгд</option>
                    {d.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    value={draft[d.key] || ''}
                    inputMode={d.kind === 'contains' ? 'text' : 'numeric'}
                    placeholder={'placeholder' in d ? d.placeholder : ''}
                    onChange={(e) => set(d.key, e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') onChange(draft); }}
                    className={inputCls}
                  />
                )}
              </label>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => onChange(draft)} className="h-10 rounded-xl bg-[#E8242C] px-5 text-sm font-bold text-white">Шүүх</button>
            {activeCount > 0 && (
              <button type="button" onClick={() => { setDraft({}); onChange({}); }} className="flex h-10 items-center gap-1 rounded-xl border border-[var(--esl-border)] px-4 text-sm text-[var(--esl-text-secondary)]">
                <X className="h-4 w-4" /> Цэвэрлэх
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
