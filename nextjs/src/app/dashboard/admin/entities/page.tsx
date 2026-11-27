'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ENTITY_LABELS, type EntityType } from '@/lib/types/entity';
import {
  Search, Check, Eye, Shield, Ban, Download, Building2, Loader2,
} from 'lucide-react';

interface EntityRow {
  id: string;
  name: string;
  slug: string;
  type: EntityType;
  ownerEmail: string;
  ownerName: string;
  status: 'active' | 'pending' | 'suspended';
  isVerified: boolean;
  itemCount: number;
  joinedDate: string;
  table: string;
}

interface Counts {
  total: number;
  verified: number;
  pending: number;
  suspended: number;
}

const TYPE_TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'Бүгд' },
  ...Object.entries(ENTITY_LABELS).map(([key, val]) => ({ key, label: val.label })),
];

export default function AdminEntitiesPage() {
  const [entities, setEntities] = useState<EntityRow[]>([]);
  const [counts, setCounts] = useState<Counts>({ total: 0, verified: 0, pending: 0, suspended: 0 });
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchEntities = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/entities?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setEntities(data.entities || []);
      setCounts(data.counts || { total: 0, verified: 0, pending: 0, suspended: 0 });
    } catch {
      setEntities([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const deferred = window.setTimeout(() => { fetchEntities(); }, 0);
    return () => window.clearTimeout(deferred);
  }, [statusFilter, typeFilter]);

  const handleAction = async (id: string, table: string, action: 'approve' | 'suspend' | 'reject') => {
    setActing(id);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/admin/entities', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id, table, action }),
      });
      await fetchEntities();
    } catch { /* ignore */ }
    setActing(null);
  };

  const filtered = search
    ? entities.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.ownerEmail.toLowerCase().includes(search.toLowerCase())
      )
    : entities;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--esl-text-primary)]">Бүх нэгж удирдлага</h1>
          <p className="text-sm text-[var(--esl-text-secondary)]">Дэлгүүр, агент, компани, авто, үйлчилгээ</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl text-xs font-semibold hover:bg-[var(--esl-bg-section)] cursor-pointer transition">
          <Download className="w-3.5 h-3.5" /> CSV экспорт
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Нийт нэгж', value: counts.total, color: 'text-[var(--esl-text-primary)]' },
          { label: 'Баталгаажсан', value: counts.verified, color: 'text-green-500' },
          { label: 'Хүлээгдэж буй', value: counts.pending, color: 'text-amber-500' },
          { label: 'Түдгэлзүүлсэн', value: counts.suspended, color: 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl p-4">
            <div className="text-[10px] text-[var(--esl-text-muted)] mb-1">{s.label}</div>
            <div className={cn('text-2xl font-black', s.color)}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl p-4 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--esl-text-muted)]" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Нэгж хайх..."
              className="w-full pl-10 pr-4 py-2 bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text)] outline-none" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-[var(--esl-border)] rounded-lg text-xs bg-[var(--esl-bg-card)] text-[var(--esl-text)] cursor-pointer">
            <option value="all">Бүх статус</option>
            <option value="active">Идэвхтэй</option>
            <option value="pending">Хүлээгдэж буй</option>
            <option value="suspended">Түдгэлзсэн</option>
          </select>
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {TYPE_TABS.map((t) => (
            <button key={t.key} onClick={() => setTypeFilter(t.key)}
              className={cn('shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer transition',
                typeFilter === t.key ? 'bg-[#E8242C] text-white' : 'bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)] hover:bg-[var(--esl-bg-card)]')}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--esl-text-muted)]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-10 h-10 mx-auto text-[var(--esl-text-muted)] opacity-20 mb-3" />
            <p className="text-sm text-[var(--esl-text-muted)]">Нэгж олдсонгүй</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] text-[var(--esl-text-secondary)] uppercase tracking-wider border-b border-[var(--esl-border)] bg-[var(--esl-bg-section)]">
                <th className="px-4 py-2.5">Нэгж</th>
                <th className="px-4 py-2.5">Төрөл</th>
                <th className="px-4 py-2.5">Эзэмшигч</th>
                <th className="px-4 py-2.5">Статус</th>
                <th className="px-4 py-2.5">Баталгаа</th>
                <th className="px-4 py-2.5">Зар/Бараа</th>
                <th className="px-4 py-2.5">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const info = ENTITY_LABELS[e.type];
                return (
                  <tr key={e.id} className="border-b border-[var(--esl-border)] hover:bg-[var(--esl-bg-section)] transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[var(--esl-text-primary)]">{e.name}</div>
                      <div className="text-[10px] text-[var(--esl-text-muted)]">/{e.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-semibold bg-[var(--esl-brand-bg)] text-[#E8242C] px-2 py-0.5 rounded-full">
                        {info?.label || e.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-[var(--esl-text-secondary)]">{e.ownerEmail}</div>
                      {e.ownerName && <div className="text-[10px] text-[var(--esl-text-muted)]">{e.ownerName}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full',
                        e.status === 'active' ? 'bg-green-100 text-green-700' : e.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>
                        {e.status === 'active' ? 'Идэвхтэй' : e.status === 'pending' ? 'Хүлээгдэж буй' : 'Түдгэлзсэн'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {e.isVerified ? <Shield className="w-4 h-4 text-blue-500 fill-blue-500" /> : <span className="text-xs text-[var(--esl-text-muted)]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-[var(--esl-text-primary)]">{e.itemCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {!e.isVerified && e.status === 'pending' && (
                          <button
                            onClick={() => handleAction(e.id, e.table, 'approve')}
                            disabled={acting === e.id}
                            className="w-7 h-7 rounded-lg bg-green-50 border-none flex items-center justify-center cursor-pointer hover:bg-green-100 transition disabled:opacity-50"
                            title="Баталгаажуулах"
                          >
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          </button>
                        )}
                        {e.status !== 'suspended' && (
                          <button
                            onClick={() => handleAction(e.id, e.table, 'suspend')}
                            disabled={acting === e.id}
                            className="w-7 h-7 rounded-lg bg-transparent border border-[var(--esl-border)] flex items-center justify-center cursor-pointer hover:bg-red-50 transition disabled:opacity-50"
                            title="Түдгэлзүүлэх"
                          >
                            <Ban className="w-3.5 h-3.5 text-[var(--esl-text-muted)]" />
                          </button>
                        )}
                        {e.status === 'suspended' && (
                          <button
                            onClick={() => handleAction(e.id, e.table, 'approve')}
                            disabled={acting === e.id}
                            className="w-7 h-7 rounded-lg bg-blue-50 border-none flex items-center justify-center cursor-pointer hover:bg-blue-100 transition disabled:opacity-50"
                            title="Сэргээх"
                          >
                            <Check className="w-3.5 h-3.5 text-blue-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
