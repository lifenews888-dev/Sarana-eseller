'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { DollarSign, TrendingUp, BarChart3, Download, Wallet, Receipt, Percent } from 'lucide-react';

interface RevenueData {
  bySource: Record<string, { amount: number; count: number }>;
  total: number;
  todayRevenue: number;
  count: number;
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  commission:   { label: 'Гүйлгээний комисс',  color: '#1D9E75' },
  subscription: { label: 'Subscription төлбөр', color: '#378ADD' },
  banner:       { label: 'Баннер / байршил',    color: '#E24B4A' },
  sms:          { label: 'SMS кампани',          color: '#7C3AED' },
  email:        { label: 'Email кампани',        color: '#8B5CF6' },
  push:         { label: 'Push notification',    color: '#A78BFA' },
  affiliate:    { label: 'Affiliate / referral', color: '#EF9F27' },
  ai_credit:    { label: 'AI кредит худалдаа',   color: '#EC4899' },
  featured:     { label: 'Онцлох байршил',       color: '#F59E0B' },
  delivery:     { label: 'Хүргэлтийн комисс',   color: '#14B8A6' },
};

function formatMNT(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M₮';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K₮';
  return n.toLocaleString() + '₮';
}

export default function RevenueDashboardPage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const deferred = window.setTimeout(() => {
      setLoading(true);
      const token = localStorage.getItem('token');
      fetch(`/api/admin/revenue?period=${period}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(r => r.json())
        .then(d => setData(d))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(deferred);
  }, [period]);

  const sources = data ? Object.entries(data.bySource).sort((a, b) => b[1].amount - a[1].amount) : [];
  const maxAmount = sources.length > 0 ? sources[0][1].amount : 1;

  // Pie chart data
  const pieData = sources.map(([key, { amount }]) => ({
    name: SOURCE_LABELS[key]?.label || key,
    value: amount,
    color: SOURCE_LABELS[key]?.color || '#888',
  }));

  // CSV export
  const exportCSV = () => {
    if (!sources.length) return;
    const rows = [['Эх үүсвэр', 'Дүн', 'Тоо']];
    for (const [key, { amount, count }] of sources) {
      rows.push([SOURCE_LABELS[key]?.label || key, String(amount), String(count)]);
    }
    rows.push(['Нийт', String(data?.total || 0), String(data?.count || 0)]);
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-${period}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="bg-dash-sidebar border-b border-dash-border px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-lg font-black flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" /> Орлогын dashboard
            </h1>
            <p className="text-white/35 text-xs mt-0.5">14+ орлогын эх үүсвэр · Real-time</p>
          </div>
          <div className="flex gap-2">
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setPeriod(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer transition ${
                  period === d ? 'bg-dash-accent text-white' : 'bg-dash-card text-white/40 border border-dash-border'
                }`}>
                {d} хоног
              </button>
            ))}
            <button onClick={exportCSV}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/10 text-green-400 border-none cursor-pointer hover:bg-green-500/20 transition">
              <Download className="w-3 h-3" /> CSV
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Top metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Нийт орлого', value: formatMNT(data?.total || 0), color: '#22C55E', icon: <DollarSign className="w-4 h-4" /> },
            { label: 'Өнөөдрийн орлого', value: formatMNT(data?.todayRevenue || 0), color: '#3B82F6', icon: <Wallet className="w-4 h-4" /> },
            { label: 'MRR (тооцоо)', value: formatMNT(Math.round((data?.total || 0) / period * 30)), color: '#D97706', icon: <TrendingUp className="w-4 h-4" /> },
            { label: 'Гүйлгээний тоо', value: String(data?.count || 0), color: '#8B5CF6', icon: <Receipt className="w-4 h-4" /> },
            { label: 'Дундаж гүйлгээ', value: formatMNT(Math.round((data?.total || 0) / Math.max(data?.count || 1, 1))), color: '#EC4899', icon: <BarChart3 className="w-4 h-4" /> },
            { label: 'Эх үүсвэр', value: String(sources.length), color: '#14B8A6', icon: <Percent className="w-4 h-4" /> },
          ].map(m => (
            <div key={m.label} className="bg-dash-card border border-dash-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2" style={{ color: m.color }}>{m.icon}<span className="text-[10px] text-white/40 uppercase tracking-wider">{m.label}</span></div>
              <div className="text-2xl font-black text-white">{loading ? '—' : m.value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Revenue by source — horizontal bars */}
          <div className="lg:col-span-2 bg-dash-card border border-dash-border rounded-2xl p-6">
            <h3 className="text-white font-bold text-sm mb-6 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-dash-accent" /> Орлогын эх үүсвэрүүд
            </h3>

            {loading ? (
              <div className="text-center py-12 text-white/30 text-sm">Ачааллаж байна...</div>
            ) : sources.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <p className="text-white/30 text-sm">Орлогын бүртгэл байхгүй байна</p>
                <p className="text-white/15 text-xs mt-1">Захиалга, subscription, баннер зэргээс орлого бүртгэгдэхэд энд харагдана</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sources.map(([source, { amount, count }]) => {
                  const cfg = SOURCE_LABELS[source] || { label: source, color: '#888' };
                  const pct = Math.round((amount / maxAmount) * 100);
                  return (
                    <div key={source} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                      <span className="text-xs text-white/60 w-40 flex-shrink-0">{cfg.label}</span>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: cfg.color }} />
                      </div>
                      <span className="text-xs font-bold text-white w-20 text-right">{formatMNT(amount)}</span>
                      <span className="text-[10px] text-white/30 w-16 text-right">{count} удаа</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pie chart */}
          <div className="bg-dash-card border border-dash-border rounded-2xl p-6">
            <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-green-400" /> Орлогын бүтэц
            </h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1E1E2E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                    formatter={(value) => formatMNT(Number(value))}
                  />
                  <Legend
                    verticalAlign="bottom"
                    formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-16 text-white/20 text-sm">Өгөгдөл байхгүй</div>
            )}
          </div>
        </div>

        {/* Summary */}
        {data && sources.length > 0 && (
          <div className="bg-dash-card border border-dash-border rounded-2xl p-6">
            <h3 className="text-white font-bold text-sm mb-4">Нийт дүн</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/[.02] rounded-xl p-4 text-center">
                <div className="text-xl font-black text-green-400">{formatMNT(data.total)}</div>
                <div className="text-[10px] text-white/30 uppercase mt-1">Нийт орлого</div>
              </div>
              <div className="bg-white/[.02] rounded-xl p-4 text-center">
                <div className="text-xl font-black text-blue-400">{data.count}</div>
                <div className="text-[10px] text-white/30 uppercase mt-1">Гүйлгээний тоо</div>
              </div>
              <div className="bg-white/[.02] rounded-xl p-4 text-center">
                <div className="text-xl font-black text-amber-400">{formatMNT(Math.round(data.total / Math.max(data.count, 1)))}</div>
                <div className="text-[10px] text-white/30 uppercase mt-1">Дундаж гүйлгээ</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
