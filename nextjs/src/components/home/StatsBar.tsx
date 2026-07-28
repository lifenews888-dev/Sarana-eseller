'use client';

import { Package, Store, Users } from 'lucide-react';

interface StatsBarProps {
  stats: {
    products: string;
    shops: string;
    users: string;
  };
}

export default function StatsBar({ stats }: StatsBarProps) {
  const items = [
    { icon: <Package className="w-5 h-5 text-[#E8242C]" />, value: stats.products, label: 'бараа' },
    { icon: <Store className="w-5 h-5 text-[#E8242C]" />, value: stats.shops, label: 'дэлгүүр' },
    { icon: <Users className="w-5 h-5 text-[#E8242C]" />, value: stats.users, label: 'хэрэглэгч' },
  ];

  return (
    <section className="bg-[var(--esl-bg-section)] border-y border-[var(--esl-border)]">
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="flex justify-around items-center">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E8242C]/10 flex items-center justify-center">
                {item.icon}
              </div>
              <div>
                <p className="text-[var(--esl-text-primary)] font-extrabold text-lg leading-tight">{item.value}</p>
                <p className="text-[var(--esl-text-muted)] text-xs">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
