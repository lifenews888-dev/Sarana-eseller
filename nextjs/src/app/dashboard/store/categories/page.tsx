'use client';

import { useCallback, useState, useEffect } from 'react';
import { Search, Check, ChevronRight, ChevronDown, Loader2, Plus, Send, FolderOpen } from 'lucide-react';
import { useToast } from '@/components/shared/Toast';
import EmptyState from '@/components/shared/EmptyState';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  level: number;
  children?: Category[];
}

export default function StoreCategoriesPage() {
  const toast = useToast();
  const [tree, setTree] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showRequest, setShowRequest] = useState(false);
  const [reqName, setReqName] = useState('');
  const [reqParent, setReqParent] = useState('');
  const [reqSending, setReqSending] = useState(false);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      // Load tree + selected in parallel
      const [treeRes, selRes] = await Promise.all([
        fetch('/api/categories/tree', { headers }),
        fetch('/api/store/categories', { headers }),
      ]);

      const treeData = await treeRes.json();
      const selData = await selRes.json();

      setTree(treeData.data || []);
      setSelected(new Set((selData.data || []).map((c: Category) => c.id)));
    } catch {
      toast.show('Ангилал ачаалж чадсангүй', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function toggleCategory(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/store/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ categoryIds: Array.from(selected) }),
      });
      if (res.ok) toast.show(`${selected.size} ангилал хадгалагдлаа`);
      else { const d = await res.json().catch(() => ({})); toast.show(d.error || 'Алдаа гарлаа', 'error'); }
    } catch {
      toast.show('Алдаа гарлаа', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleRequest() {
    if (!reqName.trim()) { toast.show('Нэр оруулна уу', 'warn'); return; }
    setReqSending(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/categories/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name: reqName, parentName: reqParent || null }),
      });
      if (res.ok) {
        toast.show('Хүсэлт илгээгдлээ!');
        setReqName('');
        setReqParent('');
        setShowRequest(false);
      } else toast.show('Алдаа гарлаа', 'error');
    } catch {
      toast.show('Алдаа гарлаа', 'error');
    } finally {
      setReqSending(false);
    }
  }

  // Filter tree by search
  function filterTree(cats: Category[], q: string): Category[] {
    if (!q) return cats;
    const lower = q.toLowerCase();
    return cats.filter(c => {
      const match = c.name.toLowerCase().includes(lower);
      const childMatch = c.children?.some(ch =>
        ch.name.toLowerCase().includes(lower) || ch.children?.some(g => g.name.toLowerCase().includes(lower))
      );
      return match || childMatch;
    });
  }

  const filtered = filterTree(tree, search);
  const totalCategoryCount = tree.reduce((total, cat) => {
    const countChildren = (items: Category[] = []): number =>
      items.reduce((sum, item) => sum + 1 + countChildren(item.children || []), 0);
    return total + 1 + countChildren(cat.children || []);
  }, 0);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#E8242C' }} />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--esl-text-primary)' }}>📂 Ангилал удирдлага</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--esl-text-muted)' }}>
            {totalCategoryCount} ангилал, дэд ангилалаас сонгож дэлгүүртээ нэмнэ · {selected.size} сонгогдсон
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRequest(!showRequest)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-colors"
            style={{ borderColor: 'var(--esl-border)', color: 'var(--esl-text-muted)', background: 'var(--esl-bg-card)' }}
          >
            <Plus size={14} /> Шинэ ангилал санал болгох
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white border-none cursor-pointer"
            style={{ background: '#E8242C' }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {saving ? 'Хадгалж байна...' : 'Хадгалах'}
          </button>
        </div>
      </div>

      {/* Request form */}
      {showRequest && (
        <div className="mb-6 p-4 rounded-xl" style={{ background: 'var(--esl-bg-card)', border: '1px solid var(--esl-border)' }}>
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--esl-text-primary)' }}>Шинэ ангилал санал болгох</p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--esl-text-muted)' }}>Нэр</label>
              <input value={reqName} onChange={e => setReqName(e.target.value)} placeholder="Жишээ: Гэр ахуйн бараа"
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--esl-bg-page)', border: '1px solid var(--esl-border)', color: 'var(--esl-text-primary)' }} />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--esl-text-muted)' }}>Эцэг ангилал (заавал биш)</label>
              <input value={reqParent} onChange={e => setReqParent(e.target.value)} placeholder="Жишээ: Гэр"
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--esl-bg-page)', border: '1px solid var(--esl-border)', color: 'var(--esl-text-primary)' }} />
            </div>
            <button onClick={handleRequest} disabled={reqSending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white border-none cursor-pointer shrink-0"
              style={{ background: '#E8242C' }}>
              <Send size={14} /> {reqSending ? 'Илгээж байна...' : 'Илгээх'}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--esl-text-muted)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ангилал хайх..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm" style={{ background: 'var(--esl-bg-card)', border: '1px solid var(--esl-border)', color: 'var(--esl-text-primary)' }} />
      </div>

      {/* Category tree */}
      {filtered.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Ангилал олдсонгүй" desc="Хайлтаа өөрчилнө үү" />
      ) : (
        <div className="space-y-2">
          {filtered.map(cat => (
            <CategoryNode key={cat.id} cat={cat} level={0} selected={selected} expanded={expanded}
              onToggle={toggleCategory} onExpand={toggleExpand} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryNode({ cat, level, selected, expanded, onToggle, onExpand }: {
  cat: Category; level: number; selected: Set<string>; expanded: Set<string>;
  onToggle: (id: string) => void; onExpand: (id: string) => void;
}) {
  const hasChildren = cat.children && cat.children.length > 0;
  const isExpanded = expanded.has(cat.id);
  const isSelected = selected.has(cat.id);

  return (
    <div>
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors"
        style={{
          background: isSelected ? 'rgba(232,36,44,0.08)' : 'var(--esl-bg-card)',
          border: isSelected ? '1.5px solid #E8242C' : '1px solid var(--esl-border)',
          marginLeft: level * 24,
        }}
        onClick={() => onToggle(cat.id)}
      >
        {/* Expand button */}
        {hasChildren ? (
          <button onClick={(e) => { e.stopPropagation(); onExpand(cat.id); }}
            className="w-6 h-6 flex items-center justify-center rounded border-none cursor-pointer" style={{ background: 'transparent', color: 'var(--esl-text-muted)' }}>
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : <div className="w-6" />}

        {/* Checkbox */}
        <div className="w-5 h-5 rounded flex items-center justify-center shrink-0"
          style={{ background: isSelected ? '#E8242C' : 'var(--esl-bg-page)', border: isSelected ? 'none' : '1.5px solid var(--esl-border)' }}>
          {isSelected && <Check size={12} className="text-white" />}
        </div>

        {/* Icon + Name */}
        <span className="text-lg">{cat.icon || '📁'}</span>
        <span className="text-sm font-medium" style={{ color: 'var(--esl-text-primary)' }}>{cat.name}</span>

        {/* Children count */}
        {hasChildren && (
          <span className="text-[10px] px-2 py-0.5 rounded-full ml-auto" style={{ background: 'var(--esl-bg-page)', color: 'var(--esl-text-muted)' }}>
            {cat.children!.length} дэд
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {cat.children!.map(child => (
            <CategoryNode key={child.id} cat={child} level={level + 1} selected={selected} expanded={expanded}
              onToggle={onToggle} onExpand={onExpand} />
          ))}
        </div>
      )}
    </div>
  );
}
