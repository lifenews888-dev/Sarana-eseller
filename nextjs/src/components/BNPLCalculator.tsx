'use client';

import { useState, useMemo } from 'react';
import { Calculator, CreditCard, Building2, ChevronRight } from 'lucide-react';
import { calculateBNPL, BNPL_BANKS, BNPL_MONTHS } from '@/lib/bnpl';

interface BNPLCalculatorProps {
  price: number;
  onApply?: (months: number, bank: string) => void;
}

export default function BNPLCalculator({ price, onApply }: BNPLCalculatorProps) {
  const [months, setMonths] = useState<number>(6);
  const [bank, setBank] = useState<string>('KHAN');

  const calc = useMemo(() => calculateBNPL(price, months), [price, months]);

  const fmt = (n: number) => n.toLocaleString('mn-MN');

  return (
    <div className="rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Calculator className="h-5 w-5 text-blue-600" />
        <h3 className="text-base font-semibold text-[var(--esl-text-primary)]">Зээлээр авах</h3>
      </div>

      {/* Month selector */}
      <div className="mb-4">
        <p className="mb-2 text-sm text-[var(--esl-text-secondary)]">Хугацаа сонгох</p>
        <div className="flex gap-2">
          {BNPL_MONTHS.map((m) => (
            <button
              key={m}
              onClick={() => setMonths(m)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition ${
                months === m
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-[var(--esl-bg-muted)] text-[var(--esl-text-primary)] hover:bg-[var(--esl-bg-hover)]'
              }`}
            >
              {m} сар
            </button>
          ))}
        </div>
      </div>

      {/* Calculation display */}
      <div className="mb-4 space-y-2 rounded-xl bg-[var(--esl-bg-section)] p-4">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--esl-text-secondary)]">Урьдчилгаа (10%)</span>
          <span className="font-medium text-[var(--esl-text-primary)]">{fmt(calc.downPayment)}₮</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--esl-text-secondary)]">Сарын төлбөр</span>
          <span className="text-lg font-bold text-blue-600">{fmt(calc.monthly)}₮</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--esl-text-secondary)]">Хүү</span>
          <span className="font-medium text-[var(--esl-text-primary)]">{fmt(calc.interest)}₮</span>
        </div>
        <div className="border-t border-[var(--esl-border)] pt-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--esl-text-secondary)]">Нийт төлбөр</span>
            <span className="font-semibold text-[var(--esl-text-primary)]">{fmt(calc.total)}₮</span>
          </div>
        </div>
      </div>

      {/* Bank selector */}
      <div className="mb-4">
        <p className="mb-2 text-sm text-[var(--esl-text-secondary)]">Банк сонгох</p>
        <div className="grid grid-cols-2 gap-2">
          {BNPL_BANKS.map((b) => (
            <button
              key={b.id}
              onClick={() => setBank(b.id)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                bank === b.id
                  ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-600'
                  : 'bg-[var(--esl-bg-muted)] text-[var(--esl-text-primary)] hover:bg-[var(--esl-bg-hover)]'
              }`}
            >
              <Building2 className="h-4 w-4" />
              {b.name}
            </button>
          ))}
        </div>
      </div>

      {/* Apply button */}
      <button
        onClick={() => onApply?.(months, bank)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 active:scale-[0.98]"
      >
        <CreditCard className="h-4 w-4" />
        Зээлээр авах
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
