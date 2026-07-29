'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package, Clock, Truck, Check, X, ChevronDown, MapPin, ShoppingBag,
} from 'lucide-react';
import {
  DashboardPage,
  DashboardHeader,
  DashboardFilterTabs,
  DashboardEmpty,
  DashboardPrimaryButton,
  DashboardSecondaryButton,
} from '@/components/dashboard/DashboardShell';
import { cn } from '@/lib/utils';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  total: number;
  status: string;
  items: OrderItem[];
  delivery?: { address?: string; phone?: string; note?: string };
  createdAt: string;
}

type FilterTab = 'all' | 'pending' | 'delivered' | 'cancelled';

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Хүлээгдэж буй', color: '#F59E0B', icon: <Clock size={14} /> },
  confirmed: { label: 'Баталгаажсан', color: '#3B82F6', icon: <Check size={14} /> },
  preparing: { label: 'Бэлтгэж байна', color: '#8B5CF6', icon: <Package size={14} /> },
  delivering: { label: 'Хүргэж байна', color: '#F97316', icon: <Truck size={14} /> },
  shipped: { label: 'Явсан', color: '#3B82F6', icon: <Truck size={14} /> },
  delivered: { label: 'Хүргэгдсэн', color: '#22C55E', icon: <Check size={14} /> },
  cancelled: { label: 'Цуцлагдсан', color: '#EF4444', icon: <X size={14} /> },
};

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Бүгд' },
  { key: 'pending', label: 'Хүлээгдэж буй' },
  { key: 'delivered', label: 'Хүргэгдсэн' },
  { key: 'cancelled', label: 'Цуцлагдсан' },
];

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<FilterTab>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setError('Нэвтэрнэ үү');
      return;
    }

    fetch('/api/buyer/orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setOrders(res.data || []);
        else setError('Захиалга ачаалахад алдаа гарлаа');
      })
      .catch(() => setError('Сервертэй холбогдоход алдаа гарлаа'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === 'all' ? orders : orders.filter((o) => o.status === tab);

  return (
    <DashboardPage>
      <DashboardHeader
        badge="Худалдан авагч"
        title="Миний захиалгууд"
        subtitle={`${orders.length} захиалга · төлөв, хүргэлт, еБаримт`}
        actions={
          <>
            <DashboardPrimaryButton href="/store">
              <ShoppingBag size={16} /> Дэлгүүр
            </DashboardPrimaryButton>
            <DashboardSecondaryButton href="/dashboard">Самбар</DashboardSecondaryButton>
          </>
        }
      />

      <DashboardFilterTabs tabs={TABS} value={tab} onChange={setTab} />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-[var(--esl-bg-section)]" />
          ))}
        </div>
      ) : error ? (
        <DashboardEmpty icon={Package} title={error} description="Дахин нэвтэрч үзнэ үү" />
      ) : filtered.length === 0 ? (
        <DashboardEmpty
          icon={ShoppingBag}
          title="Захиалга байхгүй байна"
          description="Дэлгүүрээс бараа сонгоод QPay-р аюулгүй захиалга үүсгээрэй."
          action={
            <DashboardPrimaryButton href="/store">Дэлгүүр үзэх</DashboardPrimaryButton>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((o) => {
            const st = STATUS_MAP[o.status] || STATUS_MAP.pending;
            const isOpen = expanded === o._id;
            return (
              <div
                key={o._id}
                className="overflow-hidden rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)]"
              >
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : o._id)}
                  className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent p-4 text-left"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-[var(--esl-text-primary)]">
                        #{o.orderNumber || o._id.slice(-6)}
                      </span>
                      <span className="text-[11px] text-[var(--esl-text-muted)]">
                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString('mn-MN') : '—'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--esl-text-muted)]">
                      {(o.items || []).length} бараа ·{' '}
                      <span className="font-bold text-[var(--esl-text-primary)]">
                        {(o.total || 0).toLocaleString()}₮
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold"
                      style={{ background: `${st.color}18`, color: st.color }}
                    >
                      {st.icon} {st.label}
                    </span>
                    <ChevronDown
                      size={16}
                      className={cn(
                        'text-[var(--esl-text-muted)] transition-transform',
                        isOpen && 'rotate-180',
                      )}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-[var(--esl-border)] px-4 pb-4 pt-2">
                    {(o.items || []).map((item, i) => (
                      <div
                        key={i}
                        className={cn(
                          'flex justify-between py-2 text-sm',
                          i < (o.items?.length || 0) - 1 && 'border-b border-[var(--esl-border)]',
                        )}
                      >
                        <span className="text-[var(--esl-text-primary)]">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="font-bold text-[var(--esl-text-primary)]">
                          {(item.price * item.quantity).toLocaleString()}₮
                        </span>
                      </div>
                    ))}

                    {o.delivery && (
                      <div className="mt-3 rounded-xl bg-[var(--esl-bg-section)] p-3">
                        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[var(--esl-text-primary)]">
                          <MapPin size={14} className="text-[#E8242C]" /> Хүргэлтийн мэдээлэл
                        </div>
                        {o.delivery.address && (
                          <p className="text-xs text-[var(--esl-text-muted)]">
                            {typeof o.delivery.address === 'string'
                              ? o.delivery.address
                              : JSON.stringify(o.delivery.address)}
                          </p>
                        )}
                        {o.delivery.phone && (
                          <p className="mt-1 text-xs text-[var(--esl-text-muted)]">Утас: {o.delivery.phone}</p>
                        )}
                        {o.delivery.note && (
                          <p className="mt-1 text-xs italic text-[var(--esl-text-muted)]">{o.delivery.note}</p>
                        )}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between border-t border-[var(--esl-border)] pt-3">
                      <span className="text-xs text-[var(--esl-text-muted)]">Нийт дүн</span>
                      <span className="text-lg font-black text-[#E8242C]">
                        {(o.total || 0).toLocaleString()}₮
                      </span>
                    </div>

                    {o.status === 'delivered' && (
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const token = localStorage.getItem('token');
                            const res = await fetch(`/api/orders/${o._id}/receipt`, {
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            if (res.ok) {
                              const d = await res.json();
                              if (d.data?.qrData) window.open(d.data.qrData, '_blank');
                              else alert('еБаримт олдсонгүй');
                            } else alert('еБаримт олдсонгүй');
                          } catch {
                            alert('Алдаа гарлаа');
                          }
                        }}
                        className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-emerald-600/40 bg-emerald-500/10 py-2.5 text-sm font-semibold text-emerald-600"
                      >
                        🧾 еБаримт татах
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardPage>
  );
}
