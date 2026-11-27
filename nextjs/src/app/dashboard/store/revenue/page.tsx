'use client';

import { useState, useEffect, useMemo } from 'react';
import { OrdersAPI, Order } from '@/lib/api';
import { formatPrice, timeAgo } from '@/lib/utils';
import StatCard from '@/components/dashboard/StatCard';
import {
  Wallet, CalendarDays, Clock, Landmark, BadgeDollarSign,
  CheckCircle,
} from 'lucide-react';


export default function RevenuePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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

  const stats = useMemo(() => {
    const delivered = orders.filter((o) => o.status === 'delivered');
    const totalRevenue = delivered.reduce((s, o) => s + (o.total || 0), 0);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = delivered.filter((o) => new Date(o.createdAt) >= monthStart).reduce((s, o) => s + (o.total || 0), 0);
    const pending = orders.filter((o) => o.status === 'shipped' || o.status === 'confirmed').reduce((s, o) => s + (o.total || 0), 0);
    const withdrawn = 350000; // Mock
    return { totalRevenue, thisMonth, pending, withdrawn };
  }, [orders]);

  const revenueHistory = useMemo(() => {
    return orders
      .filter((o) => o.status === 'delivered' || o.status === 'shipped' || o.status === 'confirmed')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--esl-bg-section)] p-6">
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-8 mb-6">
          <div className="h-8 w-48 bg-[var(--esl-bg-elevated)] rounded animate-pulse mb-2" />
          <div className="h-4 w-72 bg-[var(--esl-bg-section)] rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-[var(--esl-bg-elevated)] rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--esl-bg-section)] p-6">
      <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6 mb-6">
        <h1 className="text-2xl font-bold text-[var(--esl-text-primary)]">Орлого</h1>
        <p className="text-[var(--esl-text-secondary)] mt-1">Борлуулалтын орлого, статистик</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Wallet className="w-6 h-6" />} label="Нийт орлого" value={formatPrice(stats.totalRevenue)} gradient="green" />
        <StatCard icon={<CalendarDays className="w-6 h-6" />} label="Энэ сарын" value={formatPrice(stats.thisMonth)} gradient="indigo" />
        <StatCard icon={<Clock className="w-6 h-6" />} label="Хүлээгдэж буй" value={formatPrice(stats.pending)} gradient="amber" />
        <StatCard icon={<Landmark className="w-6 h-6" />} label="Татсан" value={formatPrice(stats.withdrawn)} gradient="pink" />
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-[var(--esl-text-primary)] mb-4">Орлогын түүх</h2>
          {revenueHistory.length === 0 ? (
            <div className="p-8 text-center">
              <BadgeDollarSign className="w-8 h-8 mb-2 mx-auto" />
              <p className="text-[var(--esl-text-muted)]">Одоогоор орлого бүртгэгдээгүй байна</p>
            </div>
          ) : (
            <div className="space-y-3">
              {revenueHistory.map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3 bg-[var(--esl-bg-section)] rounded-lg hover:bg-[var(--esl-bg-section)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      order.status === 'delivered' ? 'bg-green-100' : 'bg-amber-100'
                    }`}>
                      {order.status === 'delivered' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Clock className="w-5 h-5 text-amber-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--esl-text-primary)]">
                        {order.orderNumber || `#${order._id.slice(-6).toUpperCase()}`}
                      </p>
                      <p className="text-xs text-[var(--esl-text-secondary)]">{order.user?.name || 'Хэрэглэгч'} — {timeAgo(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${order.status === 'delivered' ? 'text-green-600' : 'text-amber-600'}`}>
                      +{formatPrice(order.total || 0)}
                    </p>
                    <p className="text-xs text-[var(--esl-text-muted)]">
                      {order.status === 'delivered' ? 'Хүргэгдсэн' : order.status === 'shipped' ? 'Явсан' : 'Баталгаажсан'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6">
          <h2 className="text-lg font-bold text-[var(--esl-text-primary)] mb-4">Товч мэдээлэл</h2>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-xs text-green-600 font-medium">Дундаж захиалга</p>
              <p className="text-xl font-bold text-green-700">
                {formatPrice(revenueHistory.length ? Math.round(revenueHistory.reduce((s, o) => s + (o.total || 0), 0) / revenueHistory.length) : 0)}
              </p>
            </div>
            <div className="p-4 bg-[var(--esl-brand-bg)] rounded-lg">
              <p className="text-xs text-[#E8242C] font-medium">Хүргэгдсэн захиалга</p>
              <p className="text-xl font-bold text-[#E8242C]">{orders.filter((o) => o.status === 'delivered').length}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <p className="text-xs text-amber-600 font-medium">Хүлээгдэж буй</p>
              <p className="text-xl font-bold text-amber-700">{orders.filter((o) => o.status === 'pending').length}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-xs text-purple-600 font-medium">Шимтгэлийн орлого (10%)</p>
              <p className="text-xl font-bold text-purple-700">{formatPrice(Math.round(stats.totalRevenue * 0.1))}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
