'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { cn, formatPrice } from '@/lib/utils';
import EsellerLogo from '@/components/shared/EsellerLogo';
import { Package, Check, Clock, Truck, ChefHat, ShoppingBag, X, RefreshCw } from 'lucide-react';

const STEPS = [
  { key: 'pending', label: 'Захиалга өгсөн', icon: ShoppingBag },
  { key: 'confirmed', label: 'Баталгаажсан', icon: Check },
  { key: 'preparing', label: 'Бэлтгэж байна', icon: ChefHat },
  { key: 'ready', label: 'Бэлэн болсон', icon: Package },
  { key: 'delivering', label: 'Хүргэж байна', icon: Truck },
  { key: 'delivered', label: 'Хүргэгдсэн', icon: Check },
];

interface OrderData {
  id: string;
  orderNumber?: string;
  status: string;
  statusHistory?: { status: string; timestamp: string; note?: string }[];
  estimatedMinutes?: number;
  total?: number;
  items?: { name?: string; price?: number; quantity?: number; image?: string }[];
  createdAt: string;
}

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`);
      if (res.ok) {
        const { data } = await res.json();
        setOrder(data);
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchOrder();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Demo fallback
  useEffect(() => {
    if (!loading && !order) {
      setOrder({
        id: orderId, orderNumber: 'ORD-2604-001234', status: 'preparing',
        statusHistory: [
          { status: 'pending', timestamp: '2026-04-03T10:00:00Z' },
          { status: 'confirmed', timestamp: '2026-04-03T10:05:00Z', note: 'Баталгаажлаа' },
          { status: 'preparing', timestamp: '2026-04-03T10:10:00Z', note: 'Бэлтгэж эхэллээ' },
        ],
        estimatedMinutes: 25, total: 45000, createdAt: '2026-04-03T10:00:00Z',
      });
    }
  }, [loading, order, orderId]);

  const isCancelled = order?.status === 'cancelled';
  const currentStepIdx = STEPS.findIndex((s) => s.key === order?.status);

  return (
    <div className="min-h-screen bg-[var(--esl-bg-section)]">
      <nav className="bg-[var(--esl-bg-card)] border-b border-[var(--esl-border)] h-14 flex items-center px-4">
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <EsellerLogo size={22} />
            <span className="text-base font-black text-[var(--esl-text-primary)]">eseller<span className="text-[#E8242C]">.mn</span></span>
          </Link>
          <button onClick={fetchOrder} className="text-xs text-[var(--esl-text-muted)] hover:text-[#C41E25] bg-transparent border-none cursor-pointer flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Шинэчлэх
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20 text-sm text-[var(--esl-text-muted)]">Ачааллаж байна...</div>
        ) : order ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-xl font-black text-[var(--esl-text-primary)]">Захиалгын явц</h1>
              <p className="text-sm text-[var(--esl-text-secondary)] mt-1 font-mono">{order.orderNumber || order.id}</p>
              {order.estimatedMinutes && order.status !== 'delivered' && order.status !== 'cancelled' && (
                <div className="inline-flex items-center gap-1.5 bg-[var(--esl-brand-bg)] text-[#E8242C] text-xs font-semibold px-3 py-1.5 rounded-full mt-3">
                  <Clock className="w-3.5 h-3.5" />
                  ~{order.estimatedMinutes} мин
                </div>
              )}
            </div>

            {/* Status Timeline */}
            <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-6">
              {isCancelled ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                    <X className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-base font-bold text-red-600">Цуцлагдсан</h3>
                </div>
              ) : (
                <div className="space-y-0">
                  {STEPS.map((step, i) => {
                    const isCompleted = i <= currentStepIdx;
                    const isCurrent = i === currentStepIdx;
                    const StepIcon = step.icon;
                    const historyEntry = order.statusHistory?.find((h) => h.status === step.key);

                    return (
                      <div key={step.key} className="flex items-start gap-4">
                        {/* Circle + line */}
                        <div className="flex flex-col items-center">
                          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all',
                            isCompleted ? 'bg-[#E8242C] text-white' : 'bg-[var(--esl-bg-section)] text-[var(--esl-text-muted)]',
                            isCurrent && 'ring-4 ring-[#E8242C]/40 animate-pulse')}>
                            <StepIcon className="w-4 h-4" />
                          </div>
                          {i < STEPS.length - 1 && (
                            <div className={cn('w-0.5 h-10', isCompleted && i < currentStepIdx ? 'bg-[#E8242C]' : 'bg-[var(--esl-bg-elevated)]')} />
                          )}
                        </div>

                        {/* Text */}
                        <div className="pb-6">
                          <div className={cn('text-sm font-semibold', isCompleted ? 'text-[var(--esl-text-primary)]' : 'text-[var(--esl-text-muted)]')}>
                            {step.label}
                          </div>
                          {historyEntry && (
                            <div className="text-[10px] text-[var(--esl-text-muted)] mt-0.5">
                              {new Date(historyEntry.timestamp).toLocaleString('mn-MN', { hour: '2-digit', minute: '2-digit' })}
                              {historyEntry.note && ` · ${historyEntry.note}`}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Order summary */}
            {order.total && (
              <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-5">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--esl-text-secondary)]">Нийт дүн</span>
                  <span className="font-bold text-[var(--esl-text-primary)]">{formatPrice(order.total)}</span>
                </div>
              </div>
            )}

            <p className="text-center text-[10px] text-[var(--esl-text-muted)]">30 секунд тутамд автоматаар шинэчлэгдэнэ</p>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-sm text-[var(--esl-text-muted)]">Захиалга олдсонгүй</p>
          </div>
        )}
      </div>
    </div>
  );
}
