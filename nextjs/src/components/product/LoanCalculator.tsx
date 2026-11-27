'use client';

import { useMemo, useState } from 'react';
import { Calculator, ChevronDown } from 'lucide-react';

type Kind = 'auto' | 'home';

const PRESETS: Record<Kind, { downPct: number; months: number; maxMonths: number; rate: number; terms: number[] }> = {
  auto: { downPct: 30, months: 36, maxMonths: 84, rate: 2.0, terms: [12, 24, 36, 48, 60] },
  home: { downPct: 30, months: 240, maxMonths: 360, rate: 1.5, terms: [60, 120, 180, 240, 360] },
};

const fmt = (n: number) => `${Math.round(n).toLocaleString('en-US')}₮`;

function digitsToNumber(v: string) {
  const n = Number(v.replace(/[^\d]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** Сар бүр тэнцүү төлөлттэй (аннуитет) зээлийн ойролцоо тооцоо */
export function monthlyPayment(principal: number, monthlyRatePct: number, months: number) {
  if (principal <= 0 || months <= 0) return 0;
  const r = monthlyRatePct / 100;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

export default function LoanCalculator({ price, kind, accent = '#E8242C' }: { price: number; kind: Kind; accent?: string }) {
  const preset = PRESETS[kind];
  const [open, setOpen] = useState(false);
  const [priceInput, setPriceInput] = useState(String(Math.round(price)));
  const [downPct, setDownPct] = useState(preset.downPct);
  const [months, setMonths] = useState(preset.months);
  const [rate, setRate] = useState(String(preset.rate));

  const calc = useMemo(() => {
    const p = digitsToNumber(priceInput);
    const down = Math.round((p * downPct) / 100);
    const principal = Math.max(0, p - down);
    const r = Math.max(0, Math.min(10, Number(rate.replace(',', '.')) || 0));
    const pay = monthlyPayment(principal, r, months);
    const total = pay * months;
    return { p, down, principal, pay, total, interest: Math.max(0, total - principal) };
  }, [priceInput, downPct, months, rate]);

  const termLabel = (m: number) => (m % 12 === 0 ? `${m / 12} жил` : `${m} сар`);

  return (
    <section className="rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent p-4 text-left"
        aria-expanded={open}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: `${accent}1A`, color: accent }}>
          <Calculator size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-[var(--esl-text-primary)]">Зээлийн тооцоолуур</span>
          <span className="block text-xs text-[var(--esl-text-muted)]">
            Сарын төлбөр ойролцоогоор <b style={{ color: accent }}>{fmt(calc.pay)}</b> · {termLabel(months)}
          </span>
        </span>
        <ChevronDown size={18} className={`shrink-0 text-[var(--esl-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-[var(--esl-border)] p-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[var(--esl-text-secondary)]">Үнэ</span>
            <input
              inputMode="numeric"
              value={calc.p ? calc.p.toLocaleString('en-US') : ''}
              onChange={(e) => setPriceInput(e.target.value)}
              className="h-11 w-full rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-input,var(--esl-bg))] px-3 text-sm text-[var(--esl-text-primary)] outline-none focus:border-[#E8242C]"
            />
          </label>

          <label className="block">
            <span className="mb-1 flex justify-between text-xs font-semibold text-[var(--esl-text-secondary)]">
              <span>Урьдчилгаа</span>
              <span className="text-[var(--esl-text-primary)]">{downPct}% · {fmt(calc.down)}</span>
            </span>
            <input type="range" min={0} max={90} step={5} value={downPct} onChange={(e) => setDownPct(Number(e.target.value))} className="w-full" style={{ accentColor: accent }} />
          </label>

          <div>
            <span className="mb-1 block text-xs font-semibold text-[var(--esl-text-secondary)]">Хугацаа</span>
            <div className="flex flex-wrap gap-1.5">
              {preset.terms.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonths(m)}
                  className="cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold"
                  style={months === m ? { borderColor: accent, color: accent, background: `${accent}14` } : { borderColor: 'var(--esl-border)', color: 'var(--esl-text-muted)', background: 'transparent' }}
                >
                  {termLabel(m)}
                </button>
              ))}
              <input
                type="number"
                min={1}
                max={preset.maxMonths}
                value={months}
                onChange={(e) => setMonths(Math.max(1, Math.min(preset.maxMonths, Number(e.target.value) || 1)))}
                className="h-8 w-20 rounded-full border border-[var(--esl-border)] bg-transparent px-3 text-xs text-[var(--esl-text-primary)] outline-none"
                aria-label="Хугацаа (сар)"
              />
              <span className="self-center text-[11px] text-[var(--esl-text-muted)]">сар</span>
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[var(--esl-text-secondary)]">Сарын хүү (%)</span>
            <input
              inputMode="decimal"
              value={rate}
              onChange={(e) => setRate(e.target.value.replace(/[^\d.,]/g, '').slice(0, 5))}
              className="h-11 w-full rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-input,var(--esl-bg))] px-3 text-sm text-[var(--esl-text-primary)] outline-none focus:border-[#E8242C]"
            />
            <span className="mt-1 block text-[11px] text-[var(--esl-text-muted)]">Жилийн хүүтэй бол 12-т хуваана (жишээ нь жилийн 12% = сарын 1%).</span>
          </label>

          <div className="grid grid-cols-2 gap-2 rounded-xl bg-[var(--esl-bg-section)] p-3 text-xs">
            <div className="col-span-2">
              <span className="block text-[var(--esl-text-muted)]">Сарын төлбөр</span>
              <span className="block text-xl font-black" style={{ color: accent }}>{fmt(calc.pay)}</span>
            </div>
            <div>
              <span className="block text-[var(--esl-text-muted)]">Зээлийн дүн</span>
              <span className="block font-bold text-[var(--esl-text-primary)]">{fmt(calc.principal)}</span>
            </div>
            <div>
              <span className="block text-[var(--esl-text-muted)]">Нийт хүү</span>
              <span className="block font-bold text-[var(--esl-text-primary)]">{fmt(calc.interest)}</span>
            </div>
            <div className="col-span-2">
              <span className="block text-[var(--esl-text-muted)]">Нийт төлөх (урьдчилгаа орсон)</span>
              <span className="block font-bold text-[var(--esl-text-primary)]">{fmt(calc.total + calc.down)}</span>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-[var(--esl-text-muted)]">
            Энэ бол ойролцоо тооцоо. Бодит хүү, урьдчилгаа, хугацаа нь банк, ББСБ-ын нөхцөл болон таны орлогоос хамаарна.
          </p>
        </div>
      )}
    </section>
  );
}
