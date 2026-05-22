'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Eye, Trash2, MapPin, Package, Loader2, Pencil } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface Listing {
  id: string;
  title: string;
  price: number | null;
  images: string[];
  district: string | null;
  entityType?: string | null;
  status: string;
  tier: string;
  viewCount: number;
  createdAt: string;
}

export default function ListingsPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const entityType = user?.entityType || 'store';
  const createHref = `/dashboard/store/listings/new?entityType=${entityType}`;

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/feed?mine=1&limit=50', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(d => {
        const all = [...(d.data?.vip || d.vip || []), ...(d.data?.featured || d.featured || []), ...(d.data?.discounted || d.discounted || []), ...(d.data?.normal || d.normal || [])];
        setListings(all);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const deleteListing = async (id: string) => {
    if (!confirm('Устгах уу?')) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/feed/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setListings(prev => prev.filter(l => l.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--esl-text-primary)]">Зарууд</h1>
          <p className="text-sm text-[var(--esl-text-secondary)]">{listings.length} зар</p>
        </div>
        <Link href={createHref}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#E8242C] text-white rounded-xl font-bold text-sm no-underline hover:bg-red-700 transition">
          <Plus className="w-4 h-4" /> Зар нэмэх
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--esl-text-muted)]" />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)]">
          <Package className="w-12 h-12 mx-auto text-[var(--esl-text-muted)] opacity-20 mb-4" />
          <h3 className="text-lg font-bold text-[var(--esl-text-primary)] mb-2">Зар байхгүй байна</h3>
          <p className="text-sm text-[var(--esl-text-muted)] mb-6">Эхний зараа нэмэцгээе</p>
          <Link href={createHref}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#E8242C] text-white rounded-xl font-bold text-sm no-underline">
            <Plus className="w-4 h-4" /> Зар нэмэх
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map(item => (
            <div key={item.id} className="flex items-center gap-4 bg-[var(--esl-bg-card)] rounded-xl p-4 border border-[var(--esl-border)]">
              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-[var(--esl-bg-section)]">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-[var(--esl-text-disabled)]" /></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[var(--esl-text-primary)] truncate">{item.title}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {item.price && <span className="text-[#E8242C] font-bold text-sm">{item.price.toLocaleString()}₮</span>}
                  {item.district && (
                    <span className="flex items-center gap-1 text-xs text-[var(--esl-text-muted)]"><MapPin className="w-3 h-3" />{item.district}</span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {item.status === 'active' ? 'Идэвхтэй' : 'Хүлээгдэж'}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-[var(--esl-text-muted)]"><Eye className="w-3 h-3" />{item.viewCount}</span>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <Link href={`/feed/${item.id}`} target="_blank"
                  className="w-8 h-8 rounded-lg bg-[var(--esl-bg-section)] border border-[var(--esl-border)] flex items-center justify-center text-[var(--esl-text-muted)] no-underline hover:bg-[var(--esl-bg-card)]">
                  <Eye className="w-4 h-4" />
                </Link>
                <Link href={`/dashboard/store/listings/new?entityType=${item.entityType || entityType}&edit=${item.id}`}
                  className="w-8 h-8 rounded-lg bg-[var(--esl-bg-section)] border border-[var(--esl-border)] flex items-center justify-center text-[var(--esl-text-muted)] no-underline hover:bg-[var(--esl-bg-card)]">
                  <Pencil className="w-4 h-4" />
                </Link>
                <button onClick={() => deleteListing(item.id)}
                  className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-500 cursor-pointer hover:bg-red-100">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
