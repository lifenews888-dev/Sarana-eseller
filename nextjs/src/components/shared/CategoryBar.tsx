'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  categoryPathInfo,
  categoryTreeFallback,
  flattenCategoryTree,
  type CategoryTreeNode,
} from '@/lib/marketplaceCategories';

interface CategoryBarProps {
  value: string;
  onChange: (slug: string) => void;
  entityType?: string;
}

const FALLBACK_CATEGORIES = categoryTreeFallback();
const FALLBACK_CATEGORY_COUNT = FALLBACK_CATEGORIES.length;
const FALLBACK_FLAT_COUNT = flattenCategoryTree(FALLBACK_CATEGORIES).length;

function isCompleteTree(categories: CategoryTreeNode[]): boolean {
  return categories.length >= FALLBACK_CATEGORY_COUNT && flattenCategoryTree(categories).length >= FALLBACK_FLAT_COUNT;
}

function matchesEntityType(category: CategoryTreeNode, entityType?: string): boolean {
  const normalized = entityType?.trim().toLowerCase();
  if (!normalized) return true;
  if (!category.entityTypes?.length) return true;

  return category.entityTypes.some((type) => {
    const value = String(type).toLowerCase();
    return value === normalized || value.replace(/_/g, '-') === normalized;
  });
}

export default function CategoryBar({ value, onChange, entityType }: CategoryBarProps) {
  const [categories, setCategories] = useState<CategoryTreeNode[]>(FALLBACK_CATEGORIES);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activePath = categoryPathInfo(value);
  const activeRoot = activePath?.rootKey || value;

  useEffect(() => {
    let cancelled = false;

    fetch('/api/categories/tree')
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        const data = res.data || res;
        const tree = Array.isArray(data.categories) ? data.categories : [];
        setCategories(isCompleteTree(tree) ? tree : FALLBACK_CATEGORIES);
      })
      .catch(() => {
        if (!cancelled) setCategories(FALLBACK_CATEGORIES);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleCategories = categories.filter((category) => matchesEntityType(category, entityType));

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' });
  };

  if (visibleCategories.length === 0) return null;

  return (
    <div className="relative flex items-center gap-1">
      <button
        type="button"
        aria-label="Ангилал зүүн тийш гүйлгэх"
        onClick={() => scroll('left')}
        className="shrink-0 p-1 rounded-full hover:bg-[var(--esl-bg-hover)] text-[var(--esl-text-disabled)]"
      >
        <ChevronLeft size={16} />
      </button>

      <div ref={scrollRef} className="flex gap-1.5 overflow-x-auto scrollbar-hide py-1 px-1">
        <button
          type="button"
          onClick={() => onChange('all')}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap ${
            value === 'all'
              ? 'bg-[#E8242C] text-white'
              : 'bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)] border border-[var(--esl-border)] hover:border-[#E8242C]'
          }`}
        >
          Бүгд
        </button>
        {visibleCategories.map((category) => {
          const isActive = value === category.slug || activeRoot === category.slug;
          const label = category.name || category.slug;

          return (
            <button
              key={category.id || category.slug}
              type="button"
              onClick={() => onChange(category.slug)}
              aria-pressed={isActive}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap ${
                isActive
                  ? 'bg-[#E8242C] text-white'
                  : 'bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)] border border-[var(--esl-border)] hover:border-[#E8242C]'
              }`}
            >
              {category.icon ? `${category.icon} ` : ''}{label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Ангилал баруун тийш гүйлгэх"
        onClick={() => scroll('right')}
        className="shrink-0 p-1 rounded-full hover:bg-[var(--esl-bg-hover)] text-[var(--esl-text-disabled)]"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
