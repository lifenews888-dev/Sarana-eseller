'use client';
import { useEffect, useState } from 'react';

interface PreOrderItem {
  _id: string;
  customerName: string;
  product: string;
  quantity: number;
  depositPaid: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'ready';
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Хүлээгдэж байна',
  confirmed: 'Баталгаажсан',
  ready: 'Бэлэн',
  cancelled: 'Цуцлагдсан',
};

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  ready: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-[var(--esl-bg-muted)] text-[var(--esl-text-secondary)]',
};

export default function QueuePage() {
  const [orders, setOrders] = useState<PreOrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/seller/pre-orders')
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/seller/pre-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => {});
    setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status: status as PreOrderItem['status'] } : o)));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Захиалгын дараалал</h1>
      {loading ? (
        <div className="animate-pulse h-40 bg-[var(--esl-bg-muted)] rounded-xl" />
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-[var(--esl-text-muted)]">
          <p className="text-lg">Одоогоор захиалга байхгүй байна</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order._id} className="bg-[var(--esl-bg-card)] rounded-xl border p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{order.customerName}</p>
                <p className="text-sm text-[var(--esl-text-secondary)]">
                  {order.product} — {order.quantity}ш
                </p>
                <p className="text-sm text-[var(--esl-text-muted)]">
                  {new Date(order.createdAt).toLocaleDateString('mn-MN')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-xs ${STATUS_CLASS[order.status]}`}>
                  {STATUS_LABEL[order.status]}
                </span>
                {order.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(order._id, 'confirmed')}
                      className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg"
                    >
                      Батлах
                    </button>
                    <button
                      onClick={() => updateStatus(order._id, 'cancelled')}
                      className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg"
                    >
                      Цуцлах
                    </button>
                  </div>
                )}
                {order.status === 'confirmed' && (
                  <button
                    onClick={() => updateStatus(order._id, 'ready')}
                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg"
                  >
                    Бэлэн болсон
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
