'use client';

import { useState, useEffect } from 'react';
import { Building2, Users, CheckCircle, Plus, Search, MoreVertical } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  type: string;
  registrationNo: string | null;
  isActive: boolean;
  isVerified: boolean;
  platformFee: number;
  agentFee: number;
  companyFee: number;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  createdAt: string;
  _count: { agents: number; listings: number; commissions: number };
}

interface Stats {
  total: number;
  active: number;
  verified: number;
  totalAgents: number;
}

const TYPE_LABELS: Record<string, string> = {
  REAL_ESTATE: 'Үл хөдлөх',
  AUTO: 'Авто',
  SERVICE: 'Үйлчилгээ',
  CONSTRUCTION: 'Барилга',
  GENERAL: 'Ерөнхий',
};

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, verified: 0, totalAgents: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'GENERAL', registrationNo: '', contactName: '',
    contactPhone: '', contactEmail: '', platformFee: 2, agentFee: 3, companyFee: 95,
  });

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/partners', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setPartners(data.partners || []);
      setStats(data.stats || { total: 0, active: 0, verified: 0, totalAgents: 0 });
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchPartners(); }, []);

  const handleCreate = async () => {
    const token = localStorage.getItem('token');
    await fetch('/api/admin/partners', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(form),
    });
    setShowModal(false);
    setForm({ name: '', type: 'GENERAL', registrationNo: '', contactName: '', contactPhone: '', contactEmail: '', platformFee: 2, agentFee: 3, companyFee: 95 });
    fetchPartners();
  };

  const filtered = partners.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.contactName || '').toLowerCase().includes(search.toLowerCase())
  );

  const statCards = [
    { label: 'Нийт компани', value: stats.total, icon: Building2, color: '#6366F1' },
    { label: 'Идэвхтэй', value: stats.active, icon: CheckCircle, color: '#10B981' },
    { label: 'Баталгаажсан', value: stats.verified, icon: CheckCircle, color: '#F59E0B' },
    { label: 'Нийт агент', value: stats.totalAgents, icon: Users, color: '#EC4899' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--esl-text)]">Гэрээт байгууллага</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#E8242C] text-white rounded-lg hover:bg-red-700 transition"
        >
          <Plus size={16} /> Шинэ компани
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-[var(--esl-bg-section)] rounded-xl p-4 border border-[var(--esl-border)]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${s.color}20` }}>
                <s.icon size={20} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xs text-[var(--esl-text-secondary)]">{s.label}</p>
                <p className="text-xl font-bold text-[var(--esl-text)]">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--esl-text-disabled)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Компани хайх..."
          className="w-full pl-10 pr-4 py-2 bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text)]"
        />
      </div>

      {/* Table */}
      <div className="bg-[var(--esl-bg-section)] rounded-xl border border-[var(--esl-border)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[var(--esl-text-secondary)]">Ачааллаж байна...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-[var(--esl-text-secondary)]">Компани олдсонгүй</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--esl-border)] text-left text-[var(--esl-text-secondary)]">
                <th className="px-4 py-3">Нэр</th>
                <th className="px-4 py-3">Төрөл</th>
                <th className="px-4 py-3">Агент</th>
                <th className="px-4 py-3">Зар</th>
                <th className="px-4 py-3">Commission</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-[var(--esl-border)] hover:bg-[var(--esl-bg-hover)]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--esl-text)]">{p.name}</div>
                    <div className="text-xs text-[var(--esl-text-secondary)]">{p.contactName || '-'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--esl-brand-bg)] text-[#E8242C]">
                      {TYPE_LABELS[p.type] || p.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--esl-text)]">{p._count.agents}</td>
                  <td className="px-4 py-3 text-[var(--esl-text)]">{p._count.listings}</td>
                  <td className="px-4 py-3 text-[var(--esl-text)]">
                    <span className="text-xs">П:{p.platformFee}% А:{p.agentFee}% К:{p.companyFee}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {p.isVerified && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">Баталгаажсан</span>
                      )}
                      <span className={`px-2 py-0.5 text-xs rounded-full ${p.isActive ? 'bg-blue-100 text-blue-700' : 'bg-[var(--esl-bg-muted)] text-[var(--esl-text-secondary)]'}`}>
                        {p.isActive ? 'Идэвхтэй' : 'Зогссон'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1 hover:bg-[var(--esl-bg-hover)] rounded">
                      <MoreVertical size={16} className="text-[var(--esl-text-secondary)]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--esl-bg-section)] rounded-2xl p-6 w-full max-w-lg border border-[var(--esl-border)]">
            <h2 className="text-lg font-bold text-[var(--esl-text)] mb-4">Шинэ гэрээт компани</h2>
            <div className="space-y-3">
              <input
                placeholder="Компанийн нэр *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text)]"
              />
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text)]"
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <input
                placeholder="Регистрийн дугаар"
                value={form.registrationNo}
                onChange={(e) => setForm({ ...form, registrationNo: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text)]"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Холбоо барих нэр"
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  className="px-3 py-2 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text)]"
                />
                <input
                  placeholder="Утас"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  className="px-3 py-2 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text)]"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-[var(--esl-text-secondary)]">Платформ %</label>
                  <input
                    type="number" min={0} max={10} step={0.5}
                    value={form.platformFee}
                    onChange={(e) => setForm({ ...form, platformFee: +e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--esl-text-secondary)]">Агент %</label>
                  <input
                    type="number" min={0} max={10} step={0.5}
                    value={form.agentFee}
                    onChange={(e) => setForm({ ...form, agentFee: +e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--esl-text-secondary)]">Компани %</label>
                  <input
                    type="number" min={0} max={100} step={1}
                    value={form.companyFee}
                    onChange={(e) => setForm({ ...form, companyFee: +e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text)]"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text)]"
              >
                Болих
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.name}
                className="px-4 py-2 bg-[#E8242C] text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
              >
                Үүсгэх
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
