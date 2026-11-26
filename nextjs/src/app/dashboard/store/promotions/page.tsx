'use client';

import { useState } from 'react';
import { useToast } from '@/components/shared/Toast';
import { formatPrice } from '@/lib/utils';
import StatCard from '@/components/dashboard/StatCard';
import { Tag, CheckCircle, BarChart3 } from 'lucide-react';

interface Promotion {
  id: string;
  code: string;
  percentage: number;
  minOrder: number;
  expiryDate: string;
  enabled: boolean;
  usedCount: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const INITIAL_PROMOS: Promotion[] = [
  { id: '1', code: 'WELCOME10', percentage: 10, minOrder: 20000, expiryDate: '2026-05-01', enabled: true, usedCount: 24 },
  { id: '2', code: 'SUMMER20', percentage: 20, minOrder: 50000, expiryDate: '2026-06-30', enabled: true, usedCount: 8 },
  { id: '3', code: 'VIP15', percentage: 15, minOrder: 30000, expiryDate: '2026-04-15', enabled: false, usedCount: 45 },
];

export default function PromotionsPage() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: '', percentage: '10', minOrder: '20000', expiryDate: '' });
  const toast = useToast();

  function handleCreate() {
    if (!form.code || !form.percentage || !form.expiryDate) {
      toast.show('Бүх талбарыг бөглөнө үү', 'warn');
      return;
    }
    const newPromo: Promotion = {
      id: Date.now().toString(),
      code: form.code.toUpperCase(),
      percentage: Number(form.percentage),
      minOrder: Number(form.minOrder),
      expiryDate: form.expiryDate,
      enabled: true,
      usedCount: 0,
    };
    setPromos((prev) => [newPromo, ...prev]);
    setForm({ code: '', percentage: '10', minOrder: '20000', expiryDate: '' });
    setShowModal(false);
    toast.show('Промо код амжилттай үүсгэлээ', 'ok');
  }

  function togglePromo(id: string) {
    setPromos((prev) => prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)));
    toast.show('Промо код шинэчлэгдлээ', 'ok');
  }

  function deletePromo(id: string) {
    if (!confirm('Устгахдаа итгэлтэй байна уу?')) return;
    setPromos((prev) => prev.filter((p) => p.id !== id));
    toast.show('Промо код устгагдлаа', 'ok');
  }

  const activeCount = promos.filter((p) => p.enabled).length;
  const totalUsed = promos.reduce((s, p) => s + p.usedCount, 0);

  return (
    <div className="min-h-screen bg-[var(--esl-bg-section)] p-6">
      <div role="status" className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-300">
        Энэ хуудасны код хараахан хадгалагддаггүй. Ажиллах хямдралын код үүсгэхийн тулд &ldquo;Купон&rdquo; хуудсыг ашиглана уу.
      </div>
      <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--esl-text-primary)]">Урамшуулал</h1>
          <p className="text-[var(--esl-text-secondary)] mt-1">Хямдралын код үүсгэх, удирдах</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm">
          + Шинэ код
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<Tag className="w-6 h-6" />} label="Нийт промо код" value={promos.length} gradient="indigo" />
        <StatCard icon={<CheckCircle className="w-6 h-6" />} label="Идэвхтэй" value={activeCount} gradient="green" />
        <StatCard icon={<BarChart3 className="w-6 h-6" />} label="Нийт хэрэглэсэн" value={totalUsed} gradient="amber" />
      </div>

      {promos.length === 0 ? (
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-12 text-center">
          <div className="text-4xl mb-3">🏷️</div>
          <h3 className="text-lg font-semibold text-[var(--esl-text-primary)]">Промо код байхгүй</h3>
          <p className="text-[var(--esl-text-muted)] mt-1">Шинэ хямдралын код үүсгээрэй</p>
        </div>
      ) : (
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--esl-bg-section)] border-b border-[var(--esl-border)]">
                  <th className="text-left p-4 text-xs font-semibold text-[var(--esl-text-secondary)] uppercase">Код</th>
                  <th className="text-left p-4 text-xs font-semibold text-[var(--esl-text-secondary)] uppercase">Хөнгөлөлт</th>
                  <th className="text-left p-4 text-xs font-semibold text-[var(--esl-text-secondary)] uppercase">Мин. захиалга</th>
                  <th className="text-left p-4 text-xs font-semibold text-[var(--esl-text-secondary)] uppercase">Дуусах огноо</th>
                  <th className="text-left p-4 text-xs font-semibold text-[var(--esl-text-secondary)] uppercase">Хэрэглэсэн</th>
                  <th className="text-left p-4 text-xs font-semibold text-[var(--esl-text-secondary)] uppercase">Төлөв</th>
                  <th className="text-left p-4 text-xs font-semibold text-[var(--esl-text-secondary)] uppercase">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--esl-border)] hover:bg-[var(--esl-bg-section)]">
                    <td className="p-4 font-mono text-sm font-bold text-indigo-600">{p.code}</td>
                    <td className="p-4 text-sm font-semibold text-[var(--esl-text-primary)]">{p.percentage}%</td>
                    <td className="p-4 text-sm text-[var(--esl-text-primary)]">{formatPrice(p.minOrder)}</td>
                    <td className="p-4 text-sm text-[var(--esl-text-secondary)]">{new Date(p.expiryDate).toLocaleDateString('mn-MN')}</td>
                    <td className="p-4 text-sm text-[var(--esl-text-primary)]">{p.usedCount} удаа</td>
                    <td className="p-4">
                      <button
                        onClick={() => togglePromo(p.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${p.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-[var(--esl-bg-card)] transition-transform ${p.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="p-4">
                      <button onClick={() => deletePromo(p.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">
                        Устгах
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[var(--esl-bg-card)] rounded-2xl max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[var(--esl-border)] flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--esl-text-primary)]">Шинэ промо код</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--esl-text-muted)] hover:text-[var(--esl-text-secondary)] text-xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Код</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER20" className="w-full px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Хөнгөлөлт (%)</label>
                <input type="number" value={form.percentage} onChange={(e) => setForm({ ...form, percentage: e.target.value })} className="w-full px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Хамгийн бага захиалга</label>
                <input type="number" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} className="w-full px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Дуусах огноо</label>
                <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="w-full px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button onClick={handleCreate} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                Үүсгэх
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
