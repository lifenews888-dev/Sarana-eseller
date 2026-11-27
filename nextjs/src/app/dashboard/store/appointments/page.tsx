'use client';

import { useState } from 'react';
import { formatPrice, cn } from '@/lib/utils';
import { type Appointment, type AppointmentStatus } from '@/lib/types/service';
import {
  Calendar, Clock, User, Filter, Search, Check, X, Play,
  Phone, MoreVertical, ChevronRight,
} from 'lucide-react';

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; bg: string; text: string }> = {
  pending: { label: '⏳ Хүлээгдэж буй', bg: 'bg-amber-50', text: 'text-amber-600' },
  confirmed: { label: '✅ Баталгаажсан', bg: 'bg-blue-50', text: 'text-blue-600' },
  in_progress: { label: '🔄 Явагдаж буй', bg: 'bg-[var(--esl-brand-bg)]', text: 'text-[#E8242C]' },
  completed: { label: '✓ Дууссан', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  cancelled: { label: '✕ Цуцлагдсан', bg: 'bg-red-50', text: 'text-red-500' },
  no_show: { label: '👤 Ирээгүй', bg: 'bg-[var(--esl-bg-muted)]', text: 'text-[var(--esl-text-secondary)]' },
};

const FILTER_STATUSES = ['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const;

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = appointments.filter((a) => {
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchSearch = !search || a.customerName?.toLowerCase().includes(search.toLowerCase()) || a.serviceName?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = appointments.filter((a) => a.date === todayStr).length;
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const weekRevenue = appointments.filter((a) => a.status === 'completed' || a.status === 'confirmed').reduce((s, a) => s + a.total, 0);

  const updateStatus = (id: string, status: AppointmentStatus) => {
    setAppointments((prev) => prev.map((a) => a._id === id ? { ...a, status } : a));
  };

  const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('mn-MN', { month: 'short', day: 'numeric', weekday: 'short' });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-[var(--esl-text-primary)]">
        <strong>Тун удахгүй.</strong> Энэ хэсэг одоогоор серверт хадгалагдахгүй байгаа тул энд оруулсан өөрчлөлт хуудсыг хаахад алга болно.
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A]">Цаг захиалга</h1>
          <p className="text-sm text-[var(--esl-text-muted)]">Бүх цаг захиалгыг удирдах</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Өнөөдрийн цаг', value: todayCount, icon: Calendar, color: '#6366F1' },
          { label: 'Баталгаажуулах', value: pendingCount, icon: Clock, color: '#F59E0B' },
          { label: 'Долоо хоногийн орлого', value: formatPrice(weekRevenue), icon: Check, color: '#10B981' },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.color + '12', color: s.color }}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-[var(--esl-text-muted)] font-medium">{s.label}</div>
              <div className="text-lg font-black text-[#0F172A]">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--esl-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Хэрэглэгч, үйлчилгээ хайх..."
            className="w-full bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#6366F1] transition"
          />
        </div>
        <div className="flex gap-1.5">
          {FILTER_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn('px-3 py-2 rounded-lg text-xs font-semibold border-none cursor-pointer transition whitespace-nowrap',
                filterStatus === s ? 'bg-[#6366F1] text-white' : 'bg-[var(--esl-bg-card)] text-[var(--esl-text-secondary)] border border-[var(--esl-border)] hover:bg-[var(--esl-bg-section)]')}
            >
              {s === 'all' ? 'Бүгд' : STATUS_CONFIG[s as AppointmentStatus]?.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-[var(--esl-text-muted)] uppercase tracking-wider border-b border-[#F1F5F9]">
                <th className="px-5 py-3 text-left font-semibold">Огноо / Цаг</th>
                <th className="px-4 py-3 text-left font-semibold">Хэрэглэгч</th>
                <th className="px-4 py-3 text-left font-semibold">Үйлчилгээ</th>
                <th className="px-4 py-3 text-left font-semibold">Ажилтан</th>
                <th className="px-4 py-3 text-left font-semibold">Төлөв</th>
                <th className="px-4 py-3 text-right font-semibold">Дүн</th>
                <th className="px-4 py-3 text-right font-semibold">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F8FAFC]">
              {filtered.map((a) => {
                const st = STATUS_CONFIG[a.status];
                return (
                  <tr key={a._id} className="hover:bg-[var(--esl-bg-section)] transition-colors">
                    <td className="px-5 py-3">
                      <div className="text-sm font-semibold text-[#0F172A]">{fmtDate(a.date)}</div>
                      <div className="text-xs text-[var(--esl-text-muted)] flex items-center gap-1"><Clock className="w-3 h-3" /> {a.startTime} – {a.endTime}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-[#0F172A]">{a.customerName}</div>
                      {a.customerPhone && <div className="text-xs text-[var(--esl-text-muted)] flex items-center gap-1"><Phone className="w-3 h-3" /> {a.customerPhone}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--esl-text-secondary)]">{a.serviceName}</td>
                    <td className="px-4 py-3 text-sm text-[var(--esl-text-secondary)]">{a.staffName || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', st.bg, st.text)}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#0F172A]">{formatPrice(a.total)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {a.status === 'pending' && (
                          <>
                            <button onClick={() => updateStatus(a._id, 'confirmed')} className="w-7 h-7 rounded-lg bg-emerald-50 border-none cursor-pointer flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition" title="Баталгаажуулах">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => updateStatus(a._id, 'cancelled')} className="w-7 h-7 rounded-lg bg-red-50 border-none cursor-pointer flex items-center justify-center text-red-500 hover:bg-red-100 transition" title="Цуцлах">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {a.status === 'confirmed' && (
                          <button onClick={() => updateStatus(a._id, 'in_progress')} className="w-7 h-7 rounded-lg bg-[var(--esl-brand-bg)] border-none cursor-pointer flex items-center justify-center text-[#E8242C] hover:bg-[var(--esl-brand-bg)] transition" title="Эхлүүлэх">
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {a.status === 'in_progress' && (
                          <button onClick={() => updateStatus(a._id, 'completed')} className="w-7 h-7 rounded-lg bg-emerald-50 border-none cursor-pointer flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition" title="Дуусгах">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3 opacity-30">📅</div>
            <p className="text-sm font-semibold text-[var(--esl-text-muted)]">Цаг захиалга олдсонгүй</p>
          </div>
        )}
      </div>
    </div>
  );
}
