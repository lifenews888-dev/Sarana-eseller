'use client';
import { Landmark, type LucideIcon } from 'lucide-react';

const METHODS: { id: string; name: string; icon: LucideIcon; desc: string; color: string }[] = [
  { id: 'qpay', name: 'QPay', icon: Landmark, desc: 'QR төлбөр', color: '#E8242C' },
];

export function PaymentMethods({ selected, onChange }: { selected: string; onChange: (m: string) => void }) {
  return (
    <div>
      <h3 className="text-[var(--esl-text)] font-bold mb-3 text-base">Төлбөрийн арга</h3>
      <div className="flex flex-col gap-2">
        {METHODS.map((m) => (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            className="flex items-center gap-3.5 p-3.5 rounded-xl w-full text-left cursor-pointer transition-all border"
            style={{
              background: selected === m.id ? `${m.color}12` : 'var(--esl-bg-section)',
              borderColor: selected === m.id ? m.color : 'var(--esl-border)',
            }}
          >
            <m.icon className="w-7 h-7" style={{ color: m.color }} />
            <div className="flex-1">
              <p className="text-[var(--esl-text)] font-bold text-[15px] m-0">{m.name}</p>
              <p className="text-[var(--esl-text-muted)] text-xs m-0">{m.desc}</p>
            </div>
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ border: `2px solid ${selected === m.id ? m.color : 'var(--esl-border)'}`, background: selected === m.id ? m.color : 'transparent' }}
            >
              {selected === m.id && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
