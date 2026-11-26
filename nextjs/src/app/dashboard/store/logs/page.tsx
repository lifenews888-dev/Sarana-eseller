'use client';

import { useState, useMemo } from 'react';
import { timeAgo } from '@/lib/utils';
import StatCard from '@/components/dashboard/StatCard';

interface LogEntry {
  id: string;
  action: string;
  description: string;
  icon: string;
  category: 'auth' | 'order' | 'product' | 'settings' | 'payment';
  timestamp: string;
}

const CATEGORY_STYLES: Record<string, string> = {
  auth: 'bg-blue-100 text-blue-700',
  order: 'bg-green-100 text-green-700',
  product: 'bg-purple-100 text-purple-700',
  settings: 'bg-[var(--esl-bg-section)] text-[var(--esl-text-primary)]',
  payment: 'bg-amber-100 text-amber-700',
};

const CATEGORY_LABELS: Record<string, string> = {
  auth: 'Нэвтрэлт',
  order: 'Захиалга',
  product: 'Бүтээгдэхүүн',
  settings: 'Тохиргоо',
  payment: 'Төлбөр',
};

// Үйл ажиллагааны лог API хараахан холбогдоогүй — хуурамч бичлэг харуулахгүй.
const LOGS: LogEntry[] = [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DEMO_LOGS: LogEntry[] = [
  { id: '1', action: 'Нэвтэрсэн', description: 'Системд нэвтэрлээ (Chrome, Windows)', icon: '🔐', category: 'auth', timestamp: '2026-04-03T08:00:00Z' },
  { id: '2', action: 'Захиалга шинэчилсэн', description: 'ORD-1005 захиалгын төлөв "Хүлээгдэж буй" → "Баталгаажсан"', icon: '📋', category: 'order', timestamp: '2026-04-03T08:15:00Z' },
  { id: '3', action: 'Бүтээгдэхүүн нэмсэн', description: '"Зуны малгай" бүтээгдэхүүн нэмэгдлээ (22,000₮)', icon: '🛍️', category: 'product', timestamp: '2026-04-03T09:30:00Z' },
  { id: '4', action: 'Үнэ өөрчилсөн', description: '"Bluetooth чихэвч" үнэ 125,000₮ → 99,000₮', icon: '💲', category: 'product', timestamp: '2026-04-03T10:00:00Z' },
  { id: '5', action: 'Тохиргоо хадгалсан', description: 'Дэлгүүрийн нэр, утасны дугаар өөрчлөгдлөө', icon: '⚙️', category: 'settings', timestamp: '2026-04-02T16:45:00Z' },
  { id: '6', action: 'Захиалга хүргэгдсэн', description: 'ORD-1004 захиалга "Хүргэгдсэн" болсон', icon: '📦', category: 'order', timestamp: '2026-04-02T14:20:00Z' },
  { id: '7', action: 'Мөнгө татсан', description: '150,000₮ Хаан банк руу татан авалт хүсэлт', icon: '🏦', category: 'payment', timestamp: '2026-04-02T11:00:00Z' },
  { id: '8', action: 'Нэвтэрсэн', description: 'Системд нэвтэрлээ (Safari, iPhone)', icon: '🔐', category: 'auth', timestamp: '2026-04-02T08:30:00Z' },
  { id: '9', action: 'Бүтээгдэхүүн засварласан', description: '"Premium цагаан цамц" тайлбар, нөөц шинэчлэгдлээ', icon: '✏️', category: 'product', timestamp: '2026-04-01T15:00:00Z' },
  { id: '10', action: 'Захиалга баталгаажсан', description: 'ORD-1002 захиалга "Баталгаажсан" болсон', icon: '✅', category: 'order', timestamp: '2026-04-01T14:45:00Z' },
  { id: '11', action: 'Промо код үүсгэсэн', description: 'SPRING25 — 25% хөнгөлөлт код үүсгэлээ', icon: '🏷️', category: 'settings', timestamp: '2026-04-01T10:00:00Z' },
  { id: '12', action: 'Бүтээгдэхүүн устгасан', description: '"Хуучин загварын бүс" устгагдлаа', icon: '🗑️', category: 'product', timestamp: '2026-03-31T17:00:00Z' },
  { id: '13', action: 'Төлбөр орсон', description: 'ORD-1001 захиалгын QPay төлбөр 70,000₮ орлоо', icon: '💰', category: 'payment', timestamp: '2026-03-31T10:15:00Z' },
  { id: '14', action: 'Шимтгэл тохиргоо', description: 'Үндсэн шимтгэл 10% → 12% болгосон', icon: '💹', category: 'settings', timestamp: '2026-03-30T09:00:00Z' },
  { id: '15', action: 'Нэвтэрсэн', description: 'Системд нэвтэрлээ (Chrome, Windows)', icon: '🔐', category: 'auth', timestamp: '2026-03-30T08:00:00Z' },
];

type FilterCategory = 'all' | LogEntry['category'];

export default function LogsPage() {
  const [filter, setFilter] = useState<FilterCategory>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return LOGS;
    return LOGS.filter((l) => l.category === filter);
  }, [filter]);

  const todayCount = LOGS.filter((l) => new Date(l.timestamp).toDateString() === new Date().toDateString()).length;

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, LogEntry[]> = {};
    for (const log of filtered) {
      const dateKey = new Date(log.timestamp).toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric' });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(log);
    }
    return Object.entries(groups);
  }, [filtered]);

  return (
    <div className="min-h-screen bg-[var(--esl-bg-section)] p-6">
      <div role="status" className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-300">
        Үйл ажиллагааны лог удахгүй идэвхжинэ.
      </div>
      <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6 mb-6">
        <h1 className="text-2xl font-bold text-[var(--esl-text-primary)]">Үйл ажиллагааны лог</h1>
        <p className="text-[var(--esl-text-secondary)] mt-1">Системийн бүх үйлдлийн түүх</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon="📊" label="Нийт бүртгэл" value={LOGS.length} gradient="indigo" />
        <StatCard icon="📅" label="Өнөөдрийн" value={todayCount} gradient="green" />
        <StatCard icon="📋" label="Захиалга" value={LOGS.filter((l) => l.category === 'order').length} gradient="amber" />
        <StatCard icon="🛍️" label="Бүтээгдэхүүн" value={LOGS.filter((l) => l.category === 'product').length} gradient="pink" />
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {(['all', 'auth', 'order', 'product', 'settings', 'payment'] as FilterCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === cat ? 'bg-[#E8242C] text-white' : 'bg-[var(--esl-bg-card)] text-[var(--esl-text-secondary)] border border-[var(--esl-border)] hover:bg-[var(--esl-bg-section)]'
            }`}
          >
            {cat === 'all' ? 'Бүгд' : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Logs */}
      {filtered.length === 0 ? (
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-12 text-center">
          <div className="text-4xl mb-3">📜</div>
          <h3 className="text-lg font-semibold text-[var(--esl-text-primary)]">Лог олдсонгүй</h3>
          <p className="text-[var(--esl-text-muted)] mt-1">Энэ ангилалд бүртгэл байхгүй</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, logs]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-[var(--esl-text-muted)] uppercase mb-3">{date}</h3>
              <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] overflow-hidden">
                {logs.map((log, i) => (
                  <div key={log.id} className={`flex items-start gap-4 p-4 ${i < logs.length - 1 ? 'border-b border-[var(--esl-border)]' : ''} hover:bg-[var(--esl-bg-section)] transition-colors`}>
                    <div className="w-10 h-10 rounded-full bg-[var(--esl-bg-section)] flex items-center justify-center text-lg flex-shrink-0">
                      {log.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[var(--esl-text-primary)]">{log.action}</span>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${CATEGORY_STYLES[log.category]}`}>
                          {CATEGORY_LABELS[log.category]}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--esl-text-secondary)] mt-0.5">{log.description}</p>
                    </div>
                    <span className="text-xs text-[var(--esl-text-muted)] flex-shrink-0 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
