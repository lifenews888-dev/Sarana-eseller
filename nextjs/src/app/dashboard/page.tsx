'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package, Wallet, Clock, CheckCircle, ShoppingCart, Heart,
  MessageCircle, MapPin, Crown, ChevronRight, ShoppingBag,
  Store, ArrowRight, Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { OrdersAPI, type Order } from '@/lib/api';
import { formatPrice, STATUS_MAP, cn } from '@/lib/utils';
import { LoyaltyWidget } from '@/components/shared/LoyaltyWidget';
import {
  DashboardPage,
  DashboardHeader,
  DashboardStatGrid,
  DashboardQuickLinks,
  DashboardPrimaryButton,
  DashboardSecondaryButton,
  timeGreeting,
} from '@/components/dashboard/DashboardShell';

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

  return (
    <DashboardPage>
      <DashboardHeader
        badge="Худалдан авагчийн самбар"
        title={`${timeGreeting()}, ${firstName}!`}
        subtitle="Захиалга, хүсэл, чат — бүгдийг нэг дороос удирдаарай."
        actions={
          <>
            <DashboardPrimaryButton href="/store">
              <ShoppingCart size={16} /> Дэлгүүр рүү
            </DashboardPrimaryButton>
            <DashboardSecondaryButton href="/dashboard/orders">
              Захиалгууд <ChevronRight size={16} />
            </DashboardSecondaryButton>
          </>
        }
      />

      <DashboardQuickLinks
        items={[
          { href: '/store', icon: ShoppingBag, label: 'Дэлгүүр', desc: 'Бараа хайх', color: '#E8242C' },
          { href: '/dashboard/orders', icon: Package, label: 'Захиалга', desc: 'Миний түүх', color: '#2563EB' },
          { href: '/dashboard/wishlist', icon: Heart, label: 'Хүсэлт', desc: 'Хадгалсан', color: '#DB2777' },
          { href: '/dashboard/chat', icon: MessageCircle, label: 'Чат', desc: 'Дэлгүүртэй', color: '#7C3AED' },
          { href: '/dashboard/addresses', icon: MapPin, label: 'Хаяг', desc: 'Хүргэлт', color: '#0891B2' },
          { href: '/gold', icon: Crown, label: 'Gold', desc: 'Урамшуулал', color: '#D97706' },
        ]}
      />

      <div className="mb-5 sm:mb-6">
        <LoyaltyWidget context="profile" userId={user?._id || user?.id} />
      </div>

      <DashboardStatGrid
        items={[
          { icon: Package, label: 'Нийт захиалга', value: total, tone: 'primary' },
          { icon: Wallet, label: 'Нийт зарцуулалт', value: formatPrice(spent), tone: 'info' },
          { icon: Clock, label: 'Явж буй', value: pending, tone: 'warning' },
          { icon: CheckCircle, label: 'Хүргэгдсэн', value: done, tone: 'success' },
        ]}
      />

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
    </DashboardPage>
  );
}
