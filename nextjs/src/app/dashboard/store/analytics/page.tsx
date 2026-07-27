'use client';

import { useState, useEffect } from 'react';
import StatCard from '@/components/dashboard/StatCard';
import { formatPrice } from '@/lib/utils';
import { getActiveStoreHeaders } from '@/lib/api';
import {
  Eye, Wallet, Target, ShoppingCart, TrendingUp, Globe, Trophy,
} from 'lucide-react';

type Period = 'today' | 'week' | 'month';

const PERIOD_MAP: Record<Period, string> = { today: '7d', week: '7d', month: '30d' };

const TRAFFIC_SOURCES = [
  { source: 'Facebook', percent: 38, color: 'bg-blue-500' },
  { source: 'Instagram', percent: 25, color: 'bg-pink-500' },
  { source: 'Шууд хандалт', percent: 18, color: 'bg-gray-400' },
  { source: 'Google', percent: 12, color: 'bg-green-500' },
  { source: 'TikTok', percent: 7, color: 'bg-purple-500' },
];

const DAYS = ['Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба', 'Ням'];

const FALLBACK = {
  totalRevenue: 0,
  totalOrders: 0,
  avgOrderValue: 0,
  revenueGrowth: 0,
  daily: [] as { date: string; revenue: number; orders: number }[],
  topProducts: [] as { id: string; name: string; sold: number; revenue: number }[],
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('week');
  const [stats, setStats] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiPeriod = PERIOD_MAP[period];
    fetch(`/api/seller/analytics?period=${apiPeriod}`, {
      headers: getActiveStoreHeaders(),
    })
      .then((r) => r.json())
      .then((data) => setStats({ ...FALLBACK, ...(data?.data || data) }))
      .catch(() => setStats(FALLBACK))
      .finally(() => setLoading(false));
  }, [period]);

  const weeklyRevenue = stats.daily.slice(-7).map((d) => d.revenue);
  const maxRevenue = Math.max(...weeklyRevenue, 1);
  const visits = stats.totalOrders * 15 || 0;
  const conversion = visits > 0 ? ((stats.totalOrders / visits) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-[var(--esl-bg-section)] p-6">
      {/* Header */}
      <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6 mb-6">
        <h1 className="text-2xl font-bold text-[var(--esl-text-primary)]">Аналитик</h1>
        <p className="text-[var(--esl-text-secondary)] mt-1">Дэлгүүрийн хандалт, борлуулалтын статистик</p>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 mb-6">
        {([['today', 'Өнөөдөр'], ['week', '7 хоног'], ['month', 'Сар']] as [Period, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setLoading(true);
              setPeriod(key);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === key ? 'bg-indigo-600 text-white' : 'bg-[var(--esl-bg-card)] text-[var(--esl-text-secondary)] border border-[var(--esl-border)] hover:bg-[var(--esl-bg-section)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Eye className="w-6 h-6" />} label="Хандалт" value={loading ? '...' : visits.toLocaleString()} gradient="indigo" />
        <StatCard icon={<Wallet className="w-6 h-6" />} label="Орлого" value={loading ? '...' : formatPrice(stats.totalRevenue)} gradient="green" />
        <StatCard icon={<Target className="w-6 h-6" />} label="Конверс %" value={loading ? '...' : `${conversion}%`} gradient="pink" />
        <StatCard icon={<ShoppingCart className="w-6 h-6" />} label="Захиалга" value={loading ? '...' : stats.totalOrders} gradient="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6">
          <h2 className="text-lg font-bold text-[var(--esl-text-primary)] mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" /> 7 хоногийн орлого</h2>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-[var(--esl-text-muted)] text-sm">Ачааллаж байна...</div>
          ) : weeklyRevenue.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-[var(--esl-text-muted)] text-sm">Мэдээлэл байхгүй</div>
          ) : (
            <div className="flex items-end gap-2 h-48">
              {weeklyRevenue.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-[var(--esl-text-secondary)] font-medium">{(val / 1000).toFixed(0)}k</span>
                  <div
                    className="w-full bg-indigo-500 rounded-t-md hover:bg-indigo-600 transition-colors"
                    style={{ height: `${(val / maxRevenue) * 160}px` }}
                  />
                  <span className="text-[10px] text-[var(--esl-text-muted)]">{DAYS[i % 7].slice(0, 2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Traffic Sources */}
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6">
          <h2 className="text-lg font-bold text-[var(--esl-text-primary)] mb-4 flex items-center gap-2"><Globe className="w-5 h-5" /> Хандалтын эх үүсвэр</h2>
          <div className="space-y-4">
            {TRAFFIC_SOURCES.map((src) => (
              <div key={src.source}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--esl-text-primary)] font-medium">{src.source}</span>
                  <span className="text-[var(--esl-text-secondary)]">{src.percent}%</span>
                </div>
                <div className="w-full bg-[var(--esl-bg-section)] rounded-full h-2.5">
                  <div className={`${src.color} h-2.5 rounded-full transition-all`} style={{ width: `${src.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] overflow-hidden">
        <div className="p-6 border-b border-[var(--esl-border)]">
          <h2 className="text-lg font-bold text-[var(--esl-text-primary)] flex items-center gap-2"><Trophy className="w-5 h-5" /> Шилдэг бүтээгдэхүүн (орлогоор)</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-[var(--esl-text-muted)] text-sm">Ачааллаж байна...</div>
        ) : stats.topProducts.length === 0 ? (
          <div className="p-8 text-center text-[var(--esl-text-muted)] text-sm">Мэдээлэл байхгүй</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--esl-bg-section)] border-b border-[var(--esl-border)]">
                  <th className="text-left p-4 text-xs font-semibold text-[var(--esl-text-secondary)] uppercase">#</th>
                  <th className="text-left p-4 text-xs font-semibold text-[var(--esl-text-secondary)] uppercase">Бүтээгдэхүүн</th>
                  <th className="text-left p-4 text-xs font-semibold text-[var(--esl-text-secondary)] uppercase">Захиалга</th>
                  <th className="text-left p-4 text-xs font-semibold text-[var(--esl-text-secondary)] uppercase">Орлого</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((p, i) => (
                  <tr key={p.id} className="border-b border-[var(--esl-border)] hover:bg-[var(--esl-bg-section)]">
                    <td className="p-4 text-sm text-[var(--esl-text-muted)] font-medium">{i + 1}</td>
                    <td className="p-4 text-sm font-medium text-[var(--esl-text-primary)]">{p.name}</td>
                    <td className="p-4 text-sm text-[var(--esl-text-primary)]">{p.sold}</td>
                    <td className="p-4 text-sm font-semibold text-[var(--esl-text-primary)]">{formatPrice(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
