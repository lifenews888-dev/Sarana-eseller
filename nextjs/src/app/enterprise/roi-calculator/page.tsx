'use client';

import { useState } from 'react';
import { Calculator, TrendingUp, DollarSign, Clock } from 'lucide-react';

const ESELLER_PLANS = [
  { name: 'Starter', commission: 2, monthly: 500000 },
  { name: 'Business', commission: 1.5, monthly: 1500000 },
  { name: 'Corporate', commission: 1, monthly: 3000000 },
];

function formatMNT(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M₮`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K₮`;
  return `${n.toLocaleString()}₮`;
}

export default function ROICalculatorPage() {
  const [monthlySales, setMonthlySales] = useState(50000000);
  const [employees, setEmployees] = useState(5);
  const [currentPlatformCost, setCurrentPlatformCost] = useState(3000000);
  const [selectedPlan, setSelectedPlan] = useState(1); // Business

  const plan = ESELLER_PLANS[selectedPlan];
  const esellerCommission = monthlySales * (plan.commission / 100);
  const esellerTotal = esellerCommission + plan.monthly;
  const savings = currentPlatformCost - esellerTotal;
  const yearlySavings = savings * 12;
  const breakEven = savings > 0 ? 0 : Math.ceil(Math.abs(savings) / (currentPlatformCost / 12));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <Calculator className="w-10 h-10 text-blue-900 mx-auto mb-3" />
          <h1 className="text-3xl font-extrabold">ROI тооцоолуур</h1>
          <p className="text-[var(--esl-text-secondary)] mt-2">eseller.mn-д шилжихэд таны бизнес хэр хэмнэхийг тооцоол</p>
        </div>

        {/* Inputs */}
        <div className="bg-[var(--esl-bg-card)] rounded-2xl border p-6 mb-6">
          <h2 className="font-bold mb-4">Таны одоогийн байдал</h2>
          <div className="space-y-4">
            <div>
              <label className="flex justify-between text-sm font-medium mb-1">
                <span>Сарын борлуулалт</span>
                <span className="text-blue-900">{formatMNT(monthlySales)}</span>
              </label>
              <input type="range" min={5000000} max={500000000} step={5000000} value={monthlySales}
                onChange={(e) => setMonthlySales(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="flex justify-between text-sm font-medium mb-1">
                <span>Ажилтны тоо</span>
                <span className="text-blue-900">{employees}</span>
              </label>
              <input type="range" min={1} max={100} value={employees}
                onChange={(e) => setEmployees(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="flex justify-between text-sm font-medium mb-1">
                <span>Одоогийн платформ зардал / сар</span>
                <span className="text-blue-900">{formatMNT(currentPlatformCost)}</span>
              </label>
              <input type="range" min={0} max={20000000} step={500000} value={currentPlatformCost}
                onChange={(e) => setCurrentPlatformCost(Number(e.target.value))} className="w-full" />
            </div>
          </div>
        </div>

        {/* Plan selector */}
        <div className="bg-[var(--esl-bg-card)] rounded-2xl border p-6 mb-6">
          <h2 className="font-bold mb-4">eseller багц</h2>
          <div className="grid grid-cols-3 gap-3">
            {ESELLER_PLANS.map((p, i) => (
              <button key={p.name} onClick={() => setSelectedPlan(i)}
                className={`p-3 rounded-xl border-2 text-center transition ${
                  selectedPlan === i ? 'border-blue-900 bg-blue-50' : 'border-[var(--esl-border)]'
                }`}>
                <p className="font-bold text-sm">{p.name}</p>
                <p className="text-xs text-[var(--esl-text-secondary)]">{p.commission}% комисс</p>
                <p className="text-xs text-[var(--esl-text-secondary)]">{formatMNT(p.monthly)}/сар</p>
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="bg-blue-900 rounded-2xl p-6 text-white">
          <h2 className="font-bold text-lg mb-4">Тооцооны дүн</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-white/60 text-xs mb-1">Одоогийн зардал / сар</p>
              <p className="text-xl font-bold">{formatMNT(currentPlatformCost)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-white/60 text-xs mb-1">eseller зардал / сар</p>
              <p className="text-xl font-bold">{formatMNT(esellerTotal)}</p>
              <p className="text-xs text-white/40">{formatMNT(plan.monthly)} + {formatMNT(esellerCommission)} комисс</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <DollarSign className="w-6 h-6 mx-auto mb-1 text-green-400" />
              <p className={`text-2xl font-extrabold ${savings > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {savings > 0 ? '+' : ''}{formatMNT(savings)}
              </p>
              <p className="text-xs text-white/60">Сарын хэмнэлт</p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-1 text-green-400" />
              <p className={`text-2xl font-extrabold ${yearlySavings > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {yearlySavings > 0 ? '+' : ''}{formatMNT(yearlySavings)}
              </p>
              <p className="text-xs text-white/60">Жилийн хэмнэлт</p>
            </div>
            <div className="text-center">
              <Clock className="w-6 h-6 mx-auto mb-1 text-yellow-400" />
              <p className="text-2xl font-extrabold text-yellow-400">
                {breakEven === 0 ? 'Шууд' : `${breakEven} сар`}
              </p>
              <p className="text-xs text-white/60">Break-even</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
