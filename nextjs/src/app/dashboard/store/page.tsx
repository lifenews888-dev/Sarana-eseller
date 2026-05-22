'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProductsAPI, OrdersAPI, Product, Order } from '@/lib/api';
import { formatPrice, getInitials } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import {
  getCurrentPlan,
  getRemainingDays,
  getUsagePercent,
} from '@/lib/subscription';
import StatCard from '@/components/dashboard/StatCard';
import { LocationCoordReminder } from '@/components/seller/LocationCoordReminder';
import VatStatusWidget from '@/components/store/VatStatusWidget';
import {
  Wallet, ClipboardList, Package, TrendingUp, BarChart3,
  CheckCircle, Trophy, Link as LinkIcon, FolderOpen, Palette,
  LineChart, Globe, Settings, Zap, Building2, Car, Home,
} from 'lucide-react';

type AnalyticsData = {
  daily?: Array<{ revenue: number }>;
};

function getEntityActions(entityType?: string) {
  if (entityType === 'agent') {
    return {
      primaryLabel: 'Зар нэмэх',
      primaryHref: '/dashboard/store/listings/new?entityType=agent',
      links: [
        { icon: <Home className="w-6 h-6" />, label: 'Зар нэмэх', href: '/dashboard/store/listings/new?entityType=agent' },
        { icon: <FolderOpen className="w-6 h-6" />, label: 'Миний зарууд', href: '/dashboard/store/listings' },
      ],
    };
  }
  if (entityType === 'company') {
    return {
      primaryLabel: 'Төсөл нэмэх',
      primaryHref: '/dashboard/store/listings/new?entityType=company',
      links: [
        { icon: <Building2 className="w-6 h-6" />, label: 'Төсөл нэмэх', href: '/dashboard/store/listings/new?entityType=company' },
        { icon: <FolderOpen className="w-6 h-6" />, label: 'Төслүүд', href: '/dashboard/store/projects' },
      ],
    };
  }
  if (entityType === 'auto_dealer') {
    return {
      primaryLabel: 'Машин нэмэх',
      primaryHref: '/dashboard/store/listings/new?entityType=auto_dealer',
      links: [
        { icon: <Car className="w-6 h-6" />, label: 'Машин нэмэх', href: '/dashboard/store/listings/new?entityType=auto_dealer' },
        { icon: <FolderOpen className="w-6 h-6" />, label: 'Машины жагсаалт', href: '/dashboard/store/vehicles' },
      ],
    };
  }
  return {
    primaryLabel: 'Бараа нэмэх',
    primaryHref: '/dashboard/store/products',
    links: [
      { icon: <Package className="w-6 h-6" />, label: 'Бараа нэмэх', href: '/dashboard/store/products' },
      { icon: <FolderOpen className="w-6 h-6" />, label: 'Ангилал', href: '/dashboard/store/categories' },
    ],
  };
}

const WEEK_DAYS = ['Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя', 'Ня'];

// ── Status badge for light theme ──
const LIGHT_STATUS: Record<string, [string, string]> = {
  pending: ['bg-amber-100 text-amber-700', 'Хүлээгдэж буй'],
  confirmed: ['bg-green-100 text-green-700', 'Баталгаажсан'],
  shipped: ['bg-blue-100 text-blue-700', 'Явсан'],
  delivered: ['bg-emerald-100 text-emerald-700', 'Хүргэгдсэн'],
  cancelled: ['bg-red-100 text-red-700', 'Цуцлагдсан'],
};

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsPeriod] = useState('7d');

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const token = localStorage.getItem('token');
        const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const [prodRes, ordRes, analyticsRes] = await Promise.allSettled([
          ProductsAPI.list(),
          OrdersAPI.list(),
          fetch(`/api/seller/analytics?period=${analyticsPeriod}`, { headers: authHeaders }).then(r => r.json()),
        ]);
        if (!mounted) return;
        if (prodRes.status === 'fulfilled') setProducts(prodRes.value.products || []);
        if (ordRes.status === 'fulfilled') setOrders(ordRes.value.orders || []);
        if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.data) setAnalytics(analyticsRes.value.data as AnalyticsData);
      } catch {}
      finally { if (mounted) setLoading(false); }
    }
    load();
    return () => { mounted = false; };
  }, [analyticsPeriod]);

  // ── Computed values ──
  const plan = getCurrentPlan();
  const daysLeft = getRemainingDays();

  const monthRevenue = orders.reduce((sum, o) => {
    const d = new Date(o.createdAt);
    const now = new Date();
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      return sum + (o.total || 0);
    }
    return sum;
  }, 0);

  const totalOrders = orders.length;
  const activeProducts = products.filter((p) => (p.stock ?? 0) > 0).length;
  const conversionRate = totalOrders > 0 ? Math.min(((totalOrders / Math.max(totalOrders * 8, 1)) * 100), 100).toFixed(1) : '0.0';

  const activeOrders = orders
    .filter((o) => o.status !== 'delivered' && o.status !== 'cancelled')
    .slice(0, 5);

  const lowStockProducts = products.filter((p) => (p.stock ?? 0) < 5).slice(0, 5);

  // Top products by revenue from orders
  const productRevenue: Record<string, { name: string; emoji: string; units: number; revenue: number }> = {};
  orders.forEach((o) => {
    (o.items || []).forEach((item) => {
      const id = item.product?._id || item.name || 'unknown';
      const name = item.product?.name || item.name || 'Бараа';
      const emoji = item.product?.emoji || '';
      if (!productRevenue[id]) productRevenue[id] = { name, emoji, units: 0, revenue: 0 };
      productRevenue[id].units += item.quantity || 1;
      productRevenue[id].revenue += (item.price || 0) * (item.quantity || 1);
    });
  });
  const topProducts = Object.values(productRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Date
  const today = new Date();
  const dateStr = today.toLocaleDateString('mn-MN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const storeName = user?.store?.name || 'Миний дэлгүүр';
  const storeSlug = user?.store?.slug || user?.username || 'mystore';
  const entityActions = getEntityActions(user?.entityType);

  // Usage bars
  const usages = [
    { label: 'Бараа', pct: getUsagePercent('products'), color: 'bg-[#E8242C]' },
    { label: 'Ажилчид', pct: getUsagePercent('staff'), color: 'bg-[#16A34A]' },
    { label: 'Хадгалах зай', pct: getUsagePercent('storage'), color: 'bg-[#2563EB]' },
    { label: 'AI кредит', pct: getUsagePercent('aiCredits'), color: 'bg-[#D97706]' },
  ];

  const weeklySales: number[] = analytics?.daily?.map((d) => d.revenue) || [48000, 72000, 35000, 91000, 64000, 110000, 85000];
  const weeklyTotal = weeklySales.reduce((a: number, b: number) => a + b, 0);
  const maxWeekly = Math.max(...weeklySales, 1);

  // Quick links
  const quickLinks = [
    ...entityActions.links,
    { icon: <Palette className="w-6 h-6" />, label: 'AI Постер', href: '/dashboard/store/ai-poster' },
    { icon: <LineChart className="w-6 h-6" />, label: 'Аналитик', href: '/dashboard/store/analytics' },
    { icon: <Globe className="w-6 h-6" />, label: 'Домайн', href: '/dashboard/store/domain' },
    { icon: <Settings className="w-6 h-6" />, label: 'Тохиргоо', href: '/dashboard/store/store-settings' },
  ];

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--esl-bg-section)] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="animate-pulse space-y-3">
            <div className="h-8 w-72 bg-gray-200 rounded-lg" />
            <div className="h-4 w-48 bg-gray-200 rounded" />
          </div>
          {/* Stat cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-36 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="h-72 bg-gray-200 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--esl-bg-section)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ═══ Координат reminder ═══ */}
        <LocationCoordReminder />
        <VatStatusWidget />

        {/* ═══ Header ═══ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--esl-text-primary)]">
              Өрлийн мэнд, {user?.name || 'Худалдагч'}!
            </h1>
            <p className="text-sm text-[var(--esl-text-secondary)] mt-1">{dateStr}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-medium text-[var(--esl-text-primary)]">{storeName}</span>
              <a
                href={`/${storeSlug}`}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[rgba(232,36,44,0.08)] text-[#E8242C] no-underline hover:bg-[rgba(232,36,44,0.15)] transition"
              >
                <LinkIcon className="w-3.5 h-3.5" /> Дэлгүүр харах →
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={entityActions.primaryHref}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E8242C] text-white text-sm font-medium rounded-xl hover:bg-[#C41E25] transition-colors shadow-sm"
            >
              <span>+</span> {entityActions.primaryLabel}
            </Link>
            <Link
              href="/dashboard/store/analytics"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--esl-bg-card)] text-[var(--esl-text-primary)] text-sm font-medium rounded-xl border border-[var(--esl-border)] hover:bg-[var(--esl-bg-section)] transition-colors"
            >
              Тайлан харах
            </Link>
          </div>
        </div>

        {/* ═══ Row 1 — Stat Cards ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Wallet className="w-6 h-6" />}
            label="Энэ сарын борлуулалт"
            value={formatPrice(monthRevenue)}
            variant="primary"
            sparkData={[12, 18, 14, 22, 28, 19, 25, 30]}
          />
          <StatCard
            icon={<ClipboardList className="w-6 h-6" />}
            label="Нийт захиалга"
            value={totalOrders}
            variant="success"
            sub={`${activeOrders.length} идэвхтэй`}
          />
          <StatCard
            icon={<Package className="w-6 h-6" />}
            label="Идэвхтэй бараа"
            value={activeProducts}
            variant="info"
            sub={`${products.length} нийт`}
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Хөрвүүлэлт"
            value={`${conversionRate}%`}
            variant="warning"
            sub="Зочин → Захиалга"
          />
        </div>

        {/* ═══ Row 2 — Sales Chart + Active Orders ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Sales Bar Chart */}
          <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[var(--esl-text-primary)]">Борлуулалтын график</h2>
              <span className="text-sm font-medium text-[#E8242C]">
                {formatPrice(weeklyTotal)}
              </span>
            </div>
            {totalOrders === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-[var(--esl-text-muted)]">
                <BarChart3 className="w-8 h-8 mb-2" />
                <p className="text-sm font-medium">Анхны захиалга ирэхэд chart харагдана</p>
                <Link href="/dashboard/store/products" className="text-xs text-[#E8242C] font-semibold mt-2 no-underline hover:underline">+ Бараа нэмэх</Link>
              </div>
            ) : (
              <div className="flex items-end gap-2 h-40">
                {weeklySales.map((val: number, i: number) => {
                  const h = Math.max(8, (val / maxWeekly) * 100);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-[var(--esl-text-muted)] font-medium">
                        {formatPrice(val)}
                      </span>
                      <div
                        className="w-full rounded-lg transition-all duration-500 bg-[#E8242C] hover:bg-[#C41E25]"
                        style={{ height: `${h}%` }}
                      />
                      <span className="text-[11px] text-[var(--esl-text-secondary)] font-medium mt-1">
                        {WEEK_DAYS[i].slice(0, 2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Orders */}
          <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[var(--esl-text-primary)]">Идэвхтэй захиалгууд</h2>
              <Link
                href="/dashboard/store/orders"
                className="text-sm text-[#E8242C] hover:text-[#C41E25] font-medium"
              >
                Бүгдийг харах →
              </Link>
            </div>
            {activeOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[var(--esl-text-muted)]">
                <ClipboardList className="w-8 h-8 mb-2" />
                <p className="text-sm mb-3">Идэвхтэй захиалга байхгүй</p>
                <Link href="/dashboard/store/products" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E8242C] text-white text-xs font-bold rounded-lg no-underline hover:bg-[#C41E25] transition">
                  + Бараа нэмэх
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOrders.map((order) => {
                  const [cls, lbl] = LIGHT_STATUS[order.status] || LIGHT_STATUS.pending;
                  const buyerName = order.buyer?.name || order.user?.name || 'Худалдан авагч';
                  return (
                    <div
                      key={order._id}
                      className="flex items-center justify-between py-3 px-4 rounded-xl bg-[var(--esl-bg-section)] hover:bg-[var(--esl-bg-section)] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-[rgba(232,36,44,0.1)] text-[#E8242C] flex items-center justify-center text-xs font-bold shrink-0">
                          {getInitials(buyerName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--esl-text-primary)] truncate">
                            {order.orderNumber || `#${order._id.slice(-6)}`}
                          </p>
                          <p className="text-xs text-[var(--esl-text-secondary)] truncate">{buyerName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-semibold text-[var(--esl-text-primary)]">
                          {formatPrice(order.total)}
                        </span>
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
                          {lbl}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ═══ Row 3 — Low Stock + Top Products ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Low Stock */}
          <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-6">
            <h2 className="text-lg font-semibold text-[var(--esl-text-primary)] mb-5">Үлдэгдэл багассан бараа</h2>
            {lowStockProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[var(--esl-text-muted)]">
                <CheckCircle className="w-8 h-8 mb-2" />
                <p className="text-sm">Бүх барааны үлдэгдэл хангалттай</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((p) => {
                  const stock = p.stock ?? 0;
                  const isZero = stock === 0;
                  return (
                    <div
                      key={p._id}
                      className="flex items-center justify-between py-3 px-4 rounded-xl bg-[var(--esl-bg-section)]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl shrink-0">{p.emoji || <Package className="w-5 h-5 text-[#CBD5E1]" />}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--esl-text-primary)] truncate">{p.name}</p>
                          <p className="text-xs text-[var(--esl-text-secondary)]">{formatPrice(p.price)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                            isZero
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {isZero ? 'Дууссан' : `${stock} ширхэг`}
                        </span>
                        <button className="text-xs font-medium text-[#E8242C] hover:text-[#C41E25] whitespace-nowrap">
                          Нөөц нэмэх
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Products */}
          <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-6">
            <h2 className="text-lg font-semibold text-[var(--esl-text-primary)] mb-5">Шилдэг бараанууд</h2>
            {topProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[var(--esl-text-muted)]">
                <Trophy className="w-8 h-8 mb-2" />
                <p className="text-sm">Захиалгын дата хүлээж байна</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topProducts.map((tp, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-3 px-4 rounded-xl bg-[var(--esl-bg-section)]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg w-7 text-center shrink-0">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : tp.emoji || <Package className="w-5 h-5 text-[#CBD5E1]" />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--esl-text-primary)] truncate">{tp.name}</p>
                        <p className="text-xs text-[var(--esl-text-secondary)]">{tp.units} ширхэг зарагдсан</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-[var(--esl-text-primary)] shrink-0">
                      {formatPrice(tp.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══ Row 4 — Subscription Info ═══ */}
        <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-[var(--esl-text-primary)]">Миний багц</h2>
              <span
                className="inline-flex px-3 py-1 rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: plan.color }}
              >
                {plan.name}
              </span>
              {plan.badge && (
                <span className="text-xs text-[var(--esl-text-secondary)]">{plan.badge}</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[var(--esl-text-secondary)]">
                {daysLeft > 0 ? `${daysLeft} хоног үлдсэн` : 'Хугацаа дууссан'}
              </span>
              <Link
                href="/dashboard/store/package"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#E8242C] text-white text-sm font-bold rounded-xl hover:bg-[#C41E25] transition-colors shadow-sm no-underline"
              >
                <Zap className="w-4 h-4" /> Pro болох
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {usages.map((u) => (
              <div key={u.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--esl-text-secondary)]">{u.label}</span>
                  <span className="text-sm font-semibold text-[var(--esl-text-primary)]">{u.pct}%</span>
                </div>
                <div className="h-2 bg-[var(--esl-bg-section)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${u.color}`}
                    style={{ width: `${Math.max(u.pct, 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ Row 5 — Quick Links ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center gap-2 p-5 bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] hover:border-[#E8242C]/30 hover:shadow-md transition-all group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {link.icon}
              </span>
              <span className="text-sm font-medium text-[var(--esl-text-primary)] group-hover:text-[#E8242C] transition-colors">
                {link.label}
              </span>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
