'use client';

import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';

type FeaturedShop = {
  id: string;
  name?: string | null;
  logoUrl?: string | null;
  storefrontSlug?: string | null;
  rating?: number | null;
  _count?: { products?: number | null } | null;
};

export default function FeaturedShops({ entities }: { entities: FeaturedShop[] }) {
  if (entities.length === 0) return null;

  return (
    <section className="max-w-[1200px] mx-auto px-4 pb-10">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-[var(--esl-text-primary)] text-xl font-bold">
          Онцлох дэлгүүрүүд
        </h2>
        <Link href="/shops" className="text-[#E8242C] text-sm font-semibold no-underline">
          Бүх дэлгүүр →
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {entities.map((e) => (
          <Link key={e.id} href={`/${e.storefrontSlug}`} className="no-underline">
            <div className="bg-[var(--esl-bg-card)] rounded-2xl p-5 border border-[var(--esl-border)] text-center min-w-[150px] hover:border-[#E8242C] hover:-translate-y-0.5 transition-all cursor-pointer">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden flex items-center justify-center"
                style={{ background: e.logoUrl ? 'transparent' : '#E8242C' }}
              >
                {e.logoUrl ? (
                  <SafeImage src={e.logoUrl} alt={e.name || 'Дэлгүүр'} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-white text-2xl font-bold">{e.name?.[0]}</span>
                )}
              </div>
              <p className="text-[var(--esl-text-primary)] font-semibold text-[13px] mb-1.5">{e.name}</p>
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-[#F9A825]">★</span>
                <span className="text-[var(--esl-text-muted)] text-xs">{e.rating?.toFixed(1) || '5.0'}</span>
              </div>
              <p className="text-[var(--esl-text-muted)] text-[11px]">{e._count?.products || 0} бараа</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
