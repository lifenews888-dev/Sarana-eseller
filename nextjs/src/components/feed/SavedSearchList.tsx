'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Trash2 } from 'lucide-react';

type Item = { id: string; name: string; summary: string; href: string; newCount: number };

function hdr(): Record<string, string> {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/** Хадгалсан хайлтууд — шинэ зарын тоотой. Нээхэд "үзсэн" болно (?ss=<id>). */
export default function SavedSearchList() {
  const [items, setItems] = useState<Item[] | null>(null);

  const load = useCallback(() => {
    fetch('/api/saved-searches', { headers: hdr(), credentials: 'include', cache: 'no-store' })
      .then((r) => r.json())
      .then((b) => setItems(b?.success ? b.data.items : []))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (id: string) => {
    setItems((list) => (list || []).filter((i) => i.id !== id));
    await fetch(`/api/saved-searches/${id}`, { method: 'DELETE', headers: hdr(), credentials: 'include' }).catch(() => null);
    window.dispatchEvent(new Event('eseller:saved-searches-changed'));
  };

  return (
    <section id="searches" className="mb-8 scroll-mt-24">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-[var(--esl-text-primary)]">
        <Bell className="h-5 w-5 text-[#E8242C]" /> Хадгалсан хайлт
      </h2>
      {items === null ? (
        <p className="text-sm text-[var(--esl-text-muted)]">Ачаалж байна...</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-5 text-sm text-[var(--esl-text-muted)]">
          Хадгалсан хайлт алга. <Link href="/feed" className="font-bold text-[#E8242C]">Зарын булан</Link>-д ангилал, шүүлтүүрээ сонгоод
          <b> «Хайлт хадгалах»</b> дарвал тохирох шинэ зар гарахад энд болон 🔔 дээр мэдэгдэнэ.
        </div>
      ) : (
        <ul className="divide-y divide-[var(--esl-border)] overflow-hidden rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)]">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 px-4 py-3">
              <Link href={`${i.href}${i.href.includes('?') ? '&' : '?'}ss=${i.id}`} className="min-w-0 flex-1 no-underline">
                <span className="block truncate text-sm font-bold text-[var(--esl-text-primary)]">{i.name}</span>
                {i.summary !== i.name && <span className="block truncate text-xs text-[var(--esl-text-muted)]">{i.summary}</span>}
              </Link>
              {i.newCount > 0 ? (
                <span className="shrink-0 rounded-full bg-[#E8242C] px-2.5 py-1 text-[11px] font-bold text-white">{i.newCount} шинэ</span>
              ) : (
                <span className="shrink-0 text-[11px] text-[var(--esl-text-muted)]">Шинэ зар алга</span>
              )}
              <button type="button" onClick={() => remove(i.id)} aria-label="Устгах" className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-[var(--esl-text-muted)] hover:bg-[var(--esl-bg-hover)] hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
