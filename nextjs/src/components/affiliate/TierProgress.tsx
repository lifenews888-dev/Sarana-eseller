'use client';

import { motion } from 'framer-motion';
import { Crown, Star, Gem, Trophy, ChevronRight } from 'lucide-react';

const TIERS = [
  { name: 'Хүрэл', min: 0, max: 100000, color: '#92400E', bg: 'from-amber-700 to-amber-800', icon: Star },
  { name: 'Мөнгөн', min: 100000, max: 300000, color: '#64748B', bg: 'from-slate-400 to-slate-500', icon: Gem },
  { name: 'Алтан', min: 300000, max: 700000, color: '#D97706', bg: 'from-amber-400 to-yellow-500', icon: Crown },
  { name: 'Платинум', min: 700000, max: 1500000, color: '#6366F1', bg: 'from-[#E8242C] to-violet-600', icon: Trophy },
];

interface TierProgressProps {
  totalEarnings: number;
  monthlyTarget?: number;
  monthlySales?: number;
}

export default function TierProgress({ totalEarnings, monthlyTarget = 200000, monthlySales = 67500 }: TierProgressProps) {
  const currentTier = TIERS.findIndex((t) => totalEarnings < t.max);
  const tier = TIERS[currentTier >= 0 ? currentTier : TIERS.length - 1];
  const nextTier = TIERS[currentTier + 1];
  const progressInTier = currentTier >= 0
    ? ((totalEarnings - tier.min) / (tier.max - tier.min)) * 100
    : 100;
  const monthlyProgress = Math.min((monthlySales / monthlyTarget) * 100, 100);
  const TierIcon = tier.icon;

  return (
    <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl p-6 space-y-5">
      {/* Current Tier */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.bg} flex items-center justify-center shadow-lg`}>
            <TierIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xs text-[var(--esl-text-muted)] font-medium">Таны зэрэглэл</div>
            <div className="text-lg font-black" style={{ color: tier.color }}>{tier.name}</div>
          </div>
        </div>
        {nextTier && (
          <div className="text-right">
            <div className="text-[10px] text-[var(--esl-text-muted)] uppercase tracking-wider font-semibold">Дараагийн</div>
            <div className="text-sm font-bold text-[var(--esl-text-primary)] flex items-center gap-1">
              {nextTier.name} <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        )}
      </div>

      {/* Tier progress */}
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-[var(--esl-text-muted)] font-medium">Зэрэглэл шилжих</span>
          <span className="font-bold text-[var(--esl-text-primary)]">{Math.round(progressInTier)}%</span>
        </div>
        <div className="h-3 bg-[var(--esl-bg-section)] rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${tier.bg}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progressInTier, 100)}%` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        {nextTier && (
          <div className="text-[11px] text-[var(--esl-text-muted)] mt-1.5">
            {nextTier.name} зэрэглэлд хүрэхэд <span className="font-bold text-[var(--esl-text-primary)]">{((tier.max - totalEarnings) / 1000).toFixed(0)}K₮</span> дутуу
          </div>
        )}
      </div>

      {/* Monthly target */}
      <div className="bg-[var(--esl-bg-section)] rounded-xl p-4">
        <div className="flex justify-between text-xs mb-2">
          <span className="font-semibold text-[var(--esl-text-secondary)]">Сарын зорилго</span>
          <span className="font-bold text-[#6366F1]">{Math.round(monthlyProgress)}%</span>
        </div>
        <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#A78BFA]"
            initial={{ width: 0 }}
            animate={{ width: `${monthlyProgress}%` }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-[var(--esl-text-muted)] mt-1.5">
          <span>{(monthlySales / 1000).toFixed(0)}K₮ борлуулсан</span>
          <span>Зорилго: {(monthlyTarget / 1000).toFixed(0)}K₮</span>
        </div>
      </div>

      {/* Tier benefits */}
      <div className="grid grid-cols-4 gap-2">
        {TIERS.map((t, i) => (
          <div key={t.name} className={`text-center py-2 px-1 rounded-lg border text-[10px] font-bold transition-all ${
            i <= currentTier
              ? 'border-[#6366F1]/20 bg-[#EEF2FF] text-[#6366F1]'
              : 'border-[var(--esl-border)] bg-[var(--esl-bg-card)] text-[#CBD5E1]'
          }`}>
            <t.icon className="w-3.5 h-3.5 mx-auto mb-0.5" />
            {t.name}
          </div>
        ))}
      </div>
    </div>
  );
}
