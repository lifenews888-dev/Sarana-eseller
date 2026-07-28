'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Package, Wallet, Clock, CheckCircle, ShoppingCart, Heart,
  MessageCircle, MapPin, Crown, ChevronRight, ShoppingBag,
  Store, ArrowRight, Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { OrdersAPI, type Order } from '@/lib/api';
import { formatPrice, STATUS_MAP } from '@/lib/utils';
import { LoyaltyWidget } from '@/components/shared/LoyaltyWidget';
import { cn } from '@/lib/utils';

const QUICK_LINKS = [
  { href: '/store', icon: ShoppingBag, label: 'Дэлгүүр', desc: 'Бараа хайх', color: '#E8242C' },
  { href: '/dashboard/orders', icon: Package, label: 'Захиалга', desc: 'Миний түүх', color: '#2563EB' },
  { href: '/dashboard/wishlist', icon: Heart, label: 'Хүсэлт', desc: 'Хадгалсан', color: '#DB2777' },
  { href: '/dashboard/chat', icon: MessageCircle, label: 'Чат', desc: 'Дэлгүүртэй', color: '#7C3AED' },
  { href: '/dashboard/addresses', icon: MapPin, label: 'Хаяг', desc: 'Хүргэлт', color: '#0891B2' },
  { href: '/gold', icon: Crown, label: 'Gold', desc: 'Урамшуулал', color: '#D97706' },
] as const;

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await OrdersAPI.list();
        if (!cancelled) setOrders(data.orders || []);
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const firstName = user?.name?.split(' ')[0] || user?.name || 'найз';
  const total = orders.length;
  const pending = orders.filter((o) => ['pending', 'confirmed', 'preparing', 'delivering', 'shipped'].includes(o.status)).length;
  const done = orders.filter((o) => o.status === 'delivered').length;
  const spent = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((s, o) => s + (o.total || 0), 0);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Өглөөний мэнд';
    if (h < 18) return 'Өдрийн мэнд';
    return 'Оройн мэнд';
  }, []);

  const stats = [
    { icon: Package, label: 'Нийт захиалга', value: total, tone: 'primary' as const },
    { icon: Wallet, label: 'Нийт зарцуулалт', value: formatPrice(spent), tone: 'info' as const },
    { icon: Clock, label: 'Явж буй', value: pending, tone: 'warning' as const },
    { icon: CheckCircle, label: 'Хүргэгдсэн', value: done, tone: 'success' as const },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-5 overflow-hidden rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] sm:mb-6">
        <div className="relative px-4 py-5 sm:px-6 sm:py-6">
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-40"
            style={{
              background: 'radial-gradient(ellipse at 100% 0%, rgba(232,36,44,0.12), transparent 60%)',
            }}
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--esl-text-muted)]">
                Худалдан авагчийн самбар
              </p>
              <h1 className="text-xl font-black tracking-tight text-[var(--esl-text-primary)] sm:text-2xl">
                {greeting}, {firstName}!
              </h1>
              <p className="mt-1 text-sm text-[var(--esl-text-secondary)]">
                Захиалга, хүсэл, чат — бүгдийг нэг дороос удирдаарай.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/store"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#E8242C] px-4 text-sm font-bold text-white no-underline shadow-sm transition hover:bg-[#C41E25]"
              >
                <ShoppingCart size={16} />
                Дэлгүүр рүү
              </Link>
              <Link
                href="/dashboard/orders"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-section)] px-4 text-sm font-bold text-[var(--esl-text-primary)] no-underline transition hover:border-[#E8242C]/40"
              >
                Захиалгууд
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:mb-6 sm:grid-cols-3 lg:grid-cols-6">
        {QUICK_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex flex-col gap-2 rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-3.5 no-underline transition hover:-translate-y-0.5 hover:border-[#E8242C]/35 hover:shadow-md"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
              style={{ background: item.color }}
            >
              <item.icon size={18} />
            </span>
            <div>
              <p className="text-sm font-bold text-[var(--esl-text-primary)] group-hover:text-[#E8242C]">
                {item.label}
              </p>
              <p className="text-[11px] text-[var(--esl-text-muted)]">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Loyalty */}
      <div className="mb-5 sm:mb-6">
        <LoyaltyWidget context="profile" userId={user?._id || user?.id} />
      </div>

      {/* Stats — light cards for theme contrast (not always white-on-colored) */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4 sm:mb-6 sm:gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-4 sm:p-5"
          >
            <div
              className={cn(
                'mb-3 flex h-10 w-10 items-center justify-center rounded-xl',
                s.tone === 'primary' && 'bg-[rgba(232,36,44,0.12)] text-[#E8242C]',
                s.tone === 'info' && 'bg-blue-500/10 text-blue-600',
                s.tone === 'warning' && 'bg-amber-500/10 text-amber-600',
                s.tone === 'success' && 'bg-emerald-500/10 text-emerald-600',
              )}
            >
              <s.icon size={20} />
            </div>
            <p className="text-xl font-black text-[var(--esl-text-primary)] sm:text-2xl">
              {typeof s.value === 'number' ? s.value.toLocaleString('mn-MN') : s.value}
            </p>
            <p className="mt-0.5 text-xs font-medium text-[var(--esl-text-muted)] sm:text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Recent orders */}
        <div className="overflow-hidden rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[var(--esl-border)] px-4 py-3.5 sm:px-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--esl-text-primary)]">
              <Clock size={16} className="text-[var(--esl-text-muted)]" />
              Сүүлийн захиалгууд
            </h2>
            <Link
              href="/dashboard/orders"
              className="text-xs font-bold text-[#E8242C] no-underline hover:underline"
            >
              Бүгд →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 p-4 sm:p-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--esl-bg-section)]" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="px-4 py-12 text-center sm:px-6">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--esl-bg-section)]">
                <Package className="h-7 w-7 text-[var(--esl-text-muted)]" />
              </div>
              <p className="text-sm font-bold text-[var(--esl-text-primary)]">Захиалга байхгүй байна</p>
              <p className="mx-auto mt-1 max-w-xs text-xs text-[var(--esl-text-muted)]">
                Дэлгүүрээс бараа сонгоод QPay-р аюулгүй захиалгаа үүсгээрэй.
              </p>
              <Link
                href="/store"
                className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-[#E8242C] px-5 text-sm font-bold text-white no-underline"
              >
                Дэлгүүр рүү очих
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--esl-border)]">
              {orders.slice(0, 8).map((o) => {
                const [cls, label] = STATUS_MAP[o.status] || [
                  'bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)]',
                  o.status,
                ];
                return (
                  <li key={o._id}>
                    <Link
                      href="/dashboard/orders"
                      className="flex items-center gap-3 px-4 py-3.5 no-underline transition hover:bg-[var(--esl-bg-section)] sm:px-5"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)]">
                        <Package size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[var(--esl-text-primary)]">
                          #{o.orderNumber || o._id?.slice(-6) || '—'}
                        </p>
                        <p className="text-[11px] text-[var(--esl-text-muted)]">
                          {o.createdAt ? new Date(o.createdAt).toLocaleDateString('mn-MN') : '—'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-[var(--esl-text-primary)]">
                          {formatPrice(o.total || 0)}
                        </p>
                        <span className={cn('mt-0.5 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold', cls)}>
                          {label}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Side promos */}
        <div className="space-y-3 sm:space-y-4">
          <Link
            href="/feed"
            className="block overflow-hidden rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-4 no-underline transition hover:border-[#E8242C]/35"
          >
            <div className="mb-2 flex items-center gap-2">
              <Sparkles size={16} className="text-[#E8242C]" />
              <span className="text-sm font-bold text-[var(--esl-text-primary)]">Зарын булан</span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--esl-text-secondary)]">
              Үл хөдлөх, авто, үйлчилгээ — шууд холбогдох зарууд.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#E8242C]">
              Үзэх <ChevronRight size={14} />
            </span>
          </Link>

          <Link
            href="/become-seller"
            className="block overflow-hidden rounded-2xl border border-[rgba(232,36,44,0.2)] p-4 no-underline"
            style={{ background: 'linear-gradient(135deg, rgba(232,36,44,0.08), rgba(232,36,44,0.02))' }}
          >
            <div className="mb-2 flex items-center gap-2">
              <Store size={16} className="text-[#E8242C]" />
              <span className="text-sm font-bold text-[var(--esl-text-primary)]">Дэлгүүр нээх</span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--esl-text-secondary)]">
              Эхний 3 сар 0% комисс. 5 минутад эхлээрэй.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#E8242C]">
              Эхлэх <ChevronRight size={14} />
            </span>
          </Link>

          <Link
            href="/gold"
            className="block overflow-hidden rounded-2xl border border-[rgba(249,168,37,0.25)] p-4 no-underline"
            style={{ background: 'linear-gradient(135deg, #1A1100 0%, #2D1F00 100%)' }}
          >
            <div className="mb-2 flex items-center gap-2">
              <Crown size={16} className="text-[#F9A825]" />
              <span className="text-sm font-bold text-white">Gold гишүүнчлэл</span>
            </div>
            <p className="text-xs leading-relaxed text-white/60">
              Үнэгүй хүргэлт · нэмэлт хямдрал · 2× оноо
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#F9A825]">
              Дэлгэрэнгүй <ChevronRight size={14} />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
