'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Star, Loader2 } from 'lucide-react';
import { useToast } from '@/components/shared/Toast';
import {
  DashboardPage,
  DashboardHeader,
  DashboardEmpty,
  DashboardSecondaryButton,
} from '@/components/dashboard/DashboardShell';

interface Address {
  id?: string;
  label: string;
  address: string;
  phone: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const toast = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Address>({ label: 'Гэр', address: '', phone: '', isDefault: false });

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/user/addresses', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(d => setAddresses(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveAddresses(newList: Address[]) {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ addresses: newList }),
      });
      setAddresses(newList);
      toast.show('Хадгалагдлаа');
    } catch {
      toast.show('Алдаа гарлаа', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleAdd() {
    if (!form.address.trim()) { toast.show('Хаяг оруулна уу', 'warn'); return; }
    const newAddr = { ...form, id: Date.now().toString() };
    const updated = form.isDefault
      ? [...addresses.map(a => ({ ...a, isDefault: false })), newAddr]
      : [...addresses, newAddr];
    saveAddresses(updated);
    setForm({ label: 'Гэр', address: '', phone: '', isDefault: false });
    setShowForm(false);
  }

  function handleRemove(idx: number) {
    saveAddresses(addresses.filter((_, i) => i !== idx));
  }

  function handleSetDefault(idx: number) {
    saveAddresses(addresses.map((a, i) => ({ ...a, isDefault: i === idx })));
  }

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
    <DashboardPage>
      <DashboardHeader
        badge="Худалдан авагч"
        title="Хаягийн жагсаалт"
        subtitle={`${addresses.length} хаяг · хүргэлтэнд ашиглана`}
        actions={
          <>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-xl border-none bg-[#E8242C] px-4 text-sm font-bold text-white"
            >
              <Plus size={16} /> Хаяг нэмэх
            </button>
            <DashboardSecondaryButton href="/dashboard">Самбар</DashboardSecondaryButton>
          </>
        }
      />

      {/* Add form */}
      {showForm && (
        <div className="mb-6 p-5 rounded-2xl" style={{ background: 'var(--esl-bg-card)', border: '1px solid var(--esl-border)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--esl-text-muted)' }}>Нэр</label>
              <select
                value={form.label}
                onChange={e => setForm({ ...form, label: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--esl-bg-page)', border: '1px solid var(--esl-border)', color: 'var(--esl-text-primary)' }}
              >
                <option value="Гэр">🏠 Гэр</option>
                <option value="Ажил">🏢 Ажил</option>
                <option value="Бусад">📍 Бусад</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--esl-text-muted)' }}>Утас</label>
              <input
                type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="99001122"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--esl-bg-page)', border: '1px solid var(--esl-border)', color: 'var(--esl-text-primary)' }}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--esl-text-muted)' }}>Хаяг</label>
            <textarea
              value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
              placeholder="Дүүрэг, хороо, гудамж, байрны дугаар..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm resize-none"
              style={{ background: 'var(--esl-bg-page)', border: '1px solid var(--esl-border)', color: 'var(--esl-text-primary)' }}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--esl-text-muted)' }}>
              <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} />
              Үндсэн хаяг болгох
            </label>
            <button onClick={handleAdd} disabled={saving} className="px-5 py-2 rounded-xl text-sm font-semibold text-white border-none cursor-pointer" style={{ background: '#E8242C' }}>
              {saving ? 'Хадгалж байна...' : 'Нэмэх'}
            </button>
          </div>
        </div>
      )}

      {addresses.length === 0 ? (
        <DashboardEmpty
          icon={MapPin}
          title="Хаяг байхгүй байна"
          description="Хүргэлтийн хаяг нэмж захиалгаа хурдан хүргүүлээрэй."
          action={
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-xl border-none bg-[#E8242C] px-4 text-sm font-bold text-white"
            >
              <Plus size={16} /> Хаяг нэмэх
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {addresses.map((a, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-xl" style={{ background: 'var(--esl-bg-card)', border: a.isDefault ? '2px solid #E8242C' : '1px solid var(--esl-border)' }}>
              <MapPin size={20} style={{ color: a.isDefault ? '#E8242C' : 'var(--esl-text-muted)', flexShrink: 0, marginTop: 2 }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold" style={{ color: 'var(--esl-text-primary)' }}>{a.label}</span>
                  {a.isDefault && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Үндсэн</span>}
                </div>
                <p className="text-sm" style={{ color: 'var(--esl-text-muted)' }}>{a.address}</p>
                {a.phone && <p className="text-xs mt-1" style={{ color: 'var(--esl-text-muted)' }}>📞 {a.phone}</p>}
              </div>
              <div className="flex gap-1">
                {!a.isDefault && (
                  <button onClick={() => handleSetDefault(i)} title="Үндсэн болгох" className="w-8 h-8 rounded-lg flex items-center justify-center border-none cursor-pointer" style={{ background: 'var(--esl-bg-section)', color: 'var(--esl-text-muted)' }}>
                    <Star size={14} />
                  </button>
                )}
                <button onClick={() => handleRemove(i)} title="Устгах" className="w-8 h-8 rounded-lg flex items-center justify-center border-none cursor-pointer" style={{ background: 'var(--esl-bg-section)', color: '#E8242C' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardPage>
  );
}
