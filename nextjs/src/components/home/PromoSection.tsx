'use client';

import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';

type PromoProduct = {
  id: string;
  name: string;
  price?: number | null;
  media?: { url?: string | null }[];
  entity?: { name?: string | null } | null;
};

export default function PromoSection({ products, title }: { products: PromoProduct[]; title?: string }) {
  if (products.length === 0) return null;

  return (
    <section className="max-w-[1200px] mx-auto px-4 pb-10">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-[var(--esl-text)] text-xl font-bold">
          {title || 'Хямдралтай бараа'}
        </h2>
        <Link href="/store?sale=true" className="text-[#E8242C] text-sm font-semibold no-underline">
          Бүгд →
        </Link>
      </div>

      <div
        className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide sm:gap-4"
        style={{ WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}
      >
        {products.map((p) => (
          <Link key={p.id} href={`/product/${p.id}`} className="no-underline snap-start">
            <div className="min-w-[148px] max-w-[148px] overflow-hidden rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] transition-transform sm:min-w-[180px] sm:max-w-[200px] sm:rounded-2xl [@media(hover:hover)]:hover:-translate-y-1">
              <div className="relative aspect-square overflow-hidden bg-[var(--esl-bg-section)]">
                <SafeImage src={p.media?.[0]?.url} alt={p.name} className="h-full w-full object-cover" />
                <div className="absolute right-2 top-2 rounded-md bg-[#E8242C] px-1.5 py-0.5 text-[10px] font-bold text-white sm:text-[11px]">
                  SALE
                </div>
              </div>
              <div className="p-2 sm:p-3">
                <p className="mb-1.5 line-clamp-2 min-h-[2.4em] text-[12px] font-semibold leading-snug text-[var(--esl-text-primary)] sm:mb-2 sm:text-[13px]">{p.name}</p>
                <span className="text-[13px] font-extrabold tabular-nums text-[#E8242C] sm:text-[15px]">
                  {p.price?.toLocaleString()}₮
                </span>
                {p.entity && (
                  <p className="mt-1 truncate text-[10px] text-[var(--esl-text-muted)] sm:text-[11px]">{p.entity.name}</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
