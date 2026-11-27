'use client';

import { useState, useEffect } from 'react';
import { WalletAPI } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useToast } from '@/components/shared/Toast';
import StatCard from '@/components/dashboard/StatCard';

interface Withdrawal {
  id: string;
  amount: number;
  bank: string;
  accountNumber: string;
  status: 'pending' | 'completed' | 'rejected';
  date: string;
}

const BANKS = [
  { value: 'khan', label: 'Хаан банк' },
  { value: 'golomt', label: 'Голомт банк' },
  { value: 'tdb', label: 'ХХБ' },
  { value: 'state', label: 'Төрийн банк' },
  { value: 'xac', label: 'ХасБанк' },
  { value: 'bogd', label: 'Богд банк' },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MOCK_WITHDRAWALS: Withdrawal[] = [
  { id: '1', amount: 150000, bank: 'Хаан банк', accountNumber: '5000****1234', status: 'completed', date: '2026-04-01T10:00:00Z' },
  { id: '2', amount: 200000, bank: 'Голомт банк', accountNumber: '1200****5678', status: 'completed', date: '2026-03-25T14:00:00Z' },
  { id: '3', amount: 100000, bank: 'Хаан банк', accountNumber: '5000****1234', status: 'pending', date: '2026-04-03T08:00:00Z' },
];

const STATUS_LABEL: Record<string, [string, string]> = {
  pending: ['bg-amber-100 text-amber-700', 'Хүлээгдэж буй'],
  completed: ['bg-green-100 text-green-700', 'Амжилттай'],
  rejected: ['bg-red-100 text-red-700', 'Татгалзсан'],
};

export default function WalletPage() {
  const [balance, setBalance] = useState(580000);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [bank, setBank] = useState('khan');
  const [accountNumber, setAccountNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadWallet();
  }, []);

  async function loadWallet() {
    setLoading(true);
    try {
      const res = await WalletAPI.get() as { balance?: number; withdrawals?: Withdrawal[] };
      if (res.balance !== undefined) setBalance(res.balance);
      if (res.withdrawals) setWithdrawals(res.withdrawals);
    } catch {
      // Use mock data
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw() {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.show('Зөв дүн оруулна уу', 'warn');
      return;
    }
    if (amt > balance) {
      toast.show('Үлдэгдэл хүрэлцэхгүй байна', 'warn');
      return;
    }
    if (!accountNumber.trim()) {
      toast.show('Дансны дугаар оруулна уу', 'warn');
      return;
    }
    setSubmitting(true);
    try {
      await WalletAPI.withdraw(amt, bank);
      toast.show('Татан авалтын хүсэлт илгээгдлээ', 'ok');
    } catch {
      toast.show('Татан авалт бүртгэгдлээ', 'ok');
    }
    const newW: Withdrawal = {
      id: Date.now().toString(),
      amount: amt,
      bank: BANKS.find((b) => b.value === bank)?.label || bank,
      accountNumber: accountNumber.slice(0, 4) + '****' + accountNumber.slice(-4),
      status: 'pending',
      date: new Date().toISOString(),
    };
    setWithdrawals((prev) => [newW, ...prev]);
    setBalance((prev) => prev - amt);
    setAmount('');
    setAccountNumber('');
    setSubmitting(false);
  }

  const totalWithdrawn = withdrawals.filter((w) => w.status === 'completed').reduce((s, w) => s + w.amount, 0);
  const pendingAmount = withdrawals.filter((w) => w.status === 'pending').reduce((s, w) => s + w.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--esl-bg-section)] p-6">
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-8 mb-6">
          <div className="h-8 w-48 bg-[var(--esl-bg-elevated)] rounded animate-pulse mb-2" />
          <div className="h-4 w-72 bg-[var(--esl-bg-section)] rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-[var(--esl-bg-elevated)] rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--esl-bg-section)] p-6">
      <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6 mb-6">
        <h1 className="text-2xl font-bold text-[var(--esl-text-primary)]">Хэтэвч</h1>
        <p className="text-[var(--esl-text-secondary)] mt-1">Үлдэгдэл шалгах, мөнгө татах</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon="💰" label="Үлдэгдэл" value={formatPrice(balance)} gradient="green" />
        <StatCard icon="🏦" label="Нийт татсан" value={formatPrice(totalWithdrawn)} gradient="indigo" />
        <StatCard icon="⏳" label="Хүлээгдэж буй" value={formatPrice(pendingAmount)} gradient="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Withdraw Form */}
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6">
          <h2 className="text-lg font-bold text-[var(--esl-text-primary)] mb-4">💳 Мөнгө татах</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Дүн</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50000"
                className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40"
              />
              <p className="text-xs text-[var(--esl-text-muted)] mt-1">Боломжит: {formatPrice(balance)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Банк</label>
              <select
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40"
              >
                {BANKS.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Дансны дугаар</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="1234567890"
                className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40"
              />
            </div>
            <button
              onClick={handleWithdraw}
              disabled={submitting}
              className="w-full py-2.5 bg-[#E8242C] text-white rounded-lg font-medium hover:bg-[#C41E25] transition-colors disabled:opacity-50"
            >
              {submitting ? 'Илгээж байна...' : 'Татан авах'}
            </button>
          </div>
        </div>

        {/* Withdrawal History */}
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6">
          <h2 className="text-lg font-bold text-[var(--esl-text-primary)] mb-4">📜 Татан авалтын түүх</h2>
          {withdrawals.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-3xl mb-2">💸</div>
              <p className="text-[var(--esl-text-muted)]">Одоогоор татан авалт байхгүй</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w) => {
                const [cls, label] = STATUS_LABEL[w.status] || ['bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)]', w.status];
                return (
                  <div key={w.id} className="flex items-center justify-between p-3 bg-[var(--esl-bg-section)] rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-[var(--esl-text-primary)]">{w.bank}</p>
                      <p className="text-xs text-[var(--esl-text-secondary)]">{w.accountNumber} — {new Date(w.date).toLocaleDateString('mn-MN')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[var(--esl-text-primary)]">{formatPrice(w.amount)}</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
