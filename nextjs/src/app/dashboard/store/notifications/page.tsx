'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared/Toast';

interface NotificationSetting {
  key: string;
  label: string;
  description: string;
  icon: string;
  email: boolean;
  push: boolean;
}

const DEFAULT_SETTINGS: NotificationSetting[] = [
  { key: 'order_received', label: 'Захиалга ирсэн', description: 'Шинэ захиалга орсон үед мэдэгдэл авах', icon: '🛒', email: true, push: true },
  { key: 'order_shipped', label: 'Захиалга явсан', description: 'Захиалга хүргэлтэд гарсан үед мэдэгдэл авах', icon: '🚚', email: true, push: false },
  { key: 'payment_received', label: 'Төлбөр орсон', description: 'Төлбөр амжилттай орсон үед мэдэгдэл авах', icon: '💰', email: true, push: true },
  { key: 'low_stock', label: 'Нөөц дуусаж байна', description: 'Бүтээгдэхүүний нөөц 5-аас доош болсон үед', icon: '⚠️', email: true, push: false },
  { key: 'new_review', label: 'Шинэ сэтгэгдэл', description: 'Шинэ сэтгэгдэл ирсэн үед мэдэгдэл авах', icon: '⭐', email: false, push: true },
  { key: 'new_customer', label: 'Шинэ харилцагч', description: 'Анх удаа захиалга өгсөн хэрэглэгч', icon: '👤', email: false, push: false },
  { key: 'promo_expired', label: 'Промо дууссан', description: 'Промо кодны хугацаа дуусах үед сануулах', icon: '🏷️', email: true, push: false },
];

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSetting[]>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const deferred = window.setTimeout(() => {
      const saved = localStorage.getItem('eseller_notification_settings');
      if (saved) {
        try {
          setSettings(JSON.parse(saved));
        } catch {
          // ignore
        }
      }
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(deferred);
  }, []);

  function toggle(key: string, type: 'email' | 'push') {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, [type]: !s[type] } : s))
    );
  }

  function handleSave() {
    localStorage.setItem('eseller_notification_settings', JSON.stringify(settings));
    toast.show('Мэдэгдлийн тохиргоо хадгалагдлаа', 'ok');
  }

  function enableAll() {
    setSettings((prev) => prev.map((s) => ({ ...s, email: true, push: true })));
    toast.show('Бүх мэдэгдэл идэвхжлээ', 'ok');
  }

  function disableAll() {
    setSettings((prev) => prev.map((s) => ({ ...s, email: false, push: false })));
    toast.show('Бүх мэдэгдэл идэвхгүй болсон', 'ok');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--esl-bg-section)] p-6">
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-8 mb-6">
          <div className="h-8 w-48 bg-[var(--esl-bg-elevated)] rounded animate-pulse mb-2" />
          <div className="h-4 w-72 bg-[var(--esl-bg-section)] rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--esl-bg-section)] p-6">
      <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6 mb-6">
        <h1 className="text-2xl font-bold text-[var(--esl-text-primary)]">Мэдэгдэл</h1>
        <p className="text-[var(--esl-text-secondary)] mt-1">Имэйл болон push мэдэгдлийн тохиргоо</p>
      </div>

      <div className="max-w-3xl">
        {/* Quick Actions */}
        <div className="flex gap-3 mb-6">
          <button onClick={enableAll} className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors">
            Бүгдийг идэвхжүүлэх
          </button>
          <button onClick={disableAll} className="px-4 py-2 bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)] rounded-lg text-sm font-medium hover:bg-[var(--esl-bg-card-hover)] transition-colors">
            Бүгдийг унтраах
          </button>
        </div>

        {/* Settings Table */}
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] overflow-hidden">
          <div className="grid grid-cols-[1fr,80px,80px] gap-0 border-b border-[var(--esl-border)] bg-[var(--esl-bg-section)] px-5 py-3">
            <div className="text-xs font-semibold text-[var(--esl-text-secondary)] uppercase">Мэдэгдэл</div>
            <div className="text-xs font-semibold text-[var(--esl-text-secondary)] uppercase text-center">Имэйл</div>
            <div className="text-xs font-semibold text-[var(--esl-text-secondary)] uppercase text-center">Push</div>
          </div>
          {settings.map((setting) => (
            <div key={setting.key} className="grid grid-cols-[1fr,80px,80px] gap-0 items-center border-b border-[var(--esl-border)] last:border-0 px-5 py-4 hover:bg-[var(--esl-bg-section)] transition-colors">
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{setting.icon}</span>
                <div>
                  <p className="text-sm font-medium text-[var(--esl-text-primary)]">{setting.label}</p>
                  <p className="text-xs text-[var(--esl-text-muted)]">{setting.description}</p>
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => toggle(setting.key, 'email')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${setting.email ? 'bg-[#E8242C]' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-[var(--esl-bg-card)] transition-transform ${setting.email ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => toggle(setting.key, 'push')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${setting.push ? 'bg-[#E8242C]' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-[var(--esl-bg-card)] transition-transform ${setting.push ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-[#E8242C] text-white rounded-xl font-semibold hover:bg-[#C41E25] transition-colors"
          >
            Хадгалах
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-50 rounded-xl border border-blue-100 p-4">
          <p className="text-sm text-blue-700">
            💡 Push мэдэгдэл авахын тулд хөтчийн мэдэгдэл зөвшөөрөх шаардлагатай. Имэйл мэдэгдэл таны бүртгэлтэй имэйл хаяг руу илгээгдэнэ.
          </p>
        </div>
      </div>
    </div>
  );
}
