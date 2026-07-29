'use client';

import { useState, useEffect, useMemo } from 'react';
import { OrdersAPI, Order } from '@/lib/api';
import { formatPrice, STATUS_MAP, timeAgo } from '@/lib/utils';
import { useToast } from '@/components/shared/Toast';
import {
  DashboardPage,
  DashboardHeader,
  DashboardStatGrid,
  DashboardEmpty,
  DashboardPrimaryButton,
  DashboardSecondaryButton,
} from '@/components/dashboard/DashboardShell';
import {
  ClipboardList, Clock, Package, Wallet, MailX, Phone, Link as LinkIcon,
  CheckCircle, ChefHat, Truck, MessageCircle,
  type LucideIcon,
} from 'lucide-react';

type OrderFilter = 'all' | 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

const FILTER_TABS: { key: OrderFilter; label: string; icon?: LucideIcon }[] = [
  { key: 'all', label: 'Бүгд' },
  { key: 'pending', label: 'Хүлээгдэж буй', icon: Clock },
  { key: 'confirmed', label: 'Баталгаажсан', icon: CheckCircle },
  { key: 'preparing', label: 'Бэлтгэж байна', icon: ChefHat },
  { key: 'ready', label: 'Бэлэн', icon: Package },
  { key: 'delivering', label: 'Хүргэж байна', icon: Truck },
  { key: 'delivered', label: 'Хүргэгдсэн', icon: CheckCircle },
];

const LIGHT_STATUS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  preparing: 'bg-orange-100 text-orange-700',
  ready: 'bg-indigo-100 text-indigo-700',
  delivering: 'bg-blue-100 text-blue-700',
  shipped: 'bg-blue-100 text-blue-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};


export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const toast = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await OrdersAPI.list();
      setOrders(res.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === 'pending').length;
    const revenue = orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + (o.total || 0), 0);
    const today = orders.filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString()).length;
    return { total, pending, revenue, today };
  }, [orders]);

  async function handleStatusChange(orderId: string, newStatus: string) {
    try {
      await OrdersAPI.updateStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: newStatus as Order['status'] } : o)));
      if (selectedOrder?._id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status: newStatus as Order['status'] } : null);
      }
      toast.show('Захиалгын төлөв шинэчлэгдлээ', 'ok');
    } catch {
      toast.show('Төлөв шинэчлэхэд алдаа гарлаа', 'error');
    }
  }

  const statusLabel = (s: string) => {
    const map = STATUS_MAP[s];
    return map ? map[1] : s;
  };

  if (loading) {
    return (
      <DashboardPage>
        <div className="mb-5 h-28 animate-pulse rounded-2xl bg-[var(--esl-bg-section)]" />
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-[var(--esl-bg-section)]" />
          ))}
        </div>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage>
      <DashboardHeader
        badge="Дэлгүүр"
        title="Захиалгын удирдлага"
        subtitle="Бүх захиалгыг хянах, төлөв өөрчлөх"
        actions={
          <>
            <DashboardPrimaryButton href="/dashboard/store/chat">
              <MessageCircle size={16} /> Чат
            </DashboardPrimaryButton>
            <DashboardSecondaryButton href="/dashboard/store">Самбар</DashboardSecondaryButton>
          </>
        }
      />

      <DashboardStatGrid
        items={[
          { icon: ClipboardList, label: 'Нийт захиалга', value: stats.total, tone: 'info' },
          { icon: Clock, label: 'Хүлээгдэж буй', value: stats.pending, tone: 'warning' },
          { icon: Package, label: 'Өнөөдрийн', value: stats.today, tone: 'primary' },
          { icon: Wallet, label: 'Хүргэгдсэн орлого', value: formatPrice(stats.revenue), tone: 'success' },
        ]}
      />

      {/* Filter Tabs */}
      <div className="mb-4 flex max-w-full gap-1 overflow-x-auto rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`cursor-pointer whitespace-nowrap rounded-lg border-none px-3 py-2 text-xs font-bold transition-colors ${
              filter === tab.key
                ? 'bg-[#E8242C] text-white'
                : 'bg-transparent text-[var(--esl-text-secondary)] hover:text-[var(--esl-text-primary)]'
            }`}
          >
            {tab.icon && <tab.icon className="w-3.5 h-3.5 inline-block mr-1" />}
            {tab.label}
            {tab.key !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({orders.filter((o) => o.status === tab.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)]">
        {filtered.length === 0 ? (
          <div className="p-4">
            <DashboardEmpty
              icon={MailX}
              title="Захиалга олдсонгүй"
              description="Энэ төлөвт захиалга байхгүй байна"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--esl-bg-section)] border-b border-[var(--esl-border)]">
                  <th className="text-left p-4 text-xs font-semibold text-[var(--esl-text-secondary)] uppercase">Дугаар</th>
                  <th className="text-left p-4 text-xs font-semibold text-[var(--esl-text-secondary)] uppercase">Захиалагч</th>
                  <th className="text-left p-4 text-xs font-semibold text-[var(--esl-text-secondary)] uppercase">Дүн</th>
                  <th className="text-left p-4 text-xs font-semibold text-[var(--esl-text-secondary)] uppercase">Төлөв</th>
                  <th className="text-left p-4 text-xs font-semibold text-[var(--esl-text-secondary)] uppercase">Реферал</th>
                  <th className="text-left p-4 text-xs font-semibold text-[var(--esl-text-secondary)] uppercase">Огноо</th>
                  <th className="text-left p-4 text-xs font-semibold text-[var(--esl-text-secondary)] uppercase">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr
                    key={order._id}
                    className="border-b border-[var(--esl-border)] hover:bg-[var(--esl-bg-section)] cursor-pointer transition-colors"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="p-4 font-mono text-sm font-semibold text-indigo-600">
                      {order.orderNumber || order._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="p-4 text-sm text-[var(--esl-text-primary)]">{order.user?.name || order.buyer?.name || 'Хэрэглэгч'}</td>
                    <td className="p-4 text-sm font-semibold text-[var(--esl-text-primary)]">{formatPrice(order.total || 0)}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${LIGHT_STATUS[order.status] || 'bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)]'}`}>
                        {statusLabel(order.status)}
                      </span>
                    </td>
                    <td className="p-4">
                      {order.referralCode ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs font-medium">
                          <LinkIcon className="w-3 h-3 inline mr-1" />{order.referralCode}
                        </span>
                      ) : (
                        <span className="text-[var(--esl-text-muted)] text-xs">—</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-[var(--esl-text-secondary)]">{timeAgo(order.createdAt)}</td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className="text-xs border border-[var(--esl-border)] rounded-lg px-2 py-1.5 bg-[var(--esl-bg-card)] text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="pending">⏳ Хүлээгдэж буй</option>
                        <option value="confirmed">✅ Баталгаажсан</option>
                        <option value="preparing">👨‍🍳 Бэлтгэж байна</option>
                        <option value="ready">📦 Бэлэн</option>
                        <option value="delivering">🚚 Хүргэж байна</option>
                        <option value="delivered">✓ Хүргэгдсэн</option>
                        <option value="cancelled">❌ Цуцлагдсан</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-[var(--esl-bg-card)] rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[var(--esl-border)]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--esl-text-primary)]">
                  Захиалга #{selectedOrder.orderNumber || selectedOrder._id.slice(-6).toUpperCase()}
                </h2>
                <button onClick={() => setSelectedOrder(null)} className="text-[var(--esl-text-muted)] hover:text-[var(--esl-text-secondary)] text-xl">&times;</button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {/* Customer */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--esl-text-secondary)] uppercase mb-2">Захиалагч</h3>
                <p className="text-[var(--esl-text-primary)] font-medium">{selectedOrder.user?.name || selectedOrder.buyer?.name || 'Хэрэглэгч'}</p>
                {selectedOrder.delivery?.phone && <p className="text-sm text-[var(--esl-text-secondary)] flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selectedOrder.delivery.phone}</p>}
              </div>

              {/* Delivery Address */}
              {selectedOrder.delivery?.address && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--esl-text-secondary)] uppercase mb-2">Хүргэлтийн хаяг</h3>
                  <p className="text-[var(--esl-text-primary)] text-sm">
                    {[selectedOrder.delivery.address.district, selectedOrder.delivery.address.street, selectedOrder.delivery.address.building].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              {/* Items */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--esl-text-secondary)] uppercase mb-2">Бүтээгдэхүүн</h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-[var(--esl-bg-section)] rounded-lg p-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--esl-text-primary)]">{item.name || item.product?.name || 'Бүтээгдэхүүн'}</p>
                        <p className="text-xs text-[var(--esl-text-secondary)]">x{item.quantity || 1}</p>
                      </div>
                      <p className="text-sm font-semibold text-[var(--esl-text-primary)]">{formatPrice((item.price || 0) * (item.quantity || 1))}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center bg-indigo-50 rounded-lg p-4">
                <span className="font-semibold text-[var(--esl-text-primary)]">Нийт дүн</span>
                <span className="text-xl font-bold text-indigo-600">{formatPrice(selectedOrder.total || 0)}</span>
              </div>

              {/* Referral */}
              {selectedOrder.referralCode && (
                <div className="flex items-center gap-2 bg-purple-50 rounded-lg p-3">
                  <LinkIcon className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-purple-700">Реферал код: <strong>{selectedOrder.referralCode}</strong></span>
                </div>
              )}

              {/* Status Update */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--esl-text-secondary)] uppercase mb-2">Төлөв шинэчлэх</h3>
                <div className="flex gap-2">
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(selectedOrder._id, e.target.value)}
                    className="flex-1 border border-[var(--esl-border)] rounded-lg px-3 py-2 text-sm bg-[var(--esl-bg-card)] text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pending">⏳ Хүлээгдэж буй</option>
                    <option value="confirmed">✅ Баталгаажсан</option>
                    <option value="shipped">🚚 Явсан</option>
                    <option value="delivered">📦 Хүргэгдсэн</option>
                    <option value="cancelled">❌ Цуцлагдсан</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardPage>
  );
}
