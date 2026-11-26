'use client';

import { useState, useMemo } from 'react';
import { formatPrice, cn } from '@/lib/utils';
import { type Appointment, type AppointmentStatus } from '@/lib/types/service';
import StatCard from '@/components/dashboard/StatCard';
import {
  Search, Calendar, Clock, Phone, Check, X, Filter,
  ChevronDown, Hourglass, DollarSign,
} from 'lucide-react';

const STATUS_MAP: Record<AppointmentStatus, { label: string; style: string }> = {
  pending:     { label: 'Хүлээгдэж буй', style: 'bg-amber-100 text-amber-700' },
  confirmed:   { label: 'Баталгаажсан',  style: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'Явагдаж буй',   style: 'bg-indigo-100 text-indigo-700' },
  completed:   { label: 'Дууссан',        style: 'bg-green-100 text-green-700' },
  cancelled:   { label: 'Цуцлагдсан',    style: 'bg-red-100 text-red-700' },
  no_show:     { label: 'Ирээгүй',       style: 'bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)]' },
};

const FILTER_TABS = [
  { key: 'all', label: 'Бүгд' },
  { key: 'pending', label: 'Хүлээгдэж буй' },
  { key: 'confirmed', label: 'Баталгаажсан' },
  { key: 'completed', label: 'Дууссан' },
  { key: 'cancelled', label: 'Цуцлагдсан' },
];

export default function BookingsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = useMemo(() => {
    let list = appointments;
    if (filterStatus !== 'all') list = list.filter((a) => a.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.customerName?.toLowerCase().includes(q) || a.serviceName?.toLowerCase().includes(q) || a.customerPhone?.includes(q));
    }
    if (dateFrom) list = list.filter((a) => a.date >= dateFrom);
    if (dateTo) list = list.filter((a) => a.date <= dateTo);
    return list;
  }, [appointments, filterStatus, search, dateFrom, dateTo]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = appointments.filter((a) => a.date === todayStr).length;
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const totalRevenue = appointments.filter((a) => a.status === 'completed' || a.status === 'confirmed').reduce((s, a) => s + a.total, 0);

  const updateStatus = (id: string, status: AppointmentStatus) => {
    setAppointments((prev) => prev.map((a) => a._id === id ? { ...a, status } : a));
  };

  const fmtDate = (d: string) => {
    try { return new Date(d + 'T00:00:00').toLocaleDateString('mn-MN', { month: 'short', day: 'numeric', weekday: 'short' }); }
    catch { return d; }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-[var(--esl-text-primary)]">
        <strong>Тун удахгүй.</strong> Энэ хэсэг одоогоор серверт хадгалагдахгүй байгаа тул энд оруулсан өөрчлөлт хуудсыг хаахад алга болно.
      </div>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--esl-text-primary)] tracking-tight">Цаг захиалга</h1>
        <p className="text-sm text-[var(--esl-text-secondary)] mt-0.5">Бүх цаг захиалгыг удирдах, баталгаажуулах</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={<Calendar className="w-6 h-6" />} label="Өнөөдрийн захиалга" value={todayCount} gradient="indigo" sub="Баталгаажсан + хүлээгдэж буй" />
        <StatCard icon={<Hourglass className="w-6 h-6" />} label="Баталгаажуулах" value={pendingCount} gradient="amber" sub="Хүлээгдэж буй" />
        <StatCard icon={<DollarSign className="w-6 h-6" />} label="Нийт орлого" value={formatPrice(totalRevenue)} gradient="green" sub="Баталгаажсан захиалгаас" />
      </div>

      {/* Filters */}
      <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--esl-text-muted)]" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Хэрэглэгч, утас, үйлчилгээ..."
              className="w-full pl-10 pr-4 py-2 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
          </div>
          {/* Date range */}
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition bg-[var(--esl-bg-card)] cursor-pointer" />
            <span className="text-[var(--esl-text-muted)] text-sm">—</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition bg-[var(--esl-bg-card)] cursor-pointer" />
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1.5 overflow-x-auto">
          {FILTER_TABS.map((t) => (
            <button key={t.key} onClick={() => setFilterStatus(t.key)}
              className={cn('shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer transition',
                filterStatus === t.key ? 'bg-indigo-600 text-white' : 'bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)] hover:bg-[var(--esl-bg-section)]')}>
              {t.label}
              {t.key === 'pending' && pendingCount > 0 && (
                <span className="ml-1 bg-white/20 text-white px-1.5 py-0.5 rounded-full text-[10px]">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-3 opacity-30"><Calendar className="w-10 h-10 mx-auto" /></div>
            <p className="text-sm font-semibold text-[var(--esl-text-muted)]">Захиалга олдсонгүй</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--esl-text-secondary)] border-b border-[var(--esl-border)] bg-[var(--esl-bg-section)]/50">
                  <th className="px-5 py-3 font-medium">Огноо / Цаг</th>
                  <th className="px-4 py-3 font-medium">Хэрэглэгч</th>
                  <th className="px-4 py-3 font-medium">Үйлчилгээ</th>
                  <th className="px-4 py-3 font-medium">Ажилтан</th>
                  <th className="px-4 py-3 font-medium">Төлөв</th>
                  <th className="px-4 py-3 font-medium text-right">Дүн</th>
                  <th className="px-4 py-3 font-medium text-right">Үйлдэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((a) => {
                  const st = STATUS_MAP[a.status];
                  return (
                    <tr key={a._id} className="hover:bg-[var(--esl-bg-section)]/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-[var(--esl-text-primary)]">{fmtDate(a.date)}</div>
                        <div className="text-xs text-[var(--esl-text-muted)] flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {a.startTime} – {a.endTime}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-[var(--esl-text-primary)]">{a.customerName}</div>
                        <div className="text-xs text-[var(--esl-text-muted)] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {a.customerPhone}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[var(--esl-text-primary)]">{a.serviceName}</td>
                      <td className="px-4 py-3.5 text-[var(--esl-text-secondary)]">{a.staffName || '—'}</td>
                      <td className="px-4 py-3.5">
                        <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', st.style)}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-[var(--esl-text-primary)]">{formatPrice(a.total)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {a.status === 'pending' && (
                            <>
                              <button onClick={() => updateStatus(a._id, 'confirmed')} title="Баталгаажуулах"
                                className="w-7 h-7 rounded-lg bg-green-50 border-none cursor-pointer flex items-center justify-center text-green-600 hover:bg-green-100 transition">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => updateStatus(a._id, 'cancelled')} title="Цуцлах"
                                className="w-7 h-7 rounded-lg bg-red-50 border-none cursor-pointer flex items-center justify-center text-red-500 hover:bg-red-100 transition">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {a.status === 'confirmed' && (
                            <button onClick={() => updateStatus(a._id, 'completed')} title="Дуусгах"
                              className="w-7 h-7 rounded-lg bg-green-50 border-none cursor-pointer flex items-center justify-center text-green-600 hover:bg-green-100 transition">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {(a.status === 'completed' || a.status === 'cancelled') && (
                            <span className="text-xs text-[var(--esl-text-muted)]">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
