'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Service, BusinessHours } from '@/lib/types/service';
import {
  X, Calendar, Clock, User, Phone, ChevronLeft, ChevronRight,
  Check, Loader2, MessageSquare,
} from 'lucide-react';

interface BookingModalProps {
  service: Service;
  shopId: string;
  shopName: string;
  hours: BusinessHours[];
  onClose: () => void;
}

const DAY_NAMES = ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'];
const MONTH_NAMES = ['1-р сар', '2-р сар', '3-р сар', '4-р сар', '5-р сар', '6-р сар', '7-р сар', '8-р сар', '9-р сар', '10-р сар', '11-р сар', '12-р сар'];

type Step = 'date' | 'time' | 'info' | 'done';

function generateTimeSlots(open: string, close: string, duration: number): string[] {
  const slots: string[] = [];
  const [oh, om] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);
  let current = oh * 60 + om;
  const end = ch * 60 + cm;
  while (current + duration <= end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    current += 30; // 30 min intervals
  }
  return slots;
}

function getCalendarDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const days: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  return days;
}

export default function BookingModal({ service, shopId, shopName, hours, onClose }: BookingModalProps) {
  const [step, setStep] = useState<Step>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());

  const calendarDays = useMemo(() => getCalendarDays(calYear, calMonth), [calYear, calMonth]);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const closedDays = new Set(hours.filter((h) => h.isClosed).map((h) => h.dayOfWeek));

  const isDateDisabled = (d: Date) => {
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (ds < todayStr) return true;
    if (closedDays.has(d.getDay())) return true;
    return false;
  };

  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    const dayHours = hours.find((h) => h.dayOfWeek === selectedDate.getDay());
    if (!dayHours || dayHours.isClosed) return [];
    return generateTimeSlots(dayHours.openTime, dayHours.closeTime, service.duration);
  }, [selectedDate, hours, service.duration]);

  const formatDate = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !name.trim() || !phone.trim()) {
      setError('Бүх талбарыг бөглөнө үү');
      return;
    }

    setSubmitting(true);
    setError('');

    const dateStr = formatDate(selectedDate);
    const [sh, sm] = selectedTime.split(':').map(Number);
    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(sh, sm, 0, 0);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service._id,
          shopId,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          scheduledAt: scheduledAt.toISOString(),
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Алдаа гарлаа');
        return;
      }
      setStep('done');
    } catch {
      setError('Холболтын алдаа');
    } finally {
      setSubmitting(false);
    }
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  const durationText = service.duration >= 60
    ? `${Math.floor(service.duration / 60)} цаг${service.duration % 60 ? ` ${service.duration % 60} мин` : ''}`
    : `${service.duration} мин`;

  return (
    <>
      <motion.div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md bg-[var(--esl-bg-card)] sm:rounded-2xl z-[999] flex flex-col sm:max-h-[90vh] overflow-hidden shadow-2xl"
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--esl-border)] shrink-0">
          <div>
            <h3 className="text-base font-bold text-[var(--esl-text-primary)]">Цаг захиалах</h3>
            <p className="text-xs text-[var(--esl-text-secondary)]">{service.name} — {durationText}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[var(--esl-bg-section)] flex items-center justify-center cursor-pointer border-none bg-transparent transition">
            <X className="w-4 h-4 text-[var(--esl-text-muted)]" />
          </button>
        </div>

        {/* Steps indicator */}
        {step !== 'done' && (
          <div className="flex items-center gap-1 px-5 pt-4">
            {['date', 'time', 'info'].map((s, i) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div className={cn('h-1 flex-1 rounded-full transition-colors', step === s || ['time', 'info'].indexOf(step) > i ? 'bg-[#E8242C]' : 'bg-[var(--esl-bg-elevated)]')} />
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* ═══ STEP: Date ═══ */}
          {step === 'date' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className="w-8 h-8 rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-card)] flex items-center justify-center cursor-pointer hover:bg-[var(--esl-bg-section)] transition">
                  <ChevronLeft className="w-4 h-4 text-[var(--esl-text-secondary)]" />
                </button>
                <span className="text-sm font-bold text-[var(--esl-text-primary)]">{MONTH_NAMES[calMonth]} {calYear}</span>
                <button onClick={nextMonth} className="w-8 h-8 rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-card)] flex items-center justify-center cursor-pointer hover:bg-[var(--esl-bg-section)] transition">
                  <ChevronRight className="w-4 h-4 text-[var(--esl-text-secondary)]" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="text-center text-[10px] font-semibold text-[var(--esl-text-muted)] py-1">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((d, i) => {
                  if (!d) return <div key={`e${i}`} />;
                  const disabled = isDateDisabled(d);
                  const isSelected = selectedDate && formatDate(d) === formatDate(selectedDate);
                  const isToday = formatDate(d) === todayStr;

                  return (
                    <button
                      key={formatDate(d)}
                      onClick={() => !disabled && setSelectedDate(d)}
                      disabled={disabled}
                      className={cn(
                        'h-10 rounded-lg text-sm font-medium transition border-none cursor-pointer',
                        disabled && 'text-[var(--esl-text-muted)] cursor-not-allowed bg-transparent',
                        !disabled && !isSelected && 'hover:bg-[var(--esl-brand-bg)] text-[var(--esl-text-primary)] bg-transparent',
                        isSelected && 'bg-[#E8242C] text-white shadow-sm',
                        isToday && !isSelected && !disabled && 'ring-1 ring-[#E8242C]/40',
                      )}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>

              {/* Closed days legend */}
              <div className="mt-3 flex items-center gap-3 text-[10px] text-[var(--esl-text-muted)]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--esl-bg-elevated)]" /> Амралтын өдөр</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#E8242C]" /> Сонгосон</span>
              </div>
            </div>
          )}

          {/* ═══ STEP: Time ═══ */}
          {step === 'time' && (
            <div>
              <button onClick={() => setStep('date')} className="flex items-center gap-1 text-xs text-[#E8242C] font-semibold mb-3 bg-transparent border-none cursor-pointer">
                <ChevronLeft className="w-3 h-3" /> Өдөр солих
              </button>
              <p className="text-sm text-[var(--esl-text-secondary)] mb-3">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                {selectedDate?.toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
              </p>

              {timeSlots.length === 0 ? (
                <div className="text-center py-10 text-sm text-[var(--esl-text-muted)]">Энэ өдөр цаг байхгүй байна</div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTime(t)}
                      className={cn(
                        'py-2.5 rounded-lg text-sm font-semibold border transition cursor-pointer',
                        selectedTime === t
                          ? 'bg-[#E8242C] text-white border-[#E8242C] shadow-sm'
                          : 'bg-[var(--esl-bg-card)] text-[var(--esl-text-primary)] border-[var(--esl-border)] hover:border-[var(--esl-brand-border)] hover:bg-[var(--esl-brand-bg)]'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ STEP: Info ═══ */}
          {step === 'info' && (
            <div className="space-y-4">
              <button onClick={() => setStep('time')} className="flex items-center gap-1 text-xs text-[#E8242C] font-semibold mb-1 bg-transparent border-none cursor-pointer">
                <ChevronLeft className="w-3 h-3" /> Цаг солих
              </button>

              {/* Summary */}
              <div className="bg-[var(--esl-brand-bg)] rounded-xl p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--esl-text-secondary)]">Үйлчилгээ</span>
                  <span className="font-semibold text-[var(--esl-text-primary)]">{service.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--esl-text-secondary)]">Огноо</span>
                  <span className="font-semibold text-[var(--esl-text-primary)]">{selectedDate?.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--esl-text-secondary)]">Цаг</span>
                  <span className="font-semibold text-[var(--esl-text-primary)]">{selectedTime}</span>
                </div>
                <div className="flex justify-between border-t border-[var(--esl-brand-border)] pt-1 mt-1">
                  <span className="text-[var(--esl-text-secondary)]">Үнэ</span>
                  <span className="font-bold text-[#E8242C]">{(service.salePrice || service.price).toLocaleString()}₮</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--esl-text-secondary)] mb-1.5">
                  <User className="w-3 h-3 inline mr-1" />Нэр *
                </label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Таны нэр"
                  className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40 transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--esl-text-secondary)] mb-1.5">
                  <Phone className="w-3 h-3 inline mr-1" />Утас *
                </label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9911-2233"
                  className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40 transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--esl-text-secondary)] mb-1.5">
                  <MessageSquare className="w-3 h-3 inline mr-1" />Тэмдэглэл
                </label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Нэмэлт мэдээлэл (заавал биш)"
                  className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40 transition resize-none" />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>
              )}
            </div>
          )}

          {/* ═══ STEP: Done ═══ */}
          {step === 'done' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-[var(--esl-text-primary)] mb-1">Захиалга амжилттай!</h3>
              <p className="text-sm text-[var(--esl-text-secondary)] mb-4">
                {selectedDate?.toLocaleDateString('mn-MN', { month: 'long', day: 'numeric' })}, {selectedTime} цагт {service.name}
              </p>
              <p className="text-xs text-[var(--esl-text-muted)]">{shopName} таньд баярлалаа. Бид тантай холбоо барих болно.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--esl-border)] shrink-0">
          {step === 'date' && (
            <button onClick={() => selectedDate && setStep('time')} disabled={!selectedDate}
              className={cn('w-full py-3 rounded-xl text-sm font-semibold border-none cursor-pointer transition',
                selectedDate ? 'bg-[#E8242C] text-white hover:bg-[#C41E25]' : 'bg-[var(--esl-bg-elevated)] text-[var(--esl-text-muted)] cursor-not-allowed')}>
              Цаг сонгох →
            </button>
          )}
          {step === 'time' && (
            <button onClick={() => selectedTime && setStep('info')} disabled={!selectedTime}
              className={cn('w-full py-3 rounded-xl text-sm font-semibold border-none cursor-pointer transition',
                selectedTime ? 'bg-[#E8242C] text-white hover:bg-[#C41E25]' : 'bg-[var(--esl-bg-elevated)] text-[var(--esl-text-muted)] cursor-not-allowed')}>
              Мэдээлэл бөглөх →
            </button>
          )}
          {step === 'info' && (
            <button onClick={handleSubmit} disabled={submitting || !name.trim() || !phone.trim()}
              className={cn('w-full py-3 rounded-xl text-sm font-semibold border-none cursor-pointer transition flex items-center justify-center gap-2',
                submitting ? 'bg-[var(--esl-bg-elevated)] text-[var(--esl-text-muted)]' : 'bg-[#E8242C] text-white hover:bg-[#C41E25]')}>
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Илгээж байна...</> : 'Захиалга баталгаажуулах'}
            </button>
          )}
          {step === 'done' && (
            <button onClick={onClose} className="w-full py-3 rounded-xl text-sm font-semibold bg-[var(--esl-bg-section)] text-[var(--esl-text-primary)] hover:bg-[var(--esl-bg-card-hover)] border-none cursor-pointer transition">
              Хаах
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}
