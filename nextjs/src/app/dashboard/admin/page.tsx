'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Wrench, Users, Package, Wallet, Clock, Store, ShoppingBag,
  TrendingUp, BarChart3, AlertTriangle, MessageSquare, Layers,
  ChevronRight, Shield, Settings, Megaphone,
} from 'lucide-react';
import {
  DashboardPage,
  DashboardHeader,
  DashboardStatGrid,
  DashboardQuickLinks,
  DashboardPrimaryButton,
  DashboardSecondaryButton,
  DashboardPanel,
  timeGreeting,
} from '@/components/dashboard/DashboardShell';

interface DashboardStats {
  totalUsers: number;
  totalShops: number;
  totalProducts: number;
  totalOrders: number;
  totalCategories: number;
  pendingDisputes: number;
  activeChats: number;
  todayRevenue: number;
  pendingPayout: number;
  roles: Record<string, number>;
  dailyChart: { date: string; label: string; orders: number; revenue: number }[];
  revenuePie: { name: string; value: number }[];
}

const PIE_COLORS = ['#22C55E', '#3B82F6', '#E24B4A', '#7C3AED', '#F59E0B', '#EC4899', '#14B8A6', '#8B5CF6'];
const SOURCE_LABELS: Record<string, string> = {
  commission: 'Комисс',
  subscription: 'Subscription',
  banner: 'Баннер',
  sms: 'SMS',
  email: 'Email',
  push: 'Push',
  affiliate: 'Affiliate',
  ai_credit: 'AI кредит',
  featured: 'Онцлох',
  delivery: 'Хүргэлт',
};

function formatMNT(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M₮`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K₮`;
  return `${n.toLocaleString()}₮`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/admin/stats', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const roleLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    buyer: { label: 'Худалдан авагч', icon: <ShoppingBag className="h-3.5 w-3.5" /> },
    seller: { label: 'Дэлгүүр эзэн', icon: <Store className="h-3.5 w-3.5" /> },
    affiliate: { label: 'Борлуулагч', icon: <TrendingUp className="h-3.5 w-3.5" /> },
    delivery: { label: 'Жолооч', icon: <Package className="h-3.5 w-3.5" /> },
    admin: { label: 'Админ', icon: <Wrench className="h-3.5 w-3.5" /> },
  };

  return (
    <DashboardPage>
      <DashboardHeader
        badge="Админ самбар"
        title={`${timeGreeting()} — платформын удирдлага`}
        subtitle="Хэрэглэгч, дэлгүүр, орлого, маргаан — бодит өгөгдөл"
        actions={
          <>
            <DashboardPrimaryButton href="/dashboard/admin/users">
              <Users size={16} /> Хэрэглэгчид
            </DashboardPrimaryButton>
            <DashboardSecondaryButton href="/dashboard/admin/config">
              <Settings size={16} /> Тохиргоо
            </DashboardSecondaryButton>
          </>
        }
      />

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-[var(--esl-bg-section)]" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-[var(--esl-bg-section)]" />
        </div>
      ) : !stats ? (
        <div className="rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] py-16 text-center text-sm text-[var(--esl-text-muted)]">
          Өгөгдөл ачааллахад алдаа гарлаа
        </div>
      ) : (
        <>
          <DashboardStatGrid
            cols={6}
            items={[
              { icon: Users, label: 'Нийт хэрэглэгч', value: stats.totalUsers, tone: 'info' },
              { icon: Store, label: 'Нийт дэлгүүр', value: stats.totalShops, tone: 'success' },
              { icon: Package, label: 'Нийт бараа', value: stats.totalProducts, tone: 'primary' },
              { icon: ShoppingBag, label: 'Нийт захиалга', value: stats.totalOrders, tone: 'warning' },
              { icon: Wallet, label: 'Өнөөдрийн орлого', value: formatMNT(stats.todayRevenue), tone: 'success' },
              { icon: Clock, label: 'Хүлээгдэж буй payout', value: formatMNT(stats.pendingPayout), tone: 'warning' },
            ]}
          />

          <DashboardQuickLinks
            items={[
              { href: '/dashboard/admin/users', icon: Users, label: 'Хэрэглэгчид', desc: 'Роль', color: '#2563EB' },
              { href: '/dashboard/admin/shops', icon: Store, label: 'Дэлгүүрүүд', desc: 'Модерац', color: '#E8242C' },
              { href: '/dashboard/admin/revenue', icon: Wallet, label: 'Орлого', desc: 'Тайлан', color: '#16A34A' },
              { href: '/dashboard/admin/chat-monitor', icon: MessageSquare, label: 'Чат', desc: 'Хяналт', color: '#7C3AED' },
              { href: '/dashboard/admin/disputes', icon: AlertTriangle, label: 'Маргаан', desc: 'Нээлттэй', color: '#D97706' },
              { href: '/dashboard/admin/marketing', icon: Megaphone, label: 'Маркетинг', desc: 'Кампанит', color: '#DB2777' },
            ]}
          />

          <div className="mb-5 grid gap-4 lg:grid-cols-3 sm:mb-6 lg:gap-6">
            <DashboardPanel
              title="Сүүлийн 30 хоногийн захиалга"
              className="lg:col-span-2"
            >
              {stats.dailyChart?.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={stats.dailyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--esl-border)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: 'var(--esl-text-muted)', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'var(--esl-text-muted)', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--esl-bg-card)',
                        border: '1px solid var(--esl-border)',
                        borderRadius: 12,
                        fontSize: 12,
                        color: 'var(--esl-text-primary)',
                      }}
                    />
                    <Line type="monotone" dataKey="orders" stroke="#E8242C" strokeWidth={2} dot={false} name="Захиалга" />
                    <Line type="monotone" dataKey="revenue" stroke="#22C55E" strokeWidth={2} dot={false} name="Орлого" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="py-16 text-center text-sm text-[var(--esl-text-muted)]">Захиалгын өгөгдөл байхгүй</div>
              )}
            </DashboardPanel>

            <DashboardPanel title="Орлогын эх үүсвэр">
              {stats.revenuePie?.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={stats.revenuePie.map((p) => ({ ...p, name: SOURCE_LABELS[p.name] || p.name }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {stats.revenuePie.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'var(--esl-bg-card)',
                        border: '1px solid var(--esl-border)',
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={(value) => formatMNT(Number(value))}
                    />
                    <Legend
                      verticalAlign="bottom"
                      formatter={(value) => (
                        <span style={{ color: 'var(--esl-text-secondary)', fontSize: 11 }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="py-16 text-center text-sm text-[var(--esl-text-muted)]">Орлогын бүртгэл байхгүй</div>
              )}
            </DashboardPanel>
          </div>

          <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
            <DashboardPanel title="Хэрэглэгчийн тоо">
              <div className="space-y-3">
                {Object.entries(roleLabels).map(([role, { label, icon }]) => (
                  <div key={role} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-[var(--esl-text-secondary)]">
                      {icon} {label}
                    </span>
                    <span className="rounded-lg bg-[var(--esl-bg-section)] px-3 py-1 text-sm font-bold text-[var(--esl-text-primary)]">
                      {stats.roles?.[role] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </DashboardPanel>

            <DashboardPanel title="Хурдан тойм">
              <div className="space-y-3">
                {[
                  { icon: <Layers className="h-3.5 w-3.5" />, label: 'Ангилал', value: stats.totalCategories },
                  { icon: <MessageSquare className="h-3.5 w-3.5" />, label: 'Идэвхтэй чат', value: stats.activeChats },
                  { icon: <AlertTriangle className="h-3.5 w-3.5" />, label: 'Нээлттэй маргаан', value: stats.pendingDisputes },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-[var(--esl-text-secondary)]">
                      {row.icon} {row.label}
                    </span>
                    <span className="rounded-lg bg-[var(--esl-bg-section)] px-3 py-1 text-sm font-bold text-[var(--esl-text-primary)]">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </DashboardPanel>

            <DashboardPanel title="Систем">
              <div className="space-y-2">
                {[
                  { href: '/dashboard/admin/site-settings', label: 'Сайтын тохиргоо' },
                  { href: '/dashboard/admin/system-rules', label: 'Системийн дүрэм' },
                  { href: '/dashboard/admin/analytics-dashboard', label: 'Аналитик' },
                  { href: '/dashboard/admin/categories', label: 'Ангилал' },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="flex items-center justify-between rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-section)] px-3 py-2.5 text-sm font-semibold text-[var(--esl-text-primary)] no-underline transition hover:border-[#E8242C]/40"
                  >
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-[#E8242C]" />
                      {l.label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-[var(--esl-text-muted)]" />
                  </Link>
                ))}
              </div>
            </DashboardPanel>
          </div>
        </>
      )}
    </DashboardPage>
  );
}
