'use client';

import { motion } from 'framer-motion';
import { MousePointerClick, ShoppingCart, CreditCard } from 'lucide-react';

interface FunnelStep {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}

interface ConversionFunnelProps {
  views?: number;
  clicks?: number;
  addToCart?: number;
  purchases?: number;
}

// Зөвхөн бодитоор хэмжигддэг 2 алхам: холбоосын товшилт → төлөгдсөн захиалга.
export default function ConversionFunnel({
  clicks = 0,
  purchases = 0,
}: ConversionFunnelProps) {
  const steps: FunnelStep[] = [
    { label: 'Холбоос дарсан', value: clicks, icon: MousePointerClick, color: '#EC4899' },
    { label: 'Худалдан авсан', value: purchases, icon: CreditCard, color: '#10B981' },
  ];
  const views = clicks;

  const maxVal = steps[0].value || 1;

  return (
    <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl p-6">
      <h3 className="font-bold text-[var(--esl-text-primary)] mb-5 flex items-center gap-2 text-sm">
        <ShoppingCart className="w-4 h-4 text-[#6366F1]" />
        Борлуулалтын шүүлтүүр (Funnel)
      </h3>

      <div className="space-y-3">
        {steps.map((step, i) => {
          const pct = (step.value / maxVal) * 100;
          const prev = i > 0 ? steps[i - 1].value : 0;
          const convRate = i === 0 ? '100' : prev > 0 ? Math.min(100, (step.value / prev) * 100).toFixed(1) : '0';
          const StepIcon = step.icon;

          return (
            <div key={step.label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <StepIcon className="w-4 h-4" style={{ color: step.color }} />
                  <span className="text-xs font-semibold text-[var(--esl-text-secondary)]">{step.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-[var(--esl-text-primary)]">{step.value.toLocaleString()}</span>
                  {i > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: step.color + '15', color: step.color }}>
                      {convRate}%
                    </span>
                  )}
                </div>
              </div>
              <div className="h-2.5 bg-[var(--esl-bg-section)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: step.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--esl-border)] flex items-center justify-between">
        <span className="text-xs text-[var(--esl-text-muted)]">Нийт хөрвүүлэлт</span>
        <span className="text-sm font-black text-[#10B981]">
          {((purchases / (views || 1)) * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
