'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn, formatPrice } from '@/lib/utils';
import { type Appointment } from '@/lib/types/service';
import {
  ChevronLeft, ChevronRight, Plus, Filter, Clock, User,
} from 'lucide-react';

const HOURS = Array.from({ length: 11 }, (_, i) => i + 9); // 09:00 - 19:00
const DAY_NAMES = ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'];
const DAY_NAMES_FULL = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];
const STAFF_COLORS: Record<string, string> = {
  'Сараа': '#6366F1',
  'Туяа': '#EC4899',
  'Жаргал': '#10B981',
};

function getWeekDates(base: Date): Date[] {
  const start = new Date(base);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Start Monday
  start.setDate(start.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function fmtDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function CalendarPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [filterStaff, setFilterStaff] = useState<string | null>(null);
  const [appointments] = useState<Appointment[]>([]);

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);
  const today = fmtDate(new Date());

  const filtered = filterStaff
    ? appointments.filter((a) => a.staffName === filterStaff)
    : appointments;

  const staffList = [...new Set(appointments.map((a) => a.staffName).filter(Boolean))] as string[];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-[var(--esl-text-primary)]">
        <strong>Тун удахгүй.</strong> Энэ хэсэг одоогоор серверт хадгалагдахгүй байгаа тул энд оруулсан өөрчлөлт хуудсыг хаахад алга болно.
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A]">Хуанли</h1>
          <p className="text-sm text-[var(--esl-text-muted)]">Долоо хоногийн цаг захиалгын хуанли</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-[#6366F1] text-white px-5 py-2.5 rounded-xl text-sm font-bold border-none cursor-pointer hover:bg-[#4F46E5] shadow-sm transition">
          <Plus className="w-4 h-4" /> Цаг нэмэх
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl p-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset((w) => w - 1)} className="w-8 h-8 rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-card)] flex items-center justify-center cursor-pointer hover:bg-[var(--esl-bg-section)] transition">
            <ChevronLeft className="w-4 h-4 text-[var(--esl-text-secondary)]" />
          </button>
          <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 text-xs font-bold text-[#6366F1] bg-[#EEF2FF] rounded-lg border-none cursor-pointer hover:bg-[#6366F1] hover:text-white transition">
            Өнөөдөр
          </button>
          <button onClick={() => setWeekOffset((w) => w + 1)} className="w-8 h-8 rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-card)] flex items-center justify-center cursor-pointer hover:bg-[var(--esl-bg-section)] transition">
            <ChevronRight className="w-4 h-4 text-[var(--esl-text-secondary)]" />
          </button>
          <span className="text-sm font-semibold text-[#0F172A] ml-2">
            {weekDates[0].toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' })} — {weekDates[6].toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Staff filter */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterStaff(null)}
            className={cn('px-2.5 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer transition',
              !filterStaff ? 'bg-[#6366F1] text-white' : 'bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)] hover:bg-[#E2E8F0]')}
          >
            Бүгд
          </button>
          {staffList.map((name) => (
            <button
              key={name}
              onClick={() => setFilterStaff(filterStaff === name ? null : name)}
              className={cn('px-2.5 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer transition flex items-center gap-1',
                filterStaff === name ? 'text-white' : 'bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)] hover:bg-[#E2E8F0]')}
              style={filterStaff === name ? { background: STAFF_COLORS[name] || '#6366F1' } : undefined}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: STAFF_COLORS[name] || '#94A3B8' }} />
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[var(--esl-border)]">
          <div className="p-2" />
          {weekDates.map((d, i) => {
            const isToday = fmtDate(d) === today;
            return (
              <div key={i} className={cn('p-3 text-center border-l border-[#F1F5F9]', isToday && 'bg-[#EEF2FF]')}>
                <div className="text-[10px] font-semibold text-[var(--esl-text-muted)] uppercase">{DAY_NAMES[d.getDay()]}</div>
                <div className={cn(
                  'text-lg font-black mt-0.5',
                  isToday ? 'text-[#6366F1]' : 'text-[#0F172A]'
                )}>
                  {d.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time slots */}
        <div className="max-h-[600px] overflow-y-auto">
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[#F8FAFC] min-h-[60px]">
              <div className="p-2 text-right pr-3">
                <span className="text-[11px] font-medium text-[var(--esl-text-muted)]">{String(hour).padStart(2, '0')}:00</span>
              </div>
              {weekDates.map((d, di) => {
                const dateStr = fmtDate(d);
                const hourAppts = filtered.filter((a) => {
                  if (a.date !== dateStr) return false;
                  const aHour = parseInt(a.startTime.split(':')[0]);
                  return aHour === hour;
                });

                return (
                  <div
                    key={di}
                    className={cn(
                      'border-l border-[#F8FAFC] p-0.5 relative min-h-[60px]',
                      fmtDate(d) === today && 'bg-[#FAFAFF]'
                    )}
                  >
                    {hourAppts.map((a) => {
                      const staffColor = STAFF_COLORS[a.staffName || ''] || '#94A3B8';
                      return (
                        <div
                          key={a._id}
                          className="rounded-lg p-1.5 mb-0.5 cursor-pointer hover:opacity-90 transition text-white text-[10px]"
                          style={{ background: staffColor }}
                        >
                          <div className="font-bold truncate">{a.serviceName}</div>
                          <div className="opacity-80 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {a.startTime}–{a.endTime}
                          </div>
                          <div className="opacity-70 truncate flex items-center gap-1">
                            <User className="w-2.5 h-2.5" />
                            {a.customerName}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
