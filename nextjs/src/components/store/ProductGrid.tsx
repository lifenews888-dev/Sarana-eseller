'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/api';
import type { ItemType } from '@/lib/marketplace';
import { MARKETPLACE_CATEGORIES } from '@/lib/marketplaceCategories';
import ProductCard from './ProductCard';
import ProductCardSkeleton from '../shared/Skeleton';
import { ArrowDownNarrowWide, ArrowUpNarrowWide, Sparkles, Package, Scissors, Search, Star, Tag, X } from 'lucide-react';

export type StoreSortKey = 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'discount';

const TYPE_TABS = [
  { key: 'all' as const, label: 'Бүгд', icon: Sparkles },
  { key: 'product' as const, label: 'Бараа', icon: Package },
  { key: 'service' as const, label: 'Үйлчилгээ', icon: Scissors },
];

const SORT_OPTIONS: { key: StoreSortKey; label: string; icon: typeof Sparkles }[] = [
  { key: 'newest', label: 'Шинэ эхэндээ', icon: Sparkles },
  { key: 'price_asc', label: 'Үнэ өсөх', icon: ArrowUpNarrowWide },
  { key: 'price_desc', label: 'Үнэ буурах', icon: ArrowDownNarrowWide },
  { key: 'rating', label: 'Үнэлгээ өндөр', icon: Star },
  { key: 'discount', label: 'Хямдрал их', icon: Tag },
];

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  activeType: 'all' | ItemType;
  activeCat: string;
  onTypeChange: (type: 'all' | ItemType) => void;
  onCatChange: (cat: string) => void;
  onClearFilters: () => void;
  onDealChange: (enabled: boolean) => void;
  onSearchChange: (query: string) => void;
  activeSort: StoreSortKey;
  onSortChange: (sort: StoreSortKey) => void;
  onProductClick: (id: string) => void;
  onQuickAdd: (product: Product) => void;
  wishlist: Set<string>;
  onToggleWish: (id: string) => void;
  dealOnly?: boolean;
  searchQuery?: string;
}

export default function ProductGrid({
  products, loading, activeType, activeCat, onTypeChange, onCatChange,
  onClearFilters, onDealChange, onSearchChange, activeSort, onSortChange, onProductClick, onQuickAdd, wishlist, onToggleWish,
  dealOnly = false, searchQuery = '',
}: ProductGridProps) {
  const filterCategories = [
    { key: 'all', label: 'Бүгд', emoji: '🛍' },
    ...MARKETPLACE_CATEGORIES.map((category) => ({
      key: category.key,
      label: category.shortLabel || category.label,
      emoji: category.emoji,
    })),
  ];
  const activeCategory = MARKETPLACE_CATEGORIES.find((category) => category.key === activeCat);
  const sectionTitle = dealOnly
    ? 'Хямдралтай бараа'
    : 'Нэгдсэн ангиллын зарууд';
  const activeFilters = [
    activeCat !== 'all'
      ? { key: 'category', label: activeCategory?.label || activeCat, onClear: () => onCatChange('all') }
      : null,
    activeType !== 'all'
      ? { key: 'type', label: TYPE_TABS.find((t) => t.key === activeType)?.label || activeType, onClear: () => onTypeChange('all') }
      : null,
    dealOnly ? { key: 'deal', label: 'Хямдралтай', onClear: () => onDealChange(false) } : null,
    activeSort !== 'newest'
      ? { key: 'sort', label: `Эрэмбэ: ${SORT_OPTIONS.find((option) => option.key === activeSort)?.label || activeSort}`, onClear: () => onSortChange('newest') }
      : null,
    searchQuery.trim() ? { key: 'search', label: `Хайлт: ${searchQuery.trim()}`, onClear: () => onSearchChange('') } : null,
  ].filter((item): item is { key: string; label: string; onClear: () => void } => Boolean(item));

  return (
    <section className="bg-[var(--esl-bg-page)]">
      <div className="max-w-[1320px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full bg-[#E8242C]" />
            <h2 className="text-xl font-black text-white">
              {sectionTitle}
            </h2>
          </div>
          <span className="text-sm text-[var(--esl-text-muted)] font-medium bg-[var(--esl-bg-card)] px-3 py-1 rounded-lg">
            {products.length} зар
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

        {/* Sort controls */}
        <div className="mb-4 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <span className="shrink-0 text-xs font-semibold text-[var(--esl-text-muted)]">Эрэмбэ:</span>
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onSortChange(option.key)}
              className={cn(
                'shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition',
                activeSort === option.key
                  ? 'border-[#E8242C] bg-[rgba(232,36,44,0.16)] text-[#FF6B70]'
                  : 'border-[var(--esl-border)] bg-[var(--esl-bg-card)] text-[var(--esl-text-muted)] hover:border-[#E8242C]/60 hover:text-[var(--esl-text-primary)]'
              )}
            >
              <option.icon className="h-3.5 w-3.5" />
              {option.label}
            </button>
          ))}
        </div>

        {/* Category pills */}
        <div className={cn('flex items-center gap-2 overflow-x-auto scrollbar-none pb-1', activeFilters.length > 0 ? 'mb-3' : 'mb-6')}>
          {filterCategories.map((c) => (
            <button key={c.key} onClick={() => onCatChange(c.key)}
              className={cn('shrink-0 px-4 py-2 rounded-full text-xs font-semibold border cursor-pointer transition-all whitespace-nowrap',
                activeCat === c.key ? 'bg-[#E8242C] text-white border-[#E8242C]' : 'bg-[var(--esl-bg-card)] text-[var(--esl-text-muted)] border-[var(--esl-border)] hover:border-[#E8242C]')}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {activeCategory && activeCategory.subcategories.length > 0 && (
          <div className="mb-4 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-3 py-3">
            <div className="mb-2 text-xs font-semibold text-[var(--esl-text-muted)]">
              {activeCategory.label} дэд ангилал
            </div>
            <div className="flex flex-wrap gap-2">
              {activeCategory.subcategories.map((subcategory) => (
                <span
                  key={subcategory}
                  className="rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-muted)] px-2.5 py-1.5 text-xs font-medium text-[var(--esl-text-muted)]"
                >
                  {subcategory}
                </span>
              ))}
            </div>
          </div>
        )}

        {activeFilters.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-3 py-2.5">
            <span className="text-xs font-semibold text-[var(--esl-text-muted)]">Идэвхтэй:</span>
            {activeFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={filter.onClear}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E8242C]/30 bg-[rgba(232,36,44,0.14)] px-2.5 text-xs font-semibold text-[#FF6B70] transition hover:bg-[rgba(232,36,44,0.24)]"
              >
                <span className="max-w-[180px] truncate">{filter.label}</span>
                <X className="h-3.5 w-3.5" />
              </button>
            ))}
            <button
              type="button"
              onClick={onClearFilters}
              className="ml-auto h-8 rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-muted)] px-3 text-xs font-semibold text-[var(--esl-text-muted)] transition hover:text-[var(--esl-text)]"
            >
              Бүгдийг цэвэрлэх
            </button>
          </div>
        )}

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
