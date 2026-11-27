'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellRing } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useHydrated } from '@/lib/hooks/useHydrated';

/**
 * "Хайлт хадгалах" — одоогийн шүүлтүүрээр шинэ зар гарвал навбарын 🔔 дээр мэдэгдэнэ.
 * Хадгалсан хайлтаас (?ss=<id>) орж ирсэн бол тэр хайлтыг "үзсэн" болгоно.
 */
export default function SaveSearchButton({ query }: { query: string }) {
  const hydrated = useHydrated();
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  // Шүүлтүүр өөрчлөгдөхөд товчийг дахин идэвхжүүлнэ
  useEffect(() => { setState('idle'); setMsg(''); }, [query]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const ss = new URLSearchParams(window.location.search).get('ss');
    if (!ss || !/^[a-f\d]{24}$/i.test(ss)) return;
    const t = localStorage.getItem('token');
    fetch(`/api/saved-searches/${ss}/seen`, { method: 'POST', headers: t ? { Authorization: `Bearer ${t}` } : {}, credentials: 'include' })
      .then(() => window.dispatchEvent(new Event('eseller:saved-searches-changed')))
      .catch(() => null);
  }, [isLoggedIn]);

  if (!hydrated || !query) return null;

  const save = async () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(`/feed?${query}`)}`);
      return;
    }
    setState('saving');
    const t = localStorage.getItem('token');
    try {
      const r = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
        credentials: 'include',
        body: JSON.stringify({ query }),
      });
      const b = await r.json();
      if (!b?.success) throw new Error(b?.error || 'Хадгалж чадсангүй');
      setState('saved');
      setMsg(b.data?.duplicate ? 'Энэ хайлт аль хэдийн хадгалагдсан.' : 'Хадгаллаа. Шинэ зар гарвал 🔔 дээр мэдэгдэнэ.');
      window.dispatchEvent(new Event('eseller:saved-searches-changed'));
    } catch (e) {
      setState('error');
      setMsg(e instanceof Error ? e.message : 'Хадгалж чадсангүй');
    }
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={save}
        disabled={state === 'saving' || state === 'saved'}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E8242C] px-4 text-sm font-bold text-[#E8242C] transition hover:bg-[#E8242C]/10 disabled:opacity-70"
      >
        {state === 'saved' ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        {state === 'saved' ? 'Хадгалсан' : 'Хайлт хадгалах · шинэ зар мэдэгдэх'}
      </button>
      {msg && <span className={`text-xs ${state === 'error' ? 'text-red-500' : 'text-[var(--esl-text-muted)]'}`}>{msg}</span>}
    </div>
  );
}
