'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Truck, Package, CheckCircle, Clock, DollarSign, BarChart3,
  MapPin, Phone, Navigation, History, Wallet,
} from 'lucide-react';
import { OrdersAPI, type Order } from '@/lib/api';
import { formatPrice, STATUS_MAP, cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/shared/Toast';
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

interface RevenueStats {
  todayRevenue: number;
  monthRevenue: number;
  totalRevenue: number;
  totalDeliveries: number;
}

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);

  useEffect(() => {
    loadOrders();
    loadRevenue();
  }, []);

  async function loadRevenue() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/driver/revenue', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        setRevenue(d.data);
      }
    } catch { /* ignore */ }
  }

  async function loadOrders() {
    try {
      const data = await OrdersAPI.list();
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } as Order : o)));
    try {
      await OrdersAPI.updateStatus(id, status);
      toast.show('Төлөв шинэчлэгдлээ', 'ok');
    } catch {
      toast.show('Алдаа гарлаа', 'error');
      loadOrders();
    }
  }

  const shipped = orders.filter((o) => o.status === 'shipped');
  const delivered = orders.filter((o) => o.status === 'delivered');
  const confirmed = orders.filter((o) => o.status === 'confirmed');
  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  const firstName = user?.name?.split(' ')[0] || user?.name || 'жолооч';

  return (
    <DashboardPage>
      <DashboardHeader
        badge="Жолоочийн самбар"
        title={`${timeGreeting()}, ${firstName}!`}
        subtitle="Хүргэлт, орлого, GPS — нэг дороос"
        actions={
          <>
            <DashboardPrimaryButton href="/dashboard/delivery/active">
              <Truck size={16} /> Идэвхтэй
            </DashboardPrimaryButton>
            <DashboardSecondaryButton href="/dashboard/delivery/earnings">
              <Wallet size={16} /> Орлого
            </DashboardSecondaryButton>
          </>
        }
      />

      <DashboardStatGrid
        cols={6}
        items={[
          {
            icon: DollarSign,
            label: 'Өнөөдрийн орлого',
            value: revenue ? formatPrice(revenue.todayRevenue) : '—',
            tone: 'primary',
          },
          {
            icon: BarChart3,
            label: 'Сарын орлого',
            value: revenue ? formatPrice(revenue.monthRevenue) : '—',
            tone: 'info',
          },
          { icon: Clock, label: 'Хүлээгдэж буй', value: confirmed.length, tone: 'warning' },
          { icon: Truck, label: 'Хүргэлтэнд', value: shipped.length, tone: 'success' },
          { icon: CheckCircle, label: 'Хүргэгдсэн', value: delivered.length, tone: 'success' },
          { icon: Package, label: 'Нийт захиалга', value: orders.length, tone: 'neutral' },
        ]}
      />

      <DashboardQuickLinks
        items={[
          { href: '/dashboard/delivery/active', icon: Truck, label: 'Идэвхтэй', desc: 'Одоогийн', color: '#E8242C' },
          { href: '/dashboard/delivery/history', icon: History, label: 'Түүх', desc: 'Өнгөрсөн', color: '#2563EB' },
          { href: '/dashboard/delivery/earnings', icon: Wallet, label: 'Орлого', desc: 'Тайлан', color: '#16A34A' },
          { href: '/dashboard/settings', icon: Navigation, label: 'Тохиргоо', desc: 'Профайл', color: '#64748B' },
        ]}
      />

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-1 w-fit max-w-full">
        {[
          { id: 'all', label: 'Бүгд' },
          { id: 'confirmed', label: 'Баталгаажсан' },
          { id: 'shipped', label: 'Явж байгаа' },
          { id: 'delivered', label: 'Хүргэгдсэн' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            className={cn(
              'cursor-pointer rounded-lg border-none px-4 py-2 text-xs font-bold transition-all',
              filter === t.id
                ? 'bg-[#E8242C] text-white'
                : 'bg-transparent text-[var(--esl-text-muted)] hover:text-[var(--esl-text-primary)]',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DashboardPanel title="Хүргэлтийн захиалгууд">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--esl-bg-section)]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center">
            <Package className="mx-auto mb-3 h-10 w-10 text-[var(--esl-text-muted)]" />
            <p className="text-sm font-semibold text-[var(--esl-text-primary)]">Захиалга байхгүй</p>
            <p className="mt-1 text-xs text-[var(--esl-text-muted)]">Шинэ хүргэлт ирэхэд энд харагдана</p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--esl-border)] -mx-4 sm:-mx-5">
            {filtered.map((o) => {
              const [cls, label] = STATUS_MAP[o.status] || ['', o.status];
              const address = o.delivery?.address;
              const addrStr = address
                ? [address.district, address.street, address.building].filter(Boolean).join(', ')
                : null;
              return (
                <li key={o._id} className="px-4 py-4 sm:px-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#E8242C]">
                          #{o.orderNumber || o._id?.slice(-5)}
                        </span>
                        <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-bold', cls)}>{label}</span>
                      </div>
                      <p className="text-sm font-bold text-[var(--esl-text-primary)]">
                        {o.user?.name || '—'}
                      </p>
                      {o.delivery?.phone && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-[var(--esl-text-muted)]">
                          <Phone className="h-3 w-3" /> {o.delivery.phone}
                        </p>
                      )}
                      {addrStr && (
                        <a
                          href={`https://maps.google.com?q=${encodeURIComponent(`${addrStr}, Улаанбаатар`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 flex items-center gap-1 text-xs text-blue-600 no-underline hover:underline"
                        >
                          <MapPin className="h-3 w-3" /> {addrStr}
                        </a>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="mb-2 text-sm font-black text-[var(--esl-text-primary)]">
                        {formatPrice(o.total || 0)}
                      </p>
                      {o.status === 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(o._id, 'shipped')}
                          className="cursor-pointer rounded-xl border-none bg-blue-600 px-4 py-2 text-xs font-bold text-white"
                        >
                          <Truck className="mr-1 inline h-3.5 w-3.5" /> Хүргэлтэнд
                        </button>
                      )}
                      {o.status === 'shipped' && (
                        <button
                          type="button"
                          onClick={() => updateStatus(o._id, 'delivered')}
                          className="cursor-pointer rounded-xl border-none bg-emerald-600 px-4 py-2 text-xs font-bold text-white"
                        >
                          <CheckCircle className="mr-1 inline h-3.5 w-3.5" /> Хүргэгдсэн
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </DashboardPanel>

      <div className="mt-5 rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-6 text-center sm:mt-6">
        <Navigation className="mx-auto mb-2 h-8 w-8 text-[#E8242C]" />
        <p className="text-sm font-bold text-[var(--esl-text-primary)]">GPS / газрын зураг</p>
        <p className="mt-1 text-xs text-[var(--esl-text-muted)]">
          Идэвхтэй хүргэлтийн хаягийг Google Maps-ээр нээнэ.
        </p>
        <Link
          href="/dashboard/delivery/active"
          className="mt-3 inline-flex text-xs font-bold text-[#E8242C] no-underline hover:underline"
        >
          Идэвхтэй хүргэлт →
        </Link>
      </div>
    </DashboardPage>
  );
}
