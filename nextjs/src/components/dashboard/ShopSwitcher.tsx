'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown, Lock, Plus, Store } from 'lucide-react';

export type OwnerStore = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  entityType: string;
  planKey: string;
  planName: string;
  active: boolean;
};

export type ShopAllowance = { used: number; maxShops: number; planKey: string; canCreate: boolean };

const TYPE_LABELS: Record<string, string> = {
  store: 'Дэлгүүр',
  order_store: 'Захиалгын дэлгүүр',
  pre_order: 'Pre-order',
  digital: 'Дижитал',
};

export const ACTIVE_SHOP_COOKIE = 'eseller-active-shop';

/** Идэвхтэй дэлгүүрийг cookie-д хадгална — бүх seller API түүгээр ажиллана. */
export function setActiveShop(shopId: string) {
  document.cookie = `${ACTIVE_SHOP_COOKIE}=${shopId}; path=/; max-age=${365 * 24 * 60 * 60}; samesite=lax`;
  try {
    localStorage.setItem('eseller_shop_id', shopId);
    localStorage.removeItem('eseller_store_config');
  } catch { /* ignore */ }
}

export default function ShopSwitcher({ stores, allowance }: { stores: OwnerStore[]; allowance: ShopAllowance | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = stores.find((s) => s.active) || stores[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  if (!active) return null;

  const switchTo = (id: string) => {
    if (id === active.id) { setOpen(false); return; }
    setActiveShop(id);
    window.location.reload();
  };

  const canCreate = allowance?.canCreate ?? false;
  const limitText = allowance
    ? allowance.maxShops === -1 ? `${allowance.used} дэлгүүр` : `${allowance.used}/${allowance.maxShops} дэлгүүр`
    : '';

  return (
    <div ref={ref} className="relative mb-4 inline-block">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-3 py-2 text-left hover:border-[#E8242C]/60"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8242C]/15 text-[#E8242C]"><Store size={16} /></span>
        <span className="min-w-0">
          <span className="block max-w-[220px] truncate text-sm font-bold text-[var(--esl-text-primary)]">{active.name}</span>
          <span className="block text-[11px] text-[var(--esl-text-muted)]">{TYPE_LABELS[active.entityType] || 'Дэлгүүр'} · {active.planName}</span>
        </span>
        <ChevronDown size={16} className="ml-1 text-[var(--esl-text-muted)]" />
      </button>

      {open && (
        <div role="listbox" aria-label="Дэлгүүр сонгох" className="absolute left-0 z-50 mt-2 w-[300px] rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-1.5 shadow-xl">
          <p className="px-2.5 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--esl-text-muted)]">
            Миний дэлгүүрүүд {limitText && `· ${limitText}`}
          </p>
          {stores.map((s) => (
            <button
              key={s.id}
              type="button"
              role="option"
              aria-selected={s.active}
              onClick={() => switchTo(s.id)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-[var(--esl-bg-elevated)]"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[var(--esl-text-primary)]">{s.name}</span>
                <span className="block text-[11px] text-[var(--esl-text-muted)]">{TYPE_LABELS[s.entityType] || 'Дэлгүүр'} · {s.planName}</span>
              </span>
              {s.active && <Check size={16} className="text-[#E8242C]" />}
            </button>
          ))}
          <div className="my-1 h-px bg-[var(--esl-border)]" />
          {canCreate ? (
            <Link href="/become-seller?new=1" className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-[#E8242C] no-underline hover:bg-[var(--esl-bg-elevated)]">
              <Plus size={16} /> Шинэ дэлгүүр нээх
            </Link>
          ) : (
            <Link href="/dashboard/store/package" className="flex items-start gap-2 rounded-lg px-2.5 py-2 text-sm no-underline hover:bg-[var(--esl-bg-elevated)]">
              <Lock size={16} className="mt-0.5 shrink-0 text-amber-500" />
              <span>
                <span className="block font-semibold text-[var(--esl-text-primary)]">Нэмэлт дэлгүүр нээх</span>
                <span className="block text-[11px] text-[var(--esl-text-muted)]">Стандарт болон дээш багцад 2+ дэлгүүр нээгдэнэ</span>
              </span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
