'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { DEMO_BUSINESS_HOURS, type BusinessHours } from '@/lib/types/service';
import { Clock, Save, ToggleLeft, ToggleRight } from 'lucide-react';

const DAY_NAMES = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];
const TIME_OPTIONS: string[] = [];
for (let h = 8; h <= 21; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`);
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`);
}

export default function SchedulesPage() {
  const [hours, setHours] = useState<BusinessHours[]>(DEMO_BUSINESS_HOURS);

  const toggleDay = (day: number) => {
    setHours((prev) => prev.map((h) => h.dayOfWeek === day ? { ...h, isClosed: !h.isClosed } : h));
  };

  const updateTime = (day: number, field: 'openTime' | 'closeTime', value: string) => {
    setHours((prev) => prev.map((h) => h.dayOfWeek === day ? { ...h, [field]: value } : h));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-[var(--esl-text-primary)]">
        <strong>Тун удахгүй.</strong> Энэ хэсэг одоогоор серверт хадгалагдахгүй байгаа тул энд оруулсан өөрчлөлт хуудсыг хаахад алга болно.
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A]">Ажлын цаг</h1>
          <p className="text-sm text-[var(--esl-text-muted)]">Бизнесийн ажлын цагийг тохируулах</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-[#6366F1] text-white px-5 py-2.5 rounded-xl text-sm font-bold border-none cursor-pointer hover:bg-[#4F46E5] shadow-sm transition">
          <Save className="w-4 h-4" /> Хадгалах
        </button>
      </div>

      <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl overflow-hidden">
        {hours.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((h) => (
          <div key={h.dayOfWeek} className={cn(
            'flex items-center gap-4 px-5 py-4 border-b border-[#F8FAFC] last:border-0',
            h.isClosed && 'opacity-50'
          )}>
            <button
              onClick={() => toggleDay(h.dayOfWeek)}
              className="bg-transparent border-none cursor-pointer p-0"
            >
              {h.isClosed ? <ToggleLeft className="w-5 h-5 text-[var(--esl-text-muted)]" /> : <ToggleRight className="w-5 h-5 text-emerald-500" />}
            </button>

            <span className={cn('text-sm font-bold w-20', h.isClosed ? 'text-[var(--esl-text-muted)]' : 'text-[#0F172A]')}>
              {DAY_NAMES[h.dayOfWeek]}
            </span>

            {h.isClosed ? (
              <span className="text-sm text-[var(--esl-text-muted)]">Амралтын өдөр</span>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--esl-text-muted)]" />
                  <select
                    value={h.openTime}
                    onChange={(e) => updateTime(h.dayOfWeek, 'openTime', e.target.value)}
                    className="bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#6366F1] transition appearance-none cursor-pointer"
                  >
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <span className="text-[var(--esl-text-muted)]">—</span>
                <select
                  value={h.closeTime}
                  onChange={(e) => updateTime(h.dayOfWeek, 'closeTime', e.target.value)}
                  className="bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#6366F1] transition appearance-none cursor-pointer"
                >
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Staff schedules section */}
      <div className="bg-[#EEF2FF] border border-[#6366F1]/10 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-[#0F172A] mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#6366F1]" /> Ажилтан бүрийн хуваарь
        </h3>
        <p className="text-xs text-[var(--esl-text-secondary)] mb-3">Ажилтан бүрд өөр өөр ажлын цаг тохируулах боломжтой.</p>
        <button className="text-xs font-bold text-[#6366F1] bg-[var(--esl-bg-card)] px-4 py-2 rounded-lg border border-[#6366F1]/20 cursor-pointer hover:bg-[#6366F1] hover:text-white transition">
          Ажилтнууд руу очих →
        </button>
      </div>
    </div>
  );
}
