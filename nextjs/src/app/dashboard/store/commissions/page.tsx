'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, DollarSign, Clock, Users, Inbox } from 'lucide-react';
import { getActiveStoreHeaders } from '@/lib/api';

interface Commission {
  id: string;
  orderId: string;
  sellerName: string;
  sellerUsername: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  platformFee: number;
  shopAmount: number;
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
  paidAt: string | null;
  createdAt: string;
}

interface Stats {
  totalPaid: number;
  totalPending: number;
  activeSellers: number;
}

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: 'Хүлээгдэж буй', bg: 'rgba(217,119,6,0.1)',  color: '#D97706' },
  confirmed: { label: 'Батлагдсан',     bg: 'rgba(37,99,235,0.1)',  color: '#2563EB' },
  paid:      { label: 'Төлөгдсөн',     bg: 'rgba(22,163,74,0.1)',  color: '#16A34A' },
  cancelled: { label: 'Цуцлагдсан',    bg: 'rgba(220,38,38,0.1)',  color: '#DC2626' },
};

const TABS: { key: string; label: string }[] = [
  { key: 'all',       label: 'Бүгд' },
  { key: 'pending',   label: 'Хүлээгдэж буй' },
  { key: 'confirmed', label: 'Батлагдсан' },
  { key: 'paid',      label: 'Төлөгдсөн' },
];

function fmt(n: number) {
  return n.toLocaleString('mn-MN') + '₮';
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('mn-MN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function StoreCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [stats, setStats] = useState<Stats>({ totalPaid: 0, totalPending: 0, activeSellers: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  useEffect(() => {
    fetch('/api/store/commissions', {
      headers: getActiveStoreHeaders(),
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setCommissions(res.data.commissions);
          setStats(res.data.stats);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = commissions;
    if (tab !== 'all') list = list.filter(c => c.status === tab);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.sellerName.toLowerCase().includes(q));
    }
    return list;
  }, [commissions, tab, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#E8242C' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--esl-text-primary)' }}>Комисс</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--esl-text-muted)' }}>Борлуулагчдын комиссын тайлан</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: DollarSign, label: 'Нийт төлсөн', value: fmt(stats.totalPaid), color: '#16A34A' },
          { icon: Clock,      label: 'Хүлээгдэж буй', value: fmt(stats.totalPending), color: '#D97706' },
          { icon: Users,      label: 'Идэвхтэй борлуулагч', value: String(stats.activeSellers), color: '#2563EB' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border p-4 flex items-center gap-3"
            style={{ background: 'var(--esl-bg-card)', borderColor: 'var(--esl-border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.color + '18' }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--esl-text-muted)' }}>{s.label}</p>
              <p className="text-lg font-bold" style={{ color: 'var(--esl-text-primary)' }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-xl p-1 border" style={{ background: 'var(--esl-bg-card)', borderColor: 'var(--esl-border)' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: tab === t.key ? '#E8242C' : 'transparent',
                color: tab === t.key ? '#fff' : 'var(--esl-text-muted)',
              }}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--esl-text-muted)' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Борлуулагч хайх..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border text-sm outline-none focus:border-[#E8242C]"
            style={{ background: 'var(--esl-bg-card)', borderColor: 'var(--esl-border)', color: 'var(--esl-text-primary)' }} />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border"
          style={{ background: 'var(--esl-bg-card)', borderColor: 'var(--esl-border)' }}>
          <Inbox className="w-10 h-10 mb-3" style={{ color: 'var(--esl-text-muted)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--esl-text-muted)' }}>Комисс байхгүй байна</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--esl-bg-card)', borderColor: 'var(--esl-border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--esl-border)' }}>
                  {['Огноо', 'Борлуулагч', 'Захиалгын дүн', 'Хувь', 'Комисс', 'Статус'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--esl-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const badge = STATUS_MAP[c.status] || STATUS_MAP.pending;
                  return (
                    <tr key={c.id} className="hover:brightness-95 transition-colors"
                      style={{ borderBottom: '1px solid var(--esl-border)' }}>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--esl-text-muted)' }}>
                        {fmtDate(c.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[rgba(232,36,44,0.1)] flex items-center justify-center text-[10px] font-bold text-[#E8242C]">
                            {c.sellerName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--esl-text-primary)' }}>{c.sellerName}</p>
                            <p className="text-[10px]" style={{ color: 'var(--esl-text-muted)' }}>@{c.sellerUsername}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--esl-text-primary)' }}>{fmt(c.orderAmount)}</td>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--esl-text-primary)' }}>{c.commissionRate}%</td>
                      <td className="px-4 py-3 text-sm font-bold text-[#E8242C]">{fmt(c.commissionAmount)}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
