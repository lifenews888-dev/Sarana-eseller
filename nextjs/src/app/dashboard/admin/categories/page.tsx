'use client';

import { useState, useEffect } from 'react';
import { FolderTree, ChevronRight, ChevronDown, Plus, Star, Edit2 } from 'lucide-react';

interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  level: number;
  sortOrder: number;
  isActive: boolean;
  isApproved: boolean;
  isFeatured: boolean;
  entityTypes: string[];
  children: Category[];
}

interface Stats {
  total: number;
  roots: number;
  subs: number;
  leafs: number;
  featured: number;
}

function CategoryNode({ cat, depth = 0 }: { cat: Category; depth?: number }) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = cat.children?.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[var(--esl-bg-hover)] cursor-pointer group"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => setOpen(!open)}
      >
        {hasChildren ? (
          open ? <ChevronDown size={14} className="text-[var(--esl-text-disabled)]" /> : <ChevronRight size={14} className="text-[var(--esl-text-disabled)]" />
        ) : (
          <span className="w-3.5" />
        )}
        <span className="text-sm">{cat.icon || '📁'}</span>
        <span className="text-sm text-[var(--esl-text)] flex-1">{cat.name}</span>
        {cat.isFeatured && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
        {!cat.isApproved && (
          <span className="px-1.5 py-0.5 text-[10px] bg-yellow-100 text-yellow-700 rounded">Хүлээгдэж буй</span>
        )}
        {cat.entityTypes?.length > 0 && (
          <span className="text-[10px] text-[var(--esl-text-disabled)]">
            {cat.entityTypes.join(', ')}
          </span>
        )}
        {hasChildren && (
          <span className="text-[10px] text-[var(--esl-text-disabled)]">({cat.children.length})</span>
        )}
      </div>
      {open && hasChildren && (
        <div>
          {cat.children.map((child) => (
            <CategoryNode key={child.id} cat={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, roots: 0, subs: 0, leafs: 0, featured: 0 });
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newCat, setNewCat] = useState({ slug: '', name: '', icon: '', parentId: '' });
  const [flat, setFlat] = useState<Category[]>([]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/categories', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setCategories(data.categories || []);
      setFlat(data.flat || []);
      setStats(data.stats || { total: 0, roots: 0, subs: 0, leafs: 0, featured: 0 });
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    const deferred = window.setTimeout(() => { fetchCategories(); }, 0);
    return () => window.clearTimeout(deferred);
  }, []);

  const handleCreate = async () => {
    const token = localStorage.getItem('token');
    const parent = flat.find((c) => c.id === newCat.parentId);
    await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        ...newCat,
        level: parent ? parent.level + 1 : 0,
        parentId: newCat.parentId || null,
      }),
    });
    setShowAdd(false);
    setNewCat({ slug: '', name: '', icon: '', parentId: '' });
    fetchCategories();
  };

  const statCards = [
    { label: 'Нийт', value: stats.total, color: '#6366F1' },
    { label: 'Үндсэн', value: stats.roots, color: '#E8242C' },
    { label: 'Дэд', value: stats.subs, color: '#10B981' },
    { label: 'Нарийн', value: stats.leafs, color: '#F59E0B' },
    { label: 'Онцлох', value: stats.featured, color: '#EC4899' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderTree size={22} className="text-[#E8242C]" />
          <h1 className="text-2xl font-bold text-[var(--esl-text)]">Ангилал</h1>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 px-4 py-2 bg-[#E8242C] text-white rounded-lg text-sm hover:bg-red-700"
        >
          <Plus size={14} /> Шинэ ангилал
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="bg-[var(--esl-bg-section)] rounded-xl p-3 border border-[var(--esl-border)] text-center">
            <p className="text-xl font-bold text-[var(--esl-text)]">{s.value}</p>
            <p className="text-xs text-[var(--esl-text-secondary)]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tree */}
      <div className="bg-[var(--esl-bg-section)] rounded-xl border border-[var(--esl-border)] p-4">
        {loading ? (
          <p className="text-center text-[var(--esl-text-secondary)] py-8">Ачааллаж байна...</p>
        ) : categories.length === 0 ? (
          <p className="text-center text-[var(--esl-text-secondary)] py-8">Ангилал байхгүй. Seed ажиллуулна уу.</p>
        ) : (
          categories.map((cat) => <CategoryNode key={cat.id} cat={cat} />)
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--esl-bg-section)] rounded-2xl p-6 w-full max-w-md border border-[var(--esl-border)]">
            <h2 className="text-lg font-bold text-[var(--esl-text)] mb-4">Шинэ ангилал</h2>
            <div className="space-y-3">
              <input
                placeholder="Нэр (Монгол)"
                value={newCat.name}
                onChange={(e) => setNewCat({ ...newCat, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                className="w-full px-3 py-2 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text)]"
              />
              <input
                placeholder="Slug (auto)"
                value={newCat.slug}
                onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text)]"
              />
              <input
                placeholder="Icon (emoji)"
                value={newCat.icon}
                onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text)]"
              />
              <select
                value={newCat.parentId}
                onChange={(e) => setNewCat({ ...newCat, parentId: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text)]"
              >
                <option value="">Үндсэн ангилал (root)</option>
                {flat.filter((c) => c.level < 2).map((c) => (
                  <option key={c.id} value={c.id}>
                    {'  '.repeat(c.level)}{c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text)]">
                Болих
              </button>
              <button onClick={handleCreate} disabled={!newCat.name || !newCat.slug} className="px-4 py-2 bg-[#E8242C] text-white rounded-lg text-sm disabled:opacity-50">
                Үүсгэх
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
