'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { Search, X } from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';

interface Suggestion {
  id: string;
  name: string;
  price: number;
  image?: string;
  emoji?: string;
  category?: string;
}

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export default function SearchBar({ value, onChange, inputRef }: SearchBarProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced fetch
  useEffect(() => {
    if (value.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(value)}`);
        const { data } = await res.json();
        setSuggestions(data?.suggestions || []);
        setShowDropdown(true);
      } catch { setSuggestions([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [value]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="flex-1 max-w-2xl relative" ref={dropdownRef}>
      <div className="relative flex">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder="Бараа, дэлгүүр хайх..."
          className="w-full h-11 pl-4 pr-20 rounded-xl bg-[var(--esl-bg-section)] border-2 border-transparent text-sm outline-none focus:border-[#E31E24] focus:bg-[var(--esl-bg-card)] transition-all"
        />
        {value && (
          <button onClick={() => { onChange(''); setSuggestions([]); }}
            className="absolute right-12 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center border-none cursor-pointer hover:bg-gray-300 transition">
            <X className="w-3 h-3 text-[var(--esl-text-secondary)]" />
          </button>
        )}
        <button className="absolute right-1 top-1 bottom-1 px-3 bg-[#E31E24] text-white rounded-lg border-none cursor-pointer hover:bg-[#C41A1F] transition flex items-center justify-center">
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[var(--esl-bg-card)] rounded-xl shadow-xl border border-[var(--esl-border)] z-50 overflow-hidden max-h-[400px] overflow-y-auto">
          {suggestions.map((s) => (
            <Link key={s.id} href={`/store/${s.id}`} onClick={() => setShowDropdown(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--esl-bg-section)] transition no-underline">
              <div className="w-10 h-10 rounded-lg bg-[var(--esl-bg-section)] flex items-center justify-center text-lg shrink-0 overflow-hidden">
                {s.image ? <SafeImage src={s.image} alt="" className="w-full h-full object-cover" /> : (s.emoji || '📦')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--esl-text-primary)] truncate">{s.name}</p>
                {s.category && <p className="text-[10px] text-[var(--esl-text-muted)]">{s.category}</p>}
              </div>
              <span className="text-sm font-bold text-[#E31E24] shrink-0">{formatPrice(s.price)}</span>
            </Link>
          ))}
          <div className="px-4 py-2 border-t border-[var(--esl-border)] text-center">
            <span className="text-xs text-[var(--esl-text-muted)]">{suggestions.length} бараа олдлоо</span>
          </div>
        </div>
      )}

      {showDropdown && value.length >= 2 && suggestions.length === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[var(--esl-bg-card)] rounded-xl shadow-xl border border-[var(--esl-border)] z-50 p-6 text-center">
          <p className="text-sm text-[var(--esl-text-muted)]">"{value}" хайлтаар бараа олдсонгүй</p>
        </div>
      )}
    </div>
  );
}
