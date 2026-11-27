'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface DisputeRow {
  id: string;
  code: string;
  sellerName: string | null;
  shopName: string | null;
  reason: string;
  status: string;
  winner: string | null;
  resolveNote: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  open: number;
  resolved: number;
  rejected: number;
}

const TABS = [
  { key: 'OPEN', label: 'Нээлттэй' },
  { key: 'RESOLVED', label: 'Шийдвэрлэсэн' },
  { key: 'ALL', label: 'Бүгд' },
];

function hoursAgo(dateStr: string) {
  return Math.round((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60));
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, open: 0, resolved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('OPEN');
  const [resolveModal, setResolveModal] = useState<DisputeRow | null>(null);
  const [resolveForm, setResolveForm] = useState({ winner: 'seller' as 'seller' | 'store', note: '' });

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/disputes?status=${tab}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setDisputes(data.disputes || []);
      setStats(data.stats || { total: 0, open: 0, resolved: 0, rejected: 0 });
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchDisputes(); }, [tab]);

  const handleResolve = async () => {
    if (!resolveModal) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/admin/disputes/${resolveModal.id}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(resolveForm),
    });
    setResolveModal(null);
    setResolveForm({ winner: 'seller', note: '' });
    fetchDisputes();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[var(--esl-text)]">Маргаан шийдвэрлэлт</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Нийт', value: stats.total, icon: AlertCircle, color: '#6366F1' },
          { label: 'Нээлттэй', value: stats.open, icon: Clock, color: '#F59E0B' },
          { label: 'Шийдвэрлэсэн', value: stats.resolved, icon: CheckCircle, color: '#10B981' },
          { label: 'Татгалзсан', value: stats.rejected, icon: XCircle, color: '#EF4444' },
        ].map((s) => (
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

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--esl-bg-section)] rounded-lg p-1 w-fit border border-[var(--esl-border)]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm transition ${
              tab === t.key
                ? 'bg-[#E8242C] text-white'
                : 'text-[var(--esl-text-secondary)] hover:text-[var(--esl-text)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[var(--esl-bg-section)] rounded-xl border border-[var(--esl-border)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[var(--esl-text-secondary)]">Ачааллаж байна...</div>
        ) : disputes.length === 0 ? (
          <div className="p-8 text-center text-[var(--esl-text-secondary)]">Маргаан олдсонгүй</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--esl-border)] text-left text-[var(--esl-text-secondary)]">
                <th className="px-4 py-3">Код</th>
                <th className="px-4 py-3">Борлуулагч</th>
                <th className="px-4 py-3">Дэлгүүр</th>
                <th className="px-4 py-3">Шалтгаан</th>
                <th className="px-4 py-3">Огноо</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((d) => {
                const hrs = hoursAgo(d.createdAt);
                const isOverdue = d.status === 'OPEN' && hrs > 48;
                return (
                  <tr
                    key={d.id}
                    className={`border-b border-[var(--esl-border)] ${isOverdue ? 'bg-red-50/50' : ''}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[var(--esl-text)]">
                      {d.code}
                      {isOverdue && (
                        <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-red-100 text-red-600 rounded">48ц+</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--esl-text)]">{d.sellerName || '-'}</td>
                    <td className="px-4 py-3 text-[var(--esl-text)]">{d.shopName || '-'}</td>
                    <td className="px-4 py-3 text-[var(--esl-text)] max-w-48 truncate">{d.reason}</td>
                    <td className="px-4 py-3 text-[var(--esl-text-secondary)] text-xs">
                      {new Date(d.createdAt).toLocaleDateString('mn-MN')}
                      <br />
                      <span className="text-[var(--esl-text-disabled)]">{hrs}ц өмнө</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        d.status === 'OPEN' ? 'bg-yellow-100 text-yellow-700' :
                        d.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                        'bg-[var(--esl-bg-muted)] text-[var(--esl-text-secondary)]'
                      }`}>
                        {d.status === 'OPEN' ? 'Нээлттэй' : d.status === 'RESOLVED' ? 'Шийдвэрлэсэн' : 'Татгалзсан'}
                      </span>
                      {d.winner && (
                        <span className="ml-1 text-xs text-[var(--esl-text-secondary)]">
                          → {d.winner === 'seller' ? 'Борлуулагч' : 'Дэлгүүр'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {d.status === 'OPEN' && (
                        <button
                          onClick={() => setResolveModal(d)}
                          className="px-3 py-1 text-xs bg-[#E8242C] text-white rounded-lg hover:bg-red-700"
                        >
                          Шийдвэрлэх
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Resolve Modal */}
      {resolveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--esl-bg-section)] rounded-2xl p-6 w-full max-w-md border border-[var(--esl-border)]">
            <h2 className="text-lg font-bold text-[var(--esl-text)] mb-1">Маргаан шийдвэрлэх</h2>
            <p className="text-xs text-[var(--esl-text-secondary)] mb-4">{resolveModal.code} — {resolveModal.reason}</p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--esl-text)]">Шийдвэр</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setResolveForm({ ...resolveForm, winner: 'seller' })}
                    className={`p-3 rounded-lg border text-sm text-center transition ${
                      resolveForm.winner === 'seller'
                        ? 'border-[#E8242C] bg-red-50 text-[#E8242C]'
                        : 'border-[var(--esl-border)] text-[var(--esl-text-secondary)]'
                    }`}
                  >
                    <CheckCircle size={16} className="mx-auto mb-1" />
                    Борлуулагчийн талд
                    <p className="text-[10px] mt-0.5 opacity-60">Commission олгох</p>
                  </button>
                  <button
                    onClick={() => setResolveForm({ ...resolveForm, winner: 'store' })}
                    className={`p-3 rounded-lg border text-sm text-center transition ${
                      resolveForm.winner === 'store'
                        ? 'border-[#E8242C] bg-red-50 text-[#E8242C]'
                        : 'border-[var(--esl-border)] text-[var(--esl-text-secondary)]'
                    }`}
                  >
                    <CheckCircle size={16} className="mx-auto mb-1" />
                    Дэлгүүрийн талд
                    <p className="text-[10px] mt-0.5 opacity-60">Commission цуцлах</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--esl-text)]">Тайлбар</label>
                <textarea
                  value={resolveForm.note}
                  onChange={(e) => setResolveForm({ ...resolveForm, note: e.target.value })}
                  placeholder="Шийдвэрийн тайлбар..."
                  rows={3}
                  className="w-full mt-1 px-3 py-2 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text)]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setResolveModal(null)}
                className="px-4 py-2 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text)]"
              >
                Болих
              </button>
              <button
                onClick={handleResolve}
                className="px-4 py-2 bg-[#E8242C] text-white rounded-lg text-sm hover:bg-red-700"
              >
                Шийдвэрлэх
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
