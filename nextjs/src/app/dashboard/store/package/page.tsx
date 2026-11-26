'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared/Toast';
import { formatPrice } from '@/lib/utils';
import {
  PLANS_LIST as PLANS,
  PlanId,
  getSubscription,
  saveSubscription,
  getCurrentPlan,
  getRemainingDays,
  getUsagePercent,
} from '@/lib/subscription';

function UsageBar({ label, percent, color }: { label: string; percent: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[var(--esl-text-secondary)]">{label}</span>
        <span className="font-semibold text-[var(--esl-text-primary)]">{percent < 0 ? 'Хязгааргүй' : `${percent}%`}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--esl-border)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percent < 0 ? 0 : Math.min(percent, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function PackagePage() {
  const toast = useToast();
  const [yearly, setYearly] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<PlanId>('free');
  const [mounted, setMounted] = useState(false);

  const [serverExpiresAt, setServerExpiresAt] = useState<string | null>(null);
  const [requested, setRequested] = useState<PlanId | null>(null);

  useEffect(() => {
    // Багцыг серверээс (идэвхтэй дэлгүүрийнх) уншина. Өмнө нь localStorage-аас уншдаг тул
    // хөтөч дээр "идэвхжүүлсэн" хуурамч багц харагдаж, сервер дээр Үнэгүй хэвээр байв.
    const token = localStorage.getItem('token');
    fetch('/api/seller/subscription', { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const key = data?.planKey as PlanId | undefined;
        const valid = key && PLANS.some((p) => p.id === key);
        setCurrentPlanId(valid && data?.isActive !== false ? key : 'free');
        setServerExpiresAt(data?.expiresAt ?? null);
        // Хуучин хуурамч localStorage багцыг серверийнхтэй тааруулна
        const local = getSubscription();
        if (local.planId !== (valid ? key : 'free')) saveSubscription({ ...local, planId: valid ? key! : 'free' });
      })
      .catch(() => setCurrentPlanId('free'))
      .finally(() => setMounted(true));
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--esl-bg-section)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const plan = getCurrentPlan();
  const sub = getSubscription();
  const remaining = getRemainingDays(serverExpiresAt);
  const usageProducts = getUsagePercent('products');
  const usageStaff = getUsagePercent('staff');
  const usageStorage = getUsagePercent('storage');
  const usageAI = getUsagePercent('aiCredits');

  function handleSelect(planId: PlanId) {
    if (planId === currentPlanId) return;
    // Өмнө нь энд төлбөргүйгээр localStorage-д "идэвхжлээ!" гэж хадгалдаг байв (сервер дээр
    // өөрчлөгддөггүй, хязгаар нь хэвээр). Бодит идэвхжүүлэлт төлбөр баталгаажсаны дараа
    // админаас хийгдэнэ.
    setRequested(planId);
    const newPlan = PLANS.find((p) => p.id === planId);
    toast.show(`${newPlan?.name ?? planId} багц идэвхжүүлэх заавар доор харагдана`, 'ok');
    window.setTimeout(() => document.getElementById('plan-upgrade-help')?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  return (
    <div className="min-h-screen bg-[var(--esl-bg-section)] p-4 md:p-6">
      {/* Header */}
      <div className="rounded-xl border border-[var(--esl-border)] p-6 mb-6" style={{ backgroundColor: 'var(--esl-bg-card)' }}>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">📦</span>
          <h1 className="text-2xl font-bold text-[var(--esl-text-primary)]">Үнийн багц</h1>
        </div>
        <p className="text-[var(--esl-text-secondary)] text-sm">Дэлгүүрийнхээ боломжийг нэмэгдүүлж, борлуулалтаа өсгөөрэй</p>
      </div>

      {requested && (
        <div id="plan-upgrade-help" role="status" className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 p-5 mb-6 text-sm text-[var(--esl-text-primary)]">
          <p className="font-bold mb-1">
            {PLANS.find((p) => p.id === requested)?.name} багц идэвхжүүлэх
            ({formatPrice(yearly ? PLANS.find((p) => p.id === requested)?.yearlyPrice ?? 0 : PLANS.find((p) => p.id === requested)?.price ?? 0)}{yearly ? '/жил' : '/сар'})
          </p>
          <p className="text-[var(--esl-text-secondary)]">
            Төлбөрийг eseller.mn-ийн дансанд шилжүүлж, гүйлгээний утга дээр дэлгүүрийнхээ нэрийг бичнэ үү.
            Төлбөр баталгаажмагц багц тань энэ дэлгүүр дээр идэвхжиж, хязгаар (бараа, ажилтан, нэмэлт дэлгүүр) шууд нэмэгдэнэ.
            Асуулт байвал самбарын чатаар эсвэл <a href="mailto:info@eseller.mn" className="text-[#E8242C]">info@eseller.mn</a>-ээр холбогдоно уу.
          </p>
        </div>
      )}

      {/* Current Plan Info */}
      <div className="rounded-xl border border-[var(--esl-border)] p-6 mb-6" style={{ backgroundColor: 'var(--esl-bg-card)' }}>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: plan.color }}
            >
              {plan.nameEn[0]}
            </div>
            <div>
              <h2 className="font-bold text-[var(--esl-text-primary)]">{plan.name} багц</h2>
              <p className="text-sm text-[var(--esl-text-secondary)]">{plan.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(232,36,44,0.1)', color: '#E8242C' }}>
              {remaining} хоног үлдсэн
            </span>
            {plan.id !== 'free' && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
                Идэвхтэй
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <UsageBar label="Бараа" percent={usageProducts} color="#6366F1" />
          <UsageBar label="Ажилтан" percent={usageStaff} color="#8B5CF6" />
          <UsageBar label="Хадгалах зай" percent={usageStorage} color="#06B6D4" />
          <UsageBar label="AI кредит" percent={usageAI} color="#EC4899" />
        </div>
      </div>

      {/* Monthly / Yearly Toggle */}
      <div className="flex justify-center mb-6">
        <div className="rounded-xl border border-[var(--esl-border)] p-1 flex" style={{ backgroundColor: 'var(--esl-bg-card)' }}>
          <button
            onClick={() => setYearly(false)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              !yearly ? 'bg-indigo-600 text-white' : 'text-[var(--esl-text-secondary)] hover:text-[var(--esl-text-primary)]'
            }`}
          >
            Сарын
          </button>
          <button
            onClick={() => setYearly(true)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
              yearly ? 'bg-indigo-600 text-white' : 'text-[var(--esl-text-secondary)] hover:text-[var(--esl-text-primary)]'
            }`}
          >
            Жилийн
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>
              -17%
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 max-w-7xl mx-auto mb-10">
        {PLANS.map((p) => {
          const isCurrent = p.id === currentPlanId;
          const isAIPro = p.id === 'ai_pro';
          const price = yearly ? p.yearlyPrice : p.price;

          return (
            <div
              key={p.id}
              className={`relative rounded-2xl overflow-hidden transition-all ${
                isCurrent
                  ? 'border-2 border-green-400 shadow-md'
                  : isAIPro
                  ? 'border-2 shadow-lg'
                  : p.id === 'standard'
                  ? 'border-2 shadow-md'
                  : p.id === 'ultimate'
                  ? 'border-2 shadow-md'
                  : 'border-2 border-[var(--esl-border)]'
              }`}
              style={{
                backgroundColor: isAIPro
                  ? 'rgba(232,36,44,0.05)'
                  : p.id === 'standard'
                  ? 'rgba(59,130,246,0.05)'
                  : p.id === 'ultimate'
                  ? 'rgba(245,158,11,0.05)'
                  : 'var(--esl-bg-card)',
                borderColor: isCurrent
                  ? undefined
                  : isAIPro
                  ? '#E8242C'
                  : p.id === 'standard'
                  ? '#3B82F6'
                  : p.id === 'ultimate'
                  ? '#F59E0B'
                  : undefined,
              }}
            >
              {/* Badge */}
              {p.badge && (
                <div
                  className="absolute top-0 right-0 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg"
                  style={{ backgroundColor: p.color }}
                >
                  {p.badge}
                </div>
              )}
              {isCurrent && (
                <div className="absolute top-0 left-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-br-lg">
                  Одоогийн багц
                </div>
              )}

              <div className="p-6 pt-8">
                {/* Name */}
                <div className="text-center mb-5">
                  <div
                    className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.id === 'free' ? '🆓' : p.id === 'standard' ? '⭐' : p.id === 'ultimate' ? '💎' : '🤖'}
                  </div>
                  <h3 className="text-lg font-bold text-[var(--esl-text-primary)]">{p.name}</h3>
                  <p className="text-xs text-[var(--esl-text-secondary)] mt-1">{p.description}</p>
                  <div className="mt-3">
                    {price === 0 ? (
                      <span className="text-3xl font-black text-[var(--esl-text-primary)]">Үнэгүй</span>
                    ) : (
                      <div>
                        <span className="text-3xl font-black text-[var(--esl-text-primary)]">{formatPrice(price)}</span>
                        <span className="text-[var(--esl-text-secondary)] text-sm">{yearly ? '/жил' : '/сар'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--esl-text-primary)]">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">&#10003;</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* Button */}
                <button
                  onClick={() => handleSelect(p.id)}
                  disabled={isCurrent}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                    isCurrent
                      ? 'bg-[var(--esl-bg-section)] text-[var(--esl-text-muted)] cursor-default'
                      : isAIPro
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 shadow-md'
                      : p.id === 'standard'
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : p.id === 'ultimate'
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-[var(--esl-text-primary)] text-[var(--esl-bg-card)] hover:opacity-80'
                  }`}
                >
                  {isCurrent ? 'Одоогийн багц' : 'Сонгох'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Table */}
      <div className="rounded-xl border border-[var(--esl-border)] overflow-hidden max-w-7xl mx-auto" style={{ backgroundColor: 'var(--esl-bg-card)' }}>
        <div className="p-6 border-b border-[var(--esl-border)]">
          <h2 className="text-lg font-bold text-[var(--esl-text-primary)]">Багцуудын харьцуулалт</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--esl-border)]">
                <th className="text-left p-4 font-semibold text-[var(--esl-text-secondary)]">Боломж</th>
                {PLANS.map((p) => (
                  <th key={p.id} className="p-4 text-center font-semibold" style={{ color: p.color }}>
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Бараа', key: 'maxProducts' as const },
                { label: 'Ажилтан', key: 'maxStaff' as const },
                { label: 'Салбар', key: 'maxBranches' as const },
                { label: 'Ангилал', key: 'maxCategories' as const },
                { label: 'Брэнд', key: 'maxBrands' as const },
                { label: 'Хадгалах зай (MB)', key: 'maxStorage' as const },
                { label: 'AI кредит', key: 'aiCredits' as const },
                { label: 'Блог нийтлэл', key: 'blogPosts' as const },
                { label: 'Промо код', key: 'promoCodesLimit' as const },
              ].map((row, i) => (
                <tr key={row.key} className={i % 2 === 0 ? 'bg-[var(--esl-bg-section)]' : ''}>
                  <td className="p-4 text-[var(--esl-text-primary)] font-medium">{row.label}</td>
                  {PLANS.map((p) => {
                    const val = p.limits[row.key];
                    return (
                      <td key={p.id} className="p-4 text-center text-[var(--esl-text-primary)]">
                        {val === -1 ? (
                          <span className="text-green-600 font-semibold">Хязгааргүй</span>
                        ) : (
                          <span>{typeof val === 'number' ? val.toLocaleString() : val ? '✓' : '—'}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {[
                { label: 'Хувийн домайн', key: 'customDomain' as const },
                { label: 'Лого арилгах', key: 'removeBranding' as const },
                { label: 'Аналитик', key: 'analytics' as const },
                { label: 'Тэргүүлэх дэмжлэг', key: 'prioritySupport' as const },
                { label: 'Бэлгийн карт', key: 'giftCards' as const },
                { label: 'Олон хэл', key: 'multiLanguage' as const },
                { label: 'API хандалт', key: 'apiAccess' as const },
                { label: 'Дата экспорт', key: 'exportData' as const },
                { label: 'SEO хэрэгсэл', key: 'seoTools' as const },
              ].map((row, i) => (
                <tr key={row.key} className={i % 2 === 0 ? '' : 'bg-[var(--esl-bg-section)]'}>
                  <td className="p-4 text-[var(--esl-text-primary)] font-medium">{row.label}</td>
                  {PLANS.map((p) => (
                    <td key={p.id} className="p-4 text-center">
                      {p.limits[row.key] ? (
                        <span className="text-green-500 text-lg">&#10003;</span>
                      ) : (
                        <span className="text-[var(--esl-text-muted)] text-lg">&#10007;</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto mt-10 rounded-xl border border-[var(--esl-border)] p-6" style={{ backgroundColor: 'var(--esl-bg-card)' }}>
        <h2 className="text-lg font-bold text-[var(--esl-text-primary)] mb-4">Түгээмэл асуултууд</h2>
        <div className="space-y-4">
          {[
            ['Багц хэзээ идэвхждэг вэ?', 'Төлбөр баталгаажмагц шууд идэвхжинэ.'],
            ['Буцаан олголт авч болох уу?', 'Тийм, 7 хоногийн дотор бүрэн буцаан олголт авна.'],
            ['Багцаа хэзээ ч өөрчилж болох уу?', 'Тийм, хүссэн үедээ дээшлүүлэх эсвэл бууруулах боломжтой.'],
            ['AI кредит дуусвал яах вэ?', 'Дараа сард автоматаар шинэчлэгдэнэ, эсвэл дээд багц руу шилжиж болно.'],
          ].map(([q, a], i) => (
            <div key={i} className="border-b border-[var(--esl-border)] pb-3 last:border-0">
              <p className="text-sm font-semibold text-[var(--esl-text-primary)]">{q}</p>
              <p className="text-sm text-[var(--esl-text-secondary)] mt-1">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
