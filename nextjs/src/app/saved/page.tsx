'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Package } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import MobileNav from '@/components/shared/MobileNav';
import SafeImage from '@/components/ui/SafeImage';
import SavedSearchList from '@/components/feed/SavedSearchList';
import { useAuth } from '@/lib/auth';
import { useHydrated } from '@/lib/hooks/useHydrated';

type SavedItem = { id: string; title: string; price?: number | null; images: string[]; district?: string | null; status: string };

export default function SavedListingsPage() {
  const hydrated = useHydrated();
  const { isLoggedIn } = useAuth();
  const [items, setItems] = useState<SavedItem[] | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    const t = localStorage.getItem('token');
    fetch('/api/listing-favorites', { headers: t ? { Authorization: `Bearer ${t}` } : {}, credentials: 'include' })
      .then((r) => r.json())
      .then((b) => setItems(b?.success ? b.data : []))
      .catch(() => setItems([]));
  }, [isLoggedIn]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--esl-bg-page)] pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6">
          {hydrated && isLoggedIn && <SavedSearchList />}
          <h1 className="mb-4 flex items-center gap-2 text-xl font-extrabold text-[var(--esl-text-primary)]">
            <Heart className="h-5 w-5 text-[#E8242C]" /> Хадгалсан зарууд
          </h1>
          {hydrated && !isLoggedIn ? (
            <p className="text-sm text-[var(--esl-text-muted)]">
              Хадгалсан зараа харахын тулд <Link href="/login?redirect=/saved" className="font-bold text-[#E8242C]">нэвтэрнэ үү</Link>.
            </p>
          ) : items === null ? (
            <p className="text-sm text-[var(--esl-text-muted)]">Ачаалж байна...</p>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-8 text-center text-sm text-[var(--esl-text-muted)]">
              Хадгалсан зар алга. Зарын хуудсан дээрх ♡ товчоор хадгалаарай.
              <div className="mt-4"><Link href="/feed" className="rounded-xl bg-[#E8242C] px-5 py-2.5 font-bold text-white no-underline">Зарын булан</Link></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((i) => (
                <Link key={i.id} href={`/feed/${i.id}`} className="overflow-hidden rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] no-underline">
                  <div className="relative aspect-[4/3] bg-[var(--esl-bg-section)]">
                    {i.images?.[0] ? (
                      <SafeImage src={i.images[0]} alt={i.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[var(--esl-text-muted)]"><Package size={36} /></div>
                    )}
                    {i.status !== 'active' && (
                      <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[11px] text-white">Идэвхгүй</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-semibold text-[var(--esl-text-primary)]">{i.title}</p>
                    <p className="mt-1 text-sm font-extrabold text-[#E8242C]">{i.price ? `${i.price.toLocaleString()}₮` : 'Үнэ тохиролцоно'}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <MobileNav />
    </>
  );
}
