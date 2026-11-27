'use client';

import { useEffect, useState } from 'react';

/** Хадгалсан хайлтад тохирох шинэ зарын нийт тоо — 2 минут тутамд, цонх идэвхжихэд шинэчилнэ */
export function useSavedSearchCount(enabled: boolean): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = () => {
      const t = localStorage.getItem('token');
      fetch('/api/saved-searches/count', { headers: t ? { Authorization: `Bearer ${t}` } : {}, credentials: 'include', cache: 'no-store' })
        .then((r) => r.json())
        .then((b) => { if (!cancelled) setCount(Number(b?.data?.count) || 0); })
        .catch(() => null);
    };
    load();
    const timer = window.setInterval(load, 120_000);
    window.addEventListener('focus', load);
    window.addEventListener('eseller:saved-searches-changed', load);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', load);
      window.removeEventListener('eseller:saved-searches-changed', load);
    };
  }, [enabled]);
  return enabled ? count : 0;
}
