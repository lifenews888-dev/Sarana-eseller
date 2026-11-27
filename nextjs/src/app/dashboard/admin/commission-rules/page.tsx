'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';

interface Settings {
  platformFee: number;
  storeMinCommission: number;
  storeMaxCommission: number;
  listingMinCommission: number;
  listingMaxCommission: number;
  partnerPlatformFee: number;
  partnerAgentMin: number;
  partnerAgentMax: number;
  vatThreshold: number;
  vatWarningThreshold: number;
  vatRate: number;
  cityTaxRate: number;
  incomeTaxRate: number;
}

const DEFAULTS: Settings = {
  platformFee: 2,
  storeMinCommission: 5,
  storeMaxCommission: 30,
  listingMinCommission: 0,
  listingMaxCommission: 15,
  partnerPlatformFee: 2,
  partnerAgentMin: 1,
  partnerAgentMax: 5,
  vatThreshold: 50000000,
  vatWarningThreshold: 40000000,
  vatRate: 10,
  cityTaxRate: 2,
  incomeTaxRate: 10,
};

function SliderField({ label, value, onChange, min, max, step = 0.5, suffix = '%' }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step?: number; suffix?: string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-sm text-[var(--esl-text-secondary)]">{label}</label>
        <span className="text-sm font-medium text-[var(--esl-text)]">{value.toLocaleString()}{suffix}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full h-2 bg-[var(--esl-bg-elevated)] rounded-lg appearance-none cursor-pointer accent-[#E8242C]"
      />
      <div className="flex justify-between text-xs text-[var(--esl-text-disabled)]">
        <span>{min.toLocaleString()}{suffix}</span>
        <span>{max.toLocaleString()}{suffix}</span>
      </div>
    </div>
  );
}

export default function CommissionRulesPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/system-settings', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setSettings({ ...DEFAULTS, ...data });
    } catch { /* use defaults */ }
    setLoading(false);
  };

  useEffect(() => {
    const deferred = window.setTimeout(() => { fetchSettings(); }, 0);
    return () => window.clearTimeout(deferred);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/admin/system-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const update = (key: keyof Settings, val: number) => setSettings((s) => ({ ...s, [key]: val }));

  if (loading) {
    return <div className="p-8 text-center text-[var(--esl-text-secondary)]">Ачааллаж байна...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--esl-text)]">Commission дүрэм</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setSettings(DEFAULTS)}
            className="flex items-center gap-1 px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text)]"
          >
            <RefreshCw size={14} /> Анхдагч
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1 px-4 py-2 bg-[#E8242C] text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
          >
            <Save size={14} /> {saved ? 'Хадгалсан!' : saving ? 'Хадгалж байна...' : 'Хадгалах'}
          </button>
        </div>
      </div>

      {/* Platform Fee */}
      <section className="bg-[var(--esl-bg-section)] rounded-xl p-5 border border-[var(--esl-border)] space-y-4">
        <h2 className="font-semibold text-[var(--esl-text)]">Платформ шимтгэл</h2>
        <SliderField label="Платформ fee" value={settings.platformFee} onChange={(v) => update('platformFee', v)} min={1} max={5} />
      </section>

      {/* Store Affiliate */}
      <section className="bg-[var(--esl-bg-section)] rounded-xl p-5 border border-[var(--esl-border)] space-y-4">
        <h2 className="font-semibold text-[var(--esl-text)]">Дэлгүүрийн affiliate commission</h2>
        <p className="text-xs text-[var(--esl-text-secondary)]">Дэлгүүрийн эзэн борлуулагчдад өгөх commission-ны хүрээ</p>
        <div className="grid grid-cols-2 gap-4">
          <SliderField label="Доод хязгаар" value={settings.storeMinCommission} onChange={(v) => update('storeMinCommission', v)} min={0} max={20} />
          <SliderField label="Дээд хязгаар" value={settings.storeMaxCommission} onChange={(v) => update('storeMaxCommission', v)} min={10} max={50} />
        </div>
      </section>

      {/* Listing Affiliate */}
      <section className="bg-[var(--esl-bg-section)] rounded-xl p-5 border border-[var(--esl-border)] space-y-4">
        <h2 className="font-semibold text-[var(--esl-text)]">Зарын affiliate commission</h2>
        <p className="text-xs text-[var(--esl-text-secondary)]">Зарын эзэн борлуулагчдад өгөх commission-ны хүрээ</p>
        <div className="grid grid-cols-2 gap-4">
          <SliderField label="Доод хязгаар" value={settings.listingMinCommission} onChange={(v) => update('listingMinCommission', v)} min={0} max={10} />
          <SliderField label="Дээд хязгаар" value={settings.listingMaxCommission} onChange={(v) => update('listingMaxCommission', v)} min={5} max={30} />
        </div>
      </section>

      {/* Partner */}
      <section className="bg-[var(--esl-bg-section)] rounded-xl p-5 border border-[var(--esl-border)] space-y-4">
        <h2 className="font-semibold text-[var(--esl-text)]">Гэрээт байгууллага commission</h2>
        <SliderField label="Платформ fee" value={settings.partnerPlatformFee} onChange={(v) => update('partnerPlatformFee', v)} min={1} max={5} />
        <div className="grid grid-cols-2 gap-4">
          <SliderField label="Агент доод" value={settings.partnerAgentMin} onChange={(v) => update('partnerAgentMin', v)} min={0} max={5} />
          <SliderField label="Агент дээд" value={settings.partnerAgentMax} onChange={(v) => update('partnerAgentMax', v)} min={2} max={10} />
        </div>
      </section>

      {/* VAT Settings */}
      <section className="bg-[var(--esl-bg-section)] rounded-xl p-5 border border-[var(--esl-border)] space-y-4">
        <h2 className="font-semibold text-[var(--esl-text)]">Татварын тохиргоо</h2>
        <div className="grid grid-cols-2 gap-4">
          <SliderField label="НӨАТ босго" value={settings.vatThreshold} onChange={(v) => update('vatThreshold', v)} min={10000000} max={100000000} step={5000000} suffix="₮" />
          <SliderField label="Сануулгын босго" value={settings.vatWarningThreshold} onChange={(v) => update('vatWarningThreshold', v)} min={10000000} max={100000000} step={5000000} suffix="₮" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <SliderField label="НӨАТ хувь" value={settings.vatRate} onChange={(v) => update('vatRate', v)} min={0} max={20} step={1} />
          <SliderField label="Хотын татвар" value={settings.cityTaxRate} onChange={(v) => update('cityTaxRate', v)} min={0} max={5} step={0.5} />
          <SliderField label="ХХОАТ хувь" value={settings.incomeTaxRate} onChange={(v) => update('incomeTaxRate', v)} min={0} max={20} step={1} />
        </div>
      </section>

      {/* Preview */}
      <section className="bg-[var(--esl-bg-section)] rounded-xl p-5 border border-[var(--esl-border)]">
        <h2 className="font-semibold text-[var(--esl-text)] mb-3">Жишиг тооцоо — 1,000,000₮ борлуулалт</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <p className="font-medium text-[var(--esl-text)]">Дэлгүүр (10% affiliate)</p>
            <p className="text-[var(--esl-text-secondary)]">Платформ: {(10000 * settings.platformFee).toLocaleString()}₮</p>
            <p className="text-[var(--esl-text-secondary)]">Борлуулагч: 100,000₮</p>
            <p className="text-[var(--esl-text-secondary)]">ХХОАТ: 10,000₮</p>
            <p className="text-green-600 font-medium">Эзэнд: {(1000000 - 10000 * settings.platformFee - 100000).toLocaleString()}₮</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-[var(--esl-text)]">Зарын эзэн (5% affiliate)</p>
            <p className="text-[var(--esl-text-secondary)]">Платформ: {(10000 * settings.platformFee).toLocaleString()}₮</p>
            <p className="text-[var(--esl-text-secondary)]">Борлуулагч: 50,000₮</p>
            <p className="text-green-600 font-medium">Эзэнд: {(1000000 - 10000 * settings.platformFee - 50000).toLocaleString()}₮</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-[var(--esl-text)]">Гэрээт (3% агент)</p>
            <p className="text-[var(--esl-text-secondary)]">Платформ: {(10000 * settings.partnerPlatformFee).toLocaleString()}₮</p>
            <p className="text-[var(--esl-text-secondary)]">Агент: 30,000₮</p>
            <p className="text-green-600 font-medium">Компани: {(1000000 - 10000 * settings.partnerPlatformFee - 30000).toLocaleString()}₮</p>
          </div>
        </div>
      </section>
    </div>
  );
}
