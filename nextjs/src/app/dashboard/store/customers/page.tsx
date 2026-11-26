'use client';

import { useState, useEffect, useMemo } from 'react';
import { OrdersAPI, Order } from '@/lib/api';
import { formatPrice, timeAgo } from '@/lib/utils';
import StatCard from '@/components/dashboard/StatCard';
import { Users, UserPlus, RefreshCw, Search } from 'lucide-react';

interface Customer {
  name: string;
  orderCount: number;
  totalSpent: number;
  lastOrder: string;
  firstOrder: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MOCK_ORDERS: Order[] = [
  { _id: '1', orderNumber: 'ORD-1001', user: { name: 'Бат-Эрдэнэ' }, total: 70000, status: 'delivered', createdAt: '2026-04-02T10:00:00Z' },
  { _id: '2', orderNumber: 'ORD-1002', user: { name: 'Сарангэрэл' }, total: 99000, status: 'confirmed', createdAt: '2026-04-01T14:30:00Z' },
  { _id: '3', orderNumber: 'ORD-1003', user: { name: 'Ганбаатар' }, total: 91000, status: 'shipped', createdAt: '2026-03-30T09:15:00Z' },
  { _id: '4', orderNumber: 'ORD-1004', user: { name: 'Оюунчимэг' }, total: 84000, status: 'delivered', createdAt: '2026-03-28T16:45:00Z' },
  { _id: '5', orderNumber: 'ORD-1005', user: { name: 'Тэмүүлэн' }, total: 44000, status: 'pending', createdAt: '2026-04-03T08:00:00Z' },
  { _id: '6', orderNumber: 'ORD-1006', user: { name: 'Болормаа' }, total: 75000, status: 'confirmed', createdAt: '2026-04-02T11:20:00Z' },
  { _id: '7', orderNumber: 'ORD-1007', user: { name: 'Бат-Эрдэнэ' }, total: 55000, status: 'delivered', createdAt: '2026-03-20T12:00:00Z' },
  { _id: '8', orderNumber: 'ORD-1008', user: { name: 'Сарангэрэл' }, total: 38000, status: 'delivered', createdAt: '2026-03-15T09:00:00Z' },
  { _id: '9', orderNumber: 'ORD-1009', user: { name: 'Ганбаатар' }, total: 28000, status: 'delivered', createdAt: '2026-02-28T14:00:00Z' },
  { _id: '10', orderNumber: 'ORD-1010', user: { name: 'Энхтүвшин' }, total: 125000, status: 'pending', createdAt: '2026-04-03T07:30:00Z' },
];

export default function CustomersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await OrdersAPI.list();
      setOrders(res.orders || []); // хуурамч захиалгаар орлого/харилцагч харуулахгүй
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  const customers = useMemo(() => {
    const map = new Map<string, Customer>();
    for (const order of orders) {
      const name = order.user?.name || order.buyer?.name || 'Хэрэглэгч';
      const existing = map.get(name);
      if (existing) {
        existing.orderCount++;
        existing.totalSpent += order.total || 0;
        if (new Date(order.createdAt) > new Date(existing.lastOrder)) existing.lastOrder = order.createdAt;
        if (new Date(order.createdAt) < new Date(existing.firstOrder)) existing.firstOrder = order.createdAt;
      } else {
        map.set(name, { name, orderCount: 1, totalSpent: order.total || 0, lastOrder: order.createdAt, firstOrder: order.createdAt });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    return customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [customers, search]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = customers.filter((c) => new Date(c.firstOrder) >= monthStart).length;
    const repeatBuyers = customers.filter((c) => c.orderCount > 1).length;
    return { total: customers.length, newThisMonth, repeatBuyers };
  }, [customers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--esl-bg-section)] p-6">
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-8 mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-72 bg-[var(--esl-bg-section)] rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--esl-bg-section)] p-6">
      {/* Header */}
      <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6 mb-6">
        <h1 className="text-2xl font-bold text-[var(--esl-text-primary)]">Харилцагчид</h1>
        <p className="text-[var(--esl-text-secondary)] mt-1">Захиалга өгсөн харилцагчдын жагсаалт</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<Users className="w-6 h-6" />} label="Нийт харилцагч" value={stats.total} gradient="indigo" />
        <StatCard icon={<UserPlus className="w-6 h-6" />} label="Энэ сард шинэ" value={stats.newThisMonth} gradient="pink" />
        <StatCard icon={<RefreshCw className="w-6 h-6" />} label="Давтан худалдан авагч" value={stats.repeatBuyers} gradient="green" />
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Харилцагч хайх..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 border border-[var(--esl-border)] rounded-lg bg-[var(--esl-bg-card)] text-[var(--esl-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Customer Table */}
      <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mb-3"><Users className="w-10 h-10 mx-auto" /></div>
            <h3 className="text-lg font-semibold text-[var(--esl-text-primary)]">Харилцагч олдсонгүй</h3>
            <p className="text-[var(--esl-text-muted)] mt-1">Захиалга орсны дараа харилцагчид энд харагдана</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--esl-bg-section)] border-b border-[var(--esl-border)]">
                  <th className="text-left p-4 text-xs font-semibold text-[var(--esl-text-secondary)] uppercase">#</th>
                  <th className="text-left p-4 text-xs font-semibold text-[var(--esl-text-secondary)] uppercase">Нэр</th>
                  <th className="text-left p-4 text-xs font-semibold text-[var(--esl-text-secondary)] uppercase">Захиалгын тоо</th>
                  <th className="text-left p-4 text-xs font-semibold text-[var(--esl-text-secondary)] uppercase">Нийт зарцуулсан</th>
                  <th className="text-left p-4 text-xs font-semibold text-[var(--esl-text-secondary)] uppercase">Сүүлийн захиалга</th>
                  <th className="text-left p-4 text-xs font-semibold text-[var(--esl-text-secondary)] uppercase">Төрөл</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.name} className="border-b border-[var(--esl-border)] hover:bg-[var(--esl-bg-section)] transition-colors">
                    <td className="p-4 text-sm text-[var(--esl-text-muted)]">{i + 1}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                          {c.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-[var(--esl-text-primary)]">{c.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-[var(--esl-text-primary)]">{c.orderCount} захиалга</td>
                    <td className="p-4 text-sm font-semibold text-[var(--esl-text-primary)]">{formatPrice(c.totalSpent)}</td>
                    <td className="p-4 text-sm text-[var(--esl-text-secondary)]">{timeAgo(c.lastOrder)}</td>
                    <td className="p-4">
                      {c.orderCount > 1 ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">Давтан</span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">Шинэ</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
