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
  setActiveCat: (cat: string) => void;
}

export default function SaleSlider({ products, quickAdd, findProduct, setSelProduct, wishlist, toggleWL, setActiveCat }: SaleSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 480;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section style={{ background: '#0F0F0F', borderTop: '1px solid #1A1A1A', borderBottom: '1px solid #1A1A1A' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '32px 16px', position: 'relative' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 4, height: 24, borderRadius: 4, background: '#E31E24' }} />
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#FFF', margin: 0 }}>Хямдралтай бараа</h2>
            <span style={{ background: '#E31E24', color: '#FFF', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>Sale</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => scroll('left')} style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--esl-bg-card)', border: '1px solid #3D3D3D', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A0A0A0' }}>
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => scroll('right')} style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--esl-bg-card)', border: '1px solid #3D3D3D', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A0A0A0' }}>
              <ChevronRight size={18} />
            </button>
            <button onClick={() => setActiveCat('all')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E31E24', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
              Бүгд <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: 20,
            overflowX: 'scroll',
            overflowY: 'hidden',
            paddingBottom: 8,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {products.map(p => {
            const productId = p._id || p.id || p.name;
            return (
            <div key={productId} style={{ flex: '0 0 224px', minWidth: 224 }}>
              <ProductCard
                product={p}
                onQuickAdd={quickAdd}
                onClick={id => setSelProduct(findProduct(id))}
                isWished={wishlist.has(productId)}
                onToggleWish={toggleWL}
              />
            </div>
          );})}
        </div>
      </div>

      <style>{`
        div[style*="overflowX: scroll"]::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}
