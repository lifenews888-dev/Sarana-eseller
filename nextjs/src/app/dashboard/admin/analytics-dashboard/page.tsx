'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import {
  Eye, ShoppingCart, Users, TrendingUp, TrendingDown,
  BarChart3, Globe, Smartphone, Monitor, Share2,
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    newUsers7d: number;
    newUsers30d: number;
    totalOrders: number;
    orders30d: number;
    totalProducts: number;
    totalShops: number;
    totalRevenue30d: number;
  };
  dailyChart: { date: string; label: string; signups: number; orders: number; revenue: number }[];
  roleDistribution: { name: string; value: number; color: string }[];
  topProducts: { id: string; name: string; reviewCount: number; price: number }[];
  funnel: { visits: number; signups: number; orders: number; paid: number };
}

function formatMNT(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M₮';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K₮';
  return n.toLocaleString() + '₮';
}

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/admin/analytics', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold text-[var(--esl-text-primary)]">Хандалтын аналитик</h1>
        <div className="text-center py-20 text-[var(--esl-text-muted)]">Ачааллаж байна...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold text-[var(--esl-text-primary)]">Хандалтын аналитик</h1>
        <div className="text-center py-20 text-[var(--esl-text-muted)]">Өгөгдөл ачааллахад алдаа гарлаа</div>
      </div>
    );
  }

  const o = data.overview;
  const stats = [
    { label: 'Нийт хэрэглэгч', value: o.totalUsers.toLocaleString(), change: `+${o.newUsers7d} (7 хоног)`, up: true, icon: Users, color: '#6366F1' },
    { label: 'Нийт бараа', value: o.totalProducts.toLocaleString(), change: `${o.totalShops} дэлгүүр`, up: true, icon: Eye, color: '#EC4899' },
    { label: 'Нийт захиалга', value: o.totalOrders.toLocaleString(), change: `+${o.orders30d} (30 хоног)`, up: o.orders30d > 0, icon: ShoppingCart, color: '#10B981' },
    { label: '30 хоногийн орлого', value: formatMNT(o.totalRevenue30d), change: `${o.newUsers30d} шинэ хэрэглэгч`, up: true, icon: TrendingUp, color: '#F59E0B' },
  ];

  const funnelData = [
    { name: 'Бүртгэл', value: data.funnel.signups },
    { name: 'Захиалга', value: data.funnel.orders },
    { name: 'Төлбөр', value: data.funnel.paid },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--esl-text-primary)]">Хандалтын аналитик</h1>
          <p className="text-sm text-[var(--esl-text-secondary)]">Бодит өгөгдөл · Сүүлийн 30 хоног</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: s.color + '12', color: s.color }}>
                <s.icon className="w-4 h-4" />
              </div>
              <span className={cn('text-xs font-bold flex items-center gap-0.5', s.up ? 'text-green-600' : 'text-red-500')}>
                {s.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {s.change}
              </span>
            </div>
            <div className="text-2xl font-black text-[var(--esl-text-primary)]">{s.value}</div>
            <div className="text-[10px] text-[var(--esl-text-muted)] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Chart */}
        <div className="lg:col-span-2 bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl p-5">
          <h3 className="text-sm font-bold text-[var(--esl-text-primary)] mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#E8242C]" /> Өдөр тутмын идэвхжил (30 хоног)
          </h3>
          {data.dailyChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.dailyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="signups" stroke="#6366F1" strokeWidth={2} dot={false} name="Бүртгэл" />
                <Line type="monotone" dataKey="orders" stroke="#22C55E" strokeWidth={2} dot={false} name="Захиалга" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-16 text-[var(--esl-text-muted)] text-sm">Өгөгдөл байхгүй</div>
          )}
        </div>

        {/* Role Distribution Pie */}
        <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl p-5">
          <h3 className="text-sm font-bold text-[var(--esl-text-primary)] mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#E8242C]" /> Хэрэглэгчийн бүтэц
          </h3>
          {data.roleDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.roleDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                  {data.roleDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" formatter={(value) => <span style={{ fontSize: 11 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-16 text-[var(--esl-text-muted)] text-sm">Өгөгдөл байхгүй</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl p-5">
          <h3 className="text-sm font-bold text-[var(--esl-text-primary)] mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#E8242C]" /> Шилдэг бараа (сэтгэгдлээр)
          </h3>
          {data.topProducts.length > 0 ? (
            <div className="space-y-2">
              {data.topProducts.map((p, i) => {
                const maxViews = data.topProducts[0]?.reviewCount || 1;
                return (
                  <div key={p.id} className="flex items-center gap-3 py-1.5">
                    <span className="text-xs font-bold text-[var(--esl-text-muted)] w-5">{i + 1}</span>
                    <span className="text-xs text-[var(--esl-text-primary)] flex-1 truncate">{p.name}</span>
                    <span className="text-xs font-bold text-[var(--esl-text-primary)]">{p.reviewCount.toLocaleString()}</span>
                    <div className="w-16 h-1.5 bg-[var(--esl-bg-section)] rounded-full overflow-hidden">
                      <div className="h-full bg-[#E8242C] rounded-full" style={{ width: `${(p.reviewCount / maxViews) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--esl-text-muted)] text-sm">Бараа байхгүй</div>
          )}
        </div>

        {/* Conversion Funnel */}
        <div className="space-y-4">
          <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl p-5">
            <h3 className="text-sm font-bold text-[var(--esl-text-primary)] mb-4 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#E8242C]" /> Conversion funnel
            </h3>
            {funnelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={funnelData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366F1" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-[var(--esl-text-muted)] text-sm">Өгөгдөл байхгүй</div>
            )}
          </div>

          <div className="bg-[#1A1A2E] rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="text-sm font-bold">Тоймо</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-lg font-black">{o.totalShops}</div>
                <div className="text-[10px] text-white/40">Дэлгүүр</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-lg font-black">{o.totalProducts}</div>
                <div className="text-[10px] text-white/40">Бараа</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-lg font-black text-green-400">{formatMNT(o.totalRevenue30d)}</div>
                <div className="text-[10px] text-white/40">30 хоногийн орлого</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-lg font-black text-amber-400">{o.newUsers30d}</div>
                <div className="text-[10px] text-white/40">Шинэ хэрэглэгч</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
