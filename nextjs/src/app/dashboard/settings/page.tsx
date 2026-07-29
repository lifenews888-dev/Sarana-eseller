'use client';

import { useState, useEffect } from 'react';
import { User, Phone, Save, Lock, Loader2 } from 'lucide-react';
import {
  DashboardPage,
  DashboardHeader,
  DashboardPanel,
  DashboardSecondaryButton,
} from '@/components/dashboard/DashboardShell';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function SettingsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  useEffect(() => {
    fetch(`${API}/api/user/settings`, { headers: headers() })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setName(res.data.name || '');
          setEmail(res.data.email || '');
          setPhone(res.data.phone || '');
        }
      })
      .catch(() => showToast('Мэдээлэл ачаалахад алдаа гарлаа'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/user/settings`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (data.success || res.ok) showToast('Амжилттай хадгаллаа ✓');
      else showToast(data.message || 'Алдаа гарлаа');
    } catch {
      showToast('Алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardPage>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#E8242C]" />
        </div>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage className="max-w-2xl">
      <DashboardHeader
        badge="Миний данс"
        title="Тохиргоо"
        subtitle="Профайл, холбоо барих мэдээлэл"
        actions={<DashboardSecondaryButton href="/dashboard">Самбар</DashboardSecondaryButton>}
      />

      <DashboardPanel
        title="Профайл мэдээлэл"
        action={<User className="h-4 w-4 text-[#E8242C]" />}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[var(--esl-text-muted)]">
              Нэр
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-section)] px-4 py-3 text-sm text-[var(--esl-text-primary)] outline-none focus:border-[#E8242C]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[var(--esl-text-muted)]">
              Имэйл
            </label>
            <input
              value={email}
              readOnly
              className="w-full cursor-not-allowed rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-section)] px-4 py-3 text-sm text-[var(--esl-text-muted)] outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[var(--esl-text-muted)]">
              <Phone className="h-3 w-3" /> Утас
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+976 9900 0000"
              className="w-full rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-section)] px-4 py-3 text-sm text-[var(--esl-text-primary)] outline-none focus:border-[#E8242C]"
            />
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-[#E8242C] py-3 text-sm font-bold text-white transition hover:bg-[#C41E25] disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Хадгалж байна...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Хадгалах
              </>
            )}
          </button>
        </div>
      </DashboardPanel>

      <div className="mt-4 sm:mt-5">
        <DashboardPanel title="Аюулгүй байдал">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)]">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--esl-text-primary)]">Нууц үг / нэвтрэлт</p>
              <p className="mt-0.5 text-xs text-[var(--esl-text-muted)]">
                Нууц үг солих, 2FA зэрэг нэмэлт тохиргоо удахгүй нэмэгдэнэ.
              </p>
            </div>
          </div>
        </DashboardPanel>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-5 py-3 text-sm font-medium text-[var(--esl-text-primary)] shadow-lg">
          {toast}
        </div>
      )}
    </DashboardPage>
  );
}
