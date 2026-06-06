'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';

interface Suggestion {
  products: { id: string; name: string; price: number; images?: string[]; emoji?: string }[];
  shops: { id: string; name: string; slug: string; storefrontSlug?: string; logo?: string }[];
  categories: { id: string; name: string; slug: string; icon?: string }[];
}

export default function SearchBar({ placeholder = 'Бараа, дэлгүүр хайх...', size = 'md' }: { placeholder?: string; size?: 'sm' | 'md' | 'lg' }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) return undefined;

    const timeout = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`)
        .then(r => r.json()).then(d => { setSuggestions(d); setOpen(true); }).catch(() => {});
    }, 300);

    return () => clearTimeout(timeout);
  }, [q]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const submit = () => { if (q.trim()) { router.push(`/search?q=${encodeURIComponent(q)}`); setOpen(false); } };
  const updateQuery = (value: string) => {
    setQ(value);
    if (value.trim().length >= 2) return;
    setSuggestions(null);
    setOpen(false);
  };
  const h = size === 'lg' ? 'h-14 text-base' : size === 'sm' ? 'h-9 text-xs' : 'h-11 text-sm';
  const hasSuggestions = suggestions && (suggestions.products.length > 0 || suggestions.shops.length > 0 || suggestions.categories.length > 0);

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--esl-text-muted)' }} />
        <input value={q} onChange={e => updateQuery(e.target.value)} onFocus={() => hasSuggestions && setOpen(true)}
          onKeyDown={e => e.key === 'Enter' && submit()} placeholder={placeholder}
          className={`w-full pl-12 pr-10 ${h} rounded-2xl outline-none transition-all focus:ring-2 focus:ring-[#E8242C]/30`}
          style={{ background: 'var(--esl-bg-card)', border: '1.5px solid var(--esl-border)', color: 'var(--esl-text-primary)' }} />
        {q && <button onClick={() => { setQ(''); setSuggestions(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 border-none bg-transparent cursor-pointer" style={{ color: 'var(--esl-text-muted)' }}><X className="w-4 h-4" /></button>}
      </div>

      {/* Autocomplete dropdown */}
      {open && hasSuggestions && (
        <div className="absolute z-50 w-full mt-2 rounded-xl overflow-hidden shadow-2xl" style={{ background: 'var(--esl-bg-card)', border: '1px solid var(--esl-border)' }}>
          {suggestions!.products.length > 0 && (
            <div className="p-2">
              <p className="text-[10px] font-bold uppercase px-2 mb-1" style={{ color: 'var(--esl-text-muted)' }}>Бараа</p>
              {suggestions!.products.map(p => (
                <div key={p.id} onClick={() => { router.push(`/product/${p.id}`); setOpen(false); }}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer hover:bg-[var(--esl-bg-section)] transition-colors">
                  {p.images?.[0] ? <SafeImage src={p.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover" /> :
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: 'var(--esl-bg-section)' }}>{p.emoji || '📦'}</span>}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--esl-text-primary)' }}>{p.name}</p>
                    <p className="text-xs font-bold" style={{ color: '#E8242C' }}>{p.price.toLocaleString()}₮</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {suggestions!.shops.length > 0 && (
            <div className="p-2 border-t" style={{ borderColor: 'var(--esl-border)' }}>
              <p className="text-[10px] font-bold uppercase px-2 mb-1" style={{ color: 'var(--esl-text-muted)' }}>Дэлгүүр</p>
              {suggestions!.shops.map(s => (
                <div key={s.id} onClick={() => { router.push(`/${s.storefrontSlug || s.slug}`); setOpen(false); }}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer hover:bg-[var(--esl-bg-section)] transition-colors">
                  {s.logo ? <SafeImage src={s.logo} alt="" className="w-8 h-8 rounded-lg object-cover" /> :
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ background: '#E8242C' }}>{s.name[0]}</div>}
                  <p className="text-xs font-medium" style={{ color: 'var(--esl-text-primary)' }}>{s.name}</p>
                </div>
              ))}
            </div>
          )}
          {suggestions!.categories.length > 0 && (
            <div className="p-2 border-t" style={{ borderColor: 'var(--esl-border)' }}>
              <p className="text-[10px] font-bold uppercase px-2 mb-1" style={{ color: 'var(--esl-text-muted)' }}>Ангилал</p>
              {suggestions!.categories.map(c => (
                <div key={c.id} onClick={() => { router.push(`/search?category=${c.id}`); setOpen(false); }}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-[var(--esl-bg-section)] transition-colors">
                  <span>{c.icon || '📁'}</span>
                  <p className="text-xs font-medium" style={{ color: 'var(--esl-text-primary)' }}>{c.name}</p>
                </div>
              ))}
            </div>
          )}
          <div className="p-2 border-t" style={{ borderColor: 'var(--esl-border)' }}>
            <button onClick={submit} className="w-full py-2 rounded-lg text-xs font-semibold border-none cursor-pointer" style={{ background: 'var(--esl-bg-section)', color: '#E8242C' }}>
              &quot;{q}&quot; хайх →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
