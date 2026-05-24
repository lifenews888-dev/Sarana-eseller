'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { categoryTreeFallback } from '@/lib/marketplaceCategories';

interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  level: number;
  parentId: string | null;
  entityTypes: string[];
  children?: Category[];
}

const FALLBACK_ROOTS: Category[] = categoryTreeFallback();

function flattenCategories(categories: Category[]): Category[] {
  return categories.flatMap((category) => [category, ...flattenCategories(category.children || [])]);
}

interface CategorySelectorProps {
  entityType?: string;
  value?: string;
  onChange: (categoryId: string, slug: string) => void;
  label?: string;
}

export default function CategorySelector({ value, onChange, label }: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>(FALLBACK_ROOTS);
  const [flat, setFlat] = useState<Category[]>(flattenCategories(FALLBACK_ROOTS));
  const [loading, setLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  useEffect(() => {
    const applySelection = (all: Category[]) => {
      if (!value) {
        setSelectedPath([]);
        return;
      }
      const cat = all.find((c: Category) => c.id === value || c.slug === value);
      if (!cat) return;

      const path: string[] = [];
      let current: Category | undefined = cat;
      while (current) {
        path.unshift(current.id);
        current = current.parentId ? all.find((candidate) => candidate.id === current?.parentId) : undefined;
      }
      setSelectedPath(path);
    };

    fetch('/api/categories/tree')
      .then((r) => r.json())
      .then((d) => {
        const nextCategories = d.data?.length ? d.data : FALLBACK_ROOTS;
        const nextFlat = flattenCategories(nextCategories);
        setCategories(nextCategories);
        setFlat(nextFlat);
        applySelection(nextFlat);
      })
      .catch(() => {
        const nextCategories = categoryTreeFallback() as Category[];
        const nextFlat = flattenCategories(nextCategories);
        setCategories(nextCategories);
        setFlat(nextFlat);
        applySelection(nextFlat);
      })
      .finally(() => setLoading(false));
  }, [value]);

  const roots = categories;
  const selectedNodes = selectedPath
    .map((id) => flat.find((category) => category.id === id))
    .filter((category): category is Category => Boolean(category));
  const selectLevels = [
    { options: roots, value: selectedPath[0] || '', placeholder: 'Ангилал сонгох...' },
    ...selectedNodes
      .filter((node) => (node.children || []).length > 0)
      .map((node, index) => ({
        options: node.children || [],
        value: selectedPath[index + 1] || '',
        placeholder: `${node.name} дотор сонгох...`,
      })),
  ];

  const handleLevelChange = (level: number, categoryId: string) => {
    const nextPath = categoryId ? [...selectedPath.slice(0, level), categoryId] : selectedPath.slice(0, level);
    setSelectedPath(nextPath);

    const selected = categoryId
      ? flat.find((category) => category.id === categoryId)
      : nextPath.length > 0
        ? flat.find((category) => category.id === nextPath[nextPath.length - 1])
        : null;
    if (selected) onChange(selected.id, selected.slug);
  };

  if (loading) return <div className="text-xs text-[var(--esl-text-secondary)]">Ангилал ачааллаж байна...</div>;

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-[var(--esl-text)]">{label}</label>}

      {selectLevels.map((level, index) => (
        <div key={index} className="relative">
          <select
            value={level.value}
            onChange={(e) => handleLevelChange(index, e.target.value)}
            className="w-full px-3 py-2 bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text)] appearance-none pr-8"
          >
            <option value="">{level.placeholder}</option>
            {level.options.map((c) => (
              <option key={c.id} value={c.id}>{c.icon || '·'} {c.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--esl-text-disabled)] pointer-events-none" />
        </div>
      ))}
    </div>
  );
}
