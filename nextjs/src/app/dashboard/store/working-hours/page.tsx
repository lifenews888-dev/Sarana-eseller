'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { DEMO_BUSINESS_HOURS, type BusinessHours } from '@/lib/types/service';
import { Clock, Save, Check, ToggleLeft, ToggleRight } from 'lucide-react';

const DAY_NAMES = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];
const DAY_SHORT = ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'];

const TIME_OPTIONS: string[] = [];
for (let h = 7; h <= 22; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`);
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`);
}

export default function WorkingHoursPage() {
  const [hours, setHours] = useState<BusinessHours[]>(DEMO_BUSINESS_HOURS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleDay = (day: number) => {
    setHours((prev) => prev.map((h) => h.dayOfWeek === day ? { ...h, isClosed: !h.isClosed } : h));
  };

  const updateTime = (day: number, field: 'openTime' | 'closeTime', value: string) => {
    setHours((prev) => prev.map((h) => h.dayOfWeek === day ? { ...h, [field]: value } : h));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const shopId = localStorage.getItem('eseller_shop_id');
      const token = localStorage.getItem('token');
      if (shopId && token) {
        await fetch(`/api/shop/${shopId}/working-hours`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ hours }),
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const openDays = hours.filter((h) => !h.isClosed).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--esl-text-primary)] tracking-tight">Цагийн хуваарь</h1>
          <p className="text-sm text-[var(--esl-text-secondary)] mt-0.5">Бизнесийн ажиллах цагийг тохируулах</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className={cn('flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer transition shadow-sm',
            saved ? 'bg-green-600 text-white' : saving ? 'bg-[var(--esl-bg-elevated)] text-[var(--esl-text-muted)]' : 'bg-[#E8242C] text-white hover:bg-[#C41E25]')}>
          {saved ? <><Check className="w-4 h-4" /> Хадгалагдлаа</> : saving ? 'Хадгалж байна...' : <><Save className="w-4 h-4" /> Хадгалах</>}
        </button>
      </div>

      {/* Summary */}
      <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--esl-brand-bg)] flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#E8242C]" />
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--esl-text-primary)]">Ажлын цаг</div>
            <div className="text-xs text-[var(--esl-text-secondary)]">Долоо хоногт {openDays} өдөр ажиллана</div>
          </div>
        </div>

        {/* Mini week preview */}
        <div className="flex gap-2 mb-1">
          {hours.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((h) => (
            <div key={h.dayOfWeek} className={cn('flex-1 text-center py-2 rounded-lg text-xs font-bold transition',
              h.isClosed ? 'bg-[var(--esl-bg-section)] text-[var(--esl-text-muted)]' : 'bg-[var(--esl-brand-bg)] text-[#E8242C]')}>
              {DAY_SHORT[h.dayOfWeek]}
            </div>
          ))}
        </div>
      </div>

      {/* Schedule rows */}
      <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] overflow-hidden divide-y divide-[var(--esl-border)]">
        {hours.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((h) => (
          <div key={h.dayOfWeek} className={cn('flex items-center gap-4 px-5 py-4 transition', h.isClosed && 'bg-[var(--esl-bg-section)]/50')}>
            {/* Toggle */}
            <button onClick={() => toggleDay(h.dayOfWeek)} className="bg-transparent border-none cursor-pointer p-0 shrink-0">
              {h.isClosed
                ? <ToggleLeft className="w-6 h-6 text-[var(--esl-text-muted)]" />
                : <ToggleRight className="w-6 h-6 text-green-500" />}
            </button>

            {/* Day name */}
            <span className={cn('text-sm font-bold w-16 shrink-0', h.isClosed ? 'text-[var(--esl-text-muted)]' : 'text-[var(--esl-text-primary)]')}>
              {DAY_NAMES[h.dayOfWeek]}
            </span>

            {h.isClosed ? (
              <span className="text-sm text-[var(--esl-text-muted)] italic">Амралтын өдөр</span>
            ) : (
              <div className="flex items-center gap-3">
                <select value={h.openTime} onChange={(e) => updateTime(h.dayOfWeek, 'openTime', e.target.value)}
                  className="px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40 bg-[var(--esl-bg-card)] cursor-pointer appearance-none min-w-[90px] transition">
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <span className="text-[var(--esl-text-muted)] font-medium">—</span>
                <select value={h.closeTime} onChange={(e) => updateTime(h.dayOfWeek, 'closeTime', e.target.value)}
                  className="px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40 bg-[var(--esl-bg-card)] cursor-pointer appearance-none min-w-[90px] transition">
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <span className="text-xs text-[var(--esl-text-muted)] hidden sm:inline">
                  {(() => {
                    const [oh, om] = h.openTime.split(':').map(Number);
                    const [ch, cm] = h.closeTime.split(':').map(Number);
                    const diff = (ch * 60 + cm) - (oh * 60 + om);
                    return diff > 0 ? `${Math.floor(diff / 60)}ц ${diff % 60 ? diff % 60 + 'м' : ''}` : '';
                  })()}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
