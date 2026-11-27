'use client';

import { useEffect, useState } from 'react';

/** Уншаагүй зарын мессежийн тоо — 30 секунд тутамд болон цонх идэвхжихэд шинэчилнэ. */
export function useListingUnread(enabled: boolean): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = () => {
      const t = localStorage.getItem('token');
      fetch('/api/listing-chats/unread', { headers: t ? { Authorization: `Bearer ${t}` } : {}, credentials: 'include', cache: 'no-store' })
        .then((r) => r.json())
        .then((b) => { if (!cancelled) setCount(Number(b?.data?.count) || 0); })
        .catch(() => null);
    };
    load();
    const timer = window.setInterval(load, 30_000);
    window.addEventListener('focus', load);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', load);
    };
  }, [enabled]);

  return enabled ? count : 0;
}
