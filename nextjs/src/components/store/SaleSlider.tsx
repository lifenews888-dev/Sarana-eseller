'use client';

import { useRef } from 'react';
import type { Product } from '@/lib/api';
import ProductCard from './ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SaleSliderProps {
  products: Product[];
  quickAdd: (p: Product) => void;
  findProduct: (id: string) => Product | null;
  setSelProduct: (p: Product | null) => void;
  wishlist: Set<string>;
  toggleWL: (id: string) => void;
  onViewDeals: () => void;
}

export default function SaleSlider({ products, quickAdd, findProduct, setSelProduct, wishlist, toggleWL, onViewDeals }: SaleSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.85;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section className="border-y border-[var(--esl-border)] bg-[var(--esl-bg-section)]">
      <div className="relative mx-auto max-w-[1320px] px-3 py-5 sm:px-4 sm:py-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-2 sm:mb-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="h-5 w-1 shrink-0 rounded bg-[#E31E24] sm:h-6" />
            <h2 className="truncate text-base font-black text-[var(--esl-text-primary)] sm:text-xl">
              Хямдралтай бараа
            </h2>
            <span className="shrink-0 rounded bg-[#E31E24] px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-white">
              Sale
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Зүүн тийш гүйлгэх"
              className="hidden h-9 w-9 items-center justify-center rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-card)] text-[var(--esl-text-muted)] cursor-pointer sm:flex"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Баруун тийш гүйлгэх"
              className="hidden h-9 w-9 items-center justify-center rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-card)] text-[var(--esl-text-muted)] cursor-pointer sm:flex"
            >
              <ChevronRight size={18} />
            </button>
            <button
              type="button"
              onClick={onViewDeals}
              className="flex items-center gap-0.5 border-0 bg-transparent text-xs font-semibold text-[#E31E24] cursor-pointer sm:text-sm"
            >
              Бүгд <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable row — snap + touch-friendly card width */}
        <div
          ref={scrollRef}
          className="flex gap-2.5 overflow-x-auto overflow-y-hidden pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
          style={{ WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}
        >
          {products.map((p) => {
            const productId = p._id || p.id || p.name;
            return (
              <div
                key={productId}
                className="w-[148px] min-w-[148px] shrink-0 snap-start sm:w-[200px] sm:min-w-[200px] md:w-[224px] md:min-w-[224px]"
              >
                <ProductCard
                  product={p}
                  onQuickAdd={quickAdd}
                  onClick={(id) => setSelProduct(findProduct(id))}
                  isWished={wishlist.has(productId)}
                  onToggleWish={toggleWL}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
