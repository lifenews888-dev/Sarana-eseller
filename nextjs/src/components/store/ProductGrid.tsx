'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/api';
import type { ItemType } from '@/lib/marketplace';
import ProductCard from './ProductCard';
import ProductCardSkeleton from '../shared/Skeleton';
import { Sparkles, Package, Scissors, Search } from 'lucide-react';

const TYPE_TABS = [
  { key: 'all' as const, label: 'Бүгд', icon: Sparkles },
  { key: 'product' as const, label: 'Бараа', icon: Package },
  { key: 'service' as const, label: 'Үйлчилгээ', icon: Scissors },
];

const FILTER_CATEGORIES = [
  { key: 'all', label: 'Бүгд', emoji: '🛍' },
  { key: 'food-beverage', label: 'Хоол хүнс', emoji: '🍔' },
  { key: 'fashion', label: 'Хувцас', emoji: '👗' },
  { key: 'electronics', label: 'Электроник', emoji: '📱' },
  { key: 'beauty-health', label: 'Гоо сайхан', emoji: '💄' },
  { key: 'home-living', label: 'Гэр ахуй', emoji: '🏡' },
  { key: 'sports-travel', label: 'Спорт', emoji: '⚽' },
  { key: 'kids-toys', label: 'Хүүхдийн', emoji: '🧸' },
  { key: 'auto-moto', label: 'Авто', emoji: '🚗' },
];

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  activeType: 'all' | ItemType;
  activeCat: string;
  onTypeChange: (type: 'all' | ItemType) => void;
  onCatChange: (cat: string) => void;
  onClearFilters: () => void;
  onProductClick: (id: string) => void;
  onQuickAdd: (product: Product) => void;
  wishlist: Set<string>;
  onToggleWish: (id: string) => void;
}

export default function ProductGrid({
  products, loading, activeType, activeCat, onTypeChange, onCatChange,
  onClearFilters, onProductClick, onQuickAdd, wishlist, onToggleWish,
}: ProductGridProps) {
  return (
    <section className="bg-[var(--esl-bg-page)]">
      <div className="max-w-[1320px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full bg-[#E8242C]" />
            <h2 className="text-xl font-black text-white">
              {activeType === 'service' ? 'Үйлчилгээ' : activeType === 'product' ? 'Бараа бүтээгдэхүүн' : 'Бүх бараа & үйлчилгээ'}
            </h2>
          </div>
          <span className="text-sm text-[var(--esl-text-muted)] font-medium bg-[var(--esl-bg-card)] px-3 py-1 rounded-lg">
            {products.length} {activeType === 'service' ? 'үйлчилгээ' : 'бараа'}
          </span>
        </div>

        {/* Type tabs */}
        <div className="flex items-center gap-2 mb-4">
          {TYPE_TABS.map((t) => (
            <button key={t.key} onClick={() => onTypeChange(t.key)}
              className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border-none cursor-pointer transition-all',
                activeType === t.key ? 'bg-[#E8242C] text-white shadow-sm' : 'bg-[var(--esl-bg-card)] text-[var(--esl-text-muted)] border border-[var(--esl-border)] hover:bg-[var(--esl-bg-elevated)]')}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-none pb-1">
          {FILTER_CATEGORIES.map((c) => (
            <button key={c.key} onClick={() => onCatChange(c.key)}
              className={cn('shrink-0 px-4 py-2 rounded-full text-xs font-semibold border cursor-pointer transition-all whitespace-nowrap',
                activeCat === c.key ? 'bg-[#E8242C] text-white border-[#E8242C]' : 'bg-[var(--esl-bg-card)] text-[var(--esl-text-muted)] border-[var(--esl-border)] hover:border-[#E8242C]')}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-[var(--esl-bg-card)] flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-[#3D3D3D]" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Бараа олдсонгүй</h3>
            <p className="text-sm text-[var(--esl-text-muted)] mb-4">Өөр хайлтаар дахин оролдоно уу</p>
            <button onClick={onClearFilters}
              className="text-sm font-bold text-[#FF4D53] bg-[rgba(232,36,44,0.15)] px-5 py-2.5 rounded-xl border-none cursor-pointer hover:bg-[rgba(232,36,44,0.25)] transition">
              Шүүлтүүр цэвэрлэх
            </button>
          </div>
        ) : (
          <motion.div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"
            initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.03 } } }}>
            {products.map((p) => {
              const productId = p._id || p.id || p.name;
              return (
              <motion.div key={productId} variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
                <ProductCard product={p} onQuickAdd={onQuickAdd} onClick={onProductClick}
                  isWished={wishlist.has(productId)} onToggleWish={onToggleWish} />
              </motion.div>
            );})}
          </motion.div>
        )}
      </div>
    </section>
  );
}
