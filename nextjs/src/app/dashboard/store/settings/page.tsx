'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared/Toast';
import { Store, Phone, MapPin, Users, Percent, Building2, CreditCard, Save, Loader2 } from 'lucide-react';
import { getActiveStoreHeaders } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || '';

const BANKS = [
  { value: 'khan', label: 'Хаан банк' },
  { value: 'golomt', label: 'Голомт банк' },
  { value: 'tdb', label: 'ХХБ' },
  { value: 'state', label: 'Төрийн банк' },
  { value: 'xac', label: 'Хас банк' },
  { value: 'bogd', label: 'Богд банк' },
];

interface Settings {
  name: string;
  phone: string;
  address: string;
  district: string;
  allowSellers: boolean;
  sellerCommission: number;
  bankInfo: { bank: string; accountNumber: string };
}

const EMPTY: Settings = {
  name: '',
  phone: '',
  address: '',
  district: '',
  allowSellers: false,
  sellerCommission: 10,
  bankInfo: { bank: 'khan', accountNumber: '' },
};

function authHeaders() {
  return getActiveStoreHeaders(true);
}

const inputCls =
  'w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] bg-[var(--esl-bg-page)] focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40';

export default function SettingsPage() {
  const [s, setS] = useState<Settings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetch(`${API}/api/store/settings`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          setS({
            name: d.name || '',
            phone: d.phone || '',
            address: d.address || '',
            district: d.district || '',
            allowSellers: !!d.allowSellers,
            sellerCommission: d.sellerCommission ?? 10,
            bankInfo: {
              bank: d.bankInfo?.bank || 'khan',
              accountNumber: d.bankInfo?.accountNumber || '',
            },
          });
        }
      })
      .catch(() => toast.show('Тохиргоо ачаалахад алдаа гарлаа', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!s.name.trim()) {
      toast.show('Дэлгүүрийн нэр заавал бөглөнө үү', 'warn');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/store/settings`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(s),
      });
      const json = await res.json();
      if (json.success) {
        toast.show('Тохиргоо амжилттай хадгалагдлаа', 'ok');
      } else {
        toast.show(json.message || 'Хадгалахад алдаа гарлаа', 'error');
      }
    } catch {
      toast.show('Сервертэй холбогдож чадсангүй', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--esl-bg-page)] p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#E8242C]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--esl-bg-page)] p-6">
      {/* Header */}
      <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6 mb-6">
        <h1 className="text-2xl font-bold text-[var(--esl-text-primary)]">Тохиргоо</h1>
        <p className="text-[var(--esl-text-muted)] mt-1">Дэлгүүрийн ерөнхий тохиргоо</p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Section 1: Store Info */}
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6">
          <h2 className="text-lg font-bold text-[var(--esl-text-primary)] mb-4 flex items-center gap-2">
            <Store className="w-5 h-5 text-[#E8242C]" />
            Дэлгүүрийн мэдээлэл
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Дэлгүүрийн нэр *</label>
              <input value={s.name} onChange={(e) => setS((p) => ({ ...p, name: e.target.value }))} placeholder="Миний дэлгүүр" className={inputCls} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> Утасны дугаар
                </label>
                <input value={s.phone} onChange={(e) => setS((p) => ({ ...p, phone: e.target.value }))} placeholder="99001122" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Дүүрэг
                </label>
                <input value={s.district} onChange={(e) => setS((p) => ({ ...p, district: e.target.value }))} placeholder="СБД" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Хаяг</label>
              <input value={s.address} onChange={(e) => setS((p) => ({ ...p, address: e.target.value }))} placeholder="УБ, СБД, 1-р хороо" className={inputCls} />
            </div>
          </div>
        </div>

        {/* Section 2: Seller Settings */}
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6">
          <h2 className="text-lg font-bold text-[var(--esl-text-primary)] mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#E8242C]" />
            Борлуулагчийн тохиргоо
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--esl-text-primary)]">Борлуулагч зөвшөөрөх</p>
                <p className="text-xs text-[var(--esl-text-muted)]">Бусад хүмүүс таны бүтээгдэхүүнийг борлуулах боломж</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={s.allowSellers}
                onClick={() => setS((p) => ({ ...p, allowSellers: !p.allowSellers }))}
                className="relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer"
                style={{ backgroundColor: s.allowSellers ? '#E8242C' : 'var(--esl-border)' }}
              >
                <span
                  className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform"
                  style={{ transform: s.allowSellers ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </button>
            </div>
            {s.allowSellers && (
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5" /> Борлуулагчийн шимтгэл (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={s.sellerCommission}
                  onChange={(e) => setS((p) => ({ ...p, sellerCommission: Number(e.target.value) }))}
                  className={inputCls}
                />
                <p className="text-xs text-[var(--esl-text-muted)] mt-1">Борлуулагч бүрт олгох шимтгэлийн хувь</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Bank Info */}
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6">
          <h2 className="text-lg font-bold text-[var(--esl-text-primary)] mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#E8242C]" />
            Банкны мэдээлэл
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Банк</label>
              <select
                value={s.bankInfo.bank}
                onChange={(e) => setS((p) => ({ ...p, bankInfo: { ...p.bankInfo, bank: e.target.value } }))}
                className={inputCls}
              >
                {BANKS.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" /> Дансны дугаар
              </label>
              <input
                value={s.bankInfo.accountNumber}
                onChange={(e) => setS((p) => ({ ...p, bankInfo: { ...p.bankInfo, accountNumber: e.target.value } }))}
                placeholder="1234567890"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-[#E8242C] text-white rounded-xl font-semibold hover:bg-[#C41E25] transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Хадгалж байна...' : 'Хадгалах'}
        </button>
      </div>
    </div>
  );
}
