'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/utils';
import { useToast } from '@/components/shared/Toast';
import StatCard from '@/components/dashboard/StatCard';
import { Gift, CheckCircle, Wallet, BarChart3 } from 'lucide-react';

interface GiftCard {
  id: string;
  code: string;
  amount: number;
  status: 'active' | 'used' | 'expired';
  createdAt: string;
  usedAt?: string;
  usedBy?: string;
  expiresAt: string;
}

const STATUS_STYLES: Record<string, [string, string]> = {
  active: ['bg-green-100 text-green-700', 'Идэвхтэй'],
  used: ['bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)]', 'Хэрэглэсэн'],
  expired: ['bg-red-100 text-red-600', 'Дууссан'],
};


function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `GIFT-${seg()}-${seg()}`;
}

export default function GiftCardsPage() {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ amount: '50000', code: generateCode(), expiresAt: '' });
  const toast = useToast();

  function handleCreate() {
    if (!form.amount || Number(form.amount) <= 0) {
      toast.show('Зөв дүн оруулна уу', 'warn');
      return;
    }
    if (!form.expiresAt) {
      toast.show('Дуусах огноо оруулна уу', 'warn');
      return;
    }
    const newCard: GiftCard = {
      id: Date.now().toString(),
      code: form.code,
      amount: Number(form.amount),
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: form.expiresAt,
    };
    setCards((prev) => [newCard, ...prev]);
    setForm({ amount: '50000', code: generateCode(), expiresAt: '' });
    setShowModal(false);
    toast.show('Бэлгийн карт үүсгэлээ', 'ok');
  }

  function deleteCard(id: string) {
    if (!confirm('Устгахдаа итгэлтэй байна уу?')) return;
    setCards((prev) => prev.filter((c) => c.id !== id));
    toast.show('Бэлгийн карт устгагдлаа', 'ok');
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      toast.show('Код хуулагдлаа', 'ok');
    });
  }

  const activeValue = cards.filter((c) => c.status === 'active').reduce((s, c) => s + c.amount, 0);
  const usedValue = cards.filter((c) => c.status === 'used').reduce((s, c) => s + c.amount, 0);

  return (
    <div className="min-h-screen bg-[var(--esl-bg-section)] p-6">
      <div role="status" className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-300">
        Бэлгийн карт хараахан сервертэй холбогдоогүй — энд үүсгэсэн карт хадгалагдахгүй, худалдан авагчид ашиглах боломжгүй. Удахгүй идэвхжинэ.
      </div>
      <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--esl-text-primary)]">Бэлгийн карт</h1>
          <p className="text-[var(--esl-text-secondary)] mt-1">Бэлгийн карт үүсгэх, удирдах</p>
        </div>
        <button onClick={() => { setForm({ ...form, code: generateCode() }); setShowModal(true); }} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm">
          + Шинэ бэлгийн карт
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Gift className="w-6 h-6" />} label="Нийт карт" value={cards.length} gradient="indigo" />
        <StatCard icon={<CheckCircle className="w-6 h-6" />} label="Идэвхтэй" value={cards.filter((c) => c.status === 'active').length} gradient="green" />
        <StatCard icon={<Wallet className="w-6 h-6" />} label="Идэвхтэй үнэ цэнэ" value={formatPrice(activeValue)} gradient="amber" />
        <StatCard icon={<BarChart3 className="w-6 h-6" />} label="Хэрэглэсэн" value={formatPrice(usedValue)} gradient="pink" />
      </div>

      {cards.length === 0 ? (
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-12 text-center">
          <div className="text-4xl mb-3"><Gift className="w-10 h-10 mx-auto text-[var(--esl-text-muted)]" /></div>
          <h3 className="text-lg font-semibold text-[var(--esl-text-primary)]">Бэлгийн карт байхгүй</h3>
          <p className="text-[var(--esl-text-muted)] mt-1">Шинэ бэлгийн карт үүсгээрэй</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => {
            const [cls, label] = STATUS_STYLES[card.status];
            return (
              <div key={card.id} className={`bg-white rounded-xl border border-[var(--esl-border)] overflow-hidden ${card.status !== 'active' ? 'opacity-70' : ''}`}>
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-5 text-white">
                  <div className="flex justify-between items-start">
                    <Gift className="w-6 h-6" />
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${card.status === 'active' ? 'bg-white/20 text-white' : 'bg-black/10 text-white/70'}`}>
                      {label}
                    </span>
                  </div>
                  <p className="text-2xl font-black mt-3">{formatPrice(card.amount)}</p>
                  <p className="text-sm font-mono mt-1 text-white/80">{card.code}</p>
                </div>
                <div className="p-4">
                  <div className="flex justify-between text-xs text-[var(--esl-text-secondary)] mb-3">
                    <span>Үүсгэсэн: {new Date(card.createdAt).toLocaleDateString('mn-MN')}</span>
                    <span>Дуусах: {new Date(card.expiresAt).toLocaleDateString('mn-MN')}</span>
                  </div>
                  {card.usedBy && (
                    <p className="text-xs text-[var(--esl-text-muted)] mb-2">Хэрэглэсэн: {card.usedBy}</p>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => copyCode(card.code)} className="flex-1 px-3 py-1.5 text-xs font-medium bg-[var(--esl-bg-section)] text-[var(--esl-text-primary)] rounded-lg hover:bg-[var(--esl-bg-card-hover)] transition-colors">
                      Код хуулах
                    </button>
                    <button onClick={() => deleteCard(card.id)} className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                      Устгах
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[var(--esl-bg-card)] rounded-2xl max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[var(--esl-border)] flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--esl-text-primary)]">Шинэ бэлгийн карт</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--esl-text-muted)] hover:text-[var(--esl-text-secondary)] text-xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Код</label>
                <div className="flex gap-2">
                  <input readOnly value={form.code} className="flex-1 px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] bg-[var(--esl-bg-section)] font-mono" />
                  <button onClick={() => setForm({ ...form, code: generateCode() })} className="px-3 py-2 bg-[var(--esl-bg-section)] text-[var(--esl-text-primary)] rounded-lg text-sm hover:bg-[var(--esl-bg-card-hover)] transition-colors">
                    Шинэ
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Дүн (₮)</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <div className="flex gap-2 mt-2">
                  {[10000, 25000, 50000, 100000].map((v) => (
                    <button key={v} onClick={() => setForm({ ...form, amount: String(v) })} className="px-3 py-1 text-xs bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)] rounded-lg hover:bg-[var(--esl-bg-card-hover)] transition-colors">
                      {formatPrice(v)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Дуусах огноо</label>
                <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
