'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ExternalLink, Star, Clock, Eye, X } from 'lucide-react';
import { SELLER_TIERS, getTierInfo, getApplicableTiers } from '@/lib/seller/influencerTier';

interface Application {
  id: string;
  targetTier: string;
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
  youtube: string | null;
  followers: number;
  screenshot: string | null;
  note: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
  seller: {
    id: string;
    displayName: string;
    username: string;
    sellerType: string;
    followers: number | null;
    totalSales: number;
    influencerVerified: boolean;
  };
}

interface Stats { total: number; pending: number; approved: number; rejected: number; }

export default function AdminInfluencersPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('PENDING');
  const [detail, setDetail] = useState<Application | null>(null);
  const [actionForm, setActionForm] = useState({ tier: 'MICRO', adminNote: '' });
  const [processing, setProcessing] = useState(false);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/influencers', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setApps(data.applications || []);
      setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    const deferred = window.setTimeout(() => { fetchApps(); }, 0);
    return () => window.clearTimeout(deferred);
  }, []);

  const filtered = tab === 'ALL' ? apps : apps.filter((a) => a.status === tab);

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!detail) return;
    setProcessing(true);
    const token = localStorage.getItem('token');
    await fetch(`/api/admin/influencers/${detail.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ action, tier: actionForm.tier, adminNote: actionForm.adminNote }),
    });
    setDetail(null);
    setActionForm({ tier: 'MICRO', adminNote: '' });
    setProcessing(false);
    fetchApps();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Star size={22} className="text-[#F59E0B]" />
        <h1 className="text-2xl font-bold text-[var(--esl-text)]">Инфлюэнсер хүсэлтүүд</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Нийт', value: stats.total, color: '#6366F1' },
          { label: 'Хүлээгдэж буй', value: stats.pending, color: '#F59E0B' },
          { label: 'Баталгаажсан', value: stats.approved, color: '#10B981' },
          { label: 'Татгалзсан', value: stats.rejected, color: '#EF4444' },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--esl-bg-section)] rounded-xl p-3 border border-[var(--esl-border)] text-center">
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-[var(--esl-text-secondary)]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tier legend */}
      <div className="flex flex-wrap gap-2">
        {SELLER_TIERS.filter((t) => t.requiresApproval).map((t) => (
          <span key={t.type} className="px-3 py-1 text-xs rounded-full font-medium" style={{ backgroundColor: `${t.color}20`, color: t.color }}>
            {t.emoji} {t.label} (+{t.bonus}%)
          </span>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--esl-bg-section)] rounded-lg p-1 w-fit border border-[var(--esl-border)]">
        {[{ key: 'PENDING', label: 'Хүлээгдэж буй' }, { key: 'APPROVED', label: 'Баталгаажсан' }, { key: 'ALL', label: 'Бүгд' }].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm transition ${tab === t.key ? 'bg-[#E8242C] text-white' : 'text-[var(--esl-text-secondary)]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[var(--esl-bg-section)] rounded-xl border border-[var(--esl-border)] overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-[var(--esl-text-secondary)]">Ачааллаж байна...</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-[var(--esl-text-secondary)]">Хүсэлт байхгүй</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--esl-border)] text-left text-[var(--esl-text-secondary)]">
                <th className="px-4 py-3">Борлуулагч</th>
                <th className="px-4 py-3">Хүссэн tier</th>
                <th className="px-4 py-3">Дагагч</th>
                <th className="px-4 py-3">Social</th>
                <th className="px-4 py-3">Огноо</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const tierInfo = getTierInfo(a.targetTier);
                return (
                  <tr key={a.id} className="border-b border-[var(--esl-border)]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--esl-text)]">{a.seller.displayName}</div>
                      <div className="text-xs text-[var(--esl-text-secondary)]">@{a.seller.username} · {a.seller.totalSales} борлуулалт</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: `${tierInfo.color}20`, color: tierInfo.color }}>
                        {tierInfo.emoji} {tierInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--esl-text)]">{a.followers.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {a.instagram && <a href={a.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-500"><ExternalLink size={13} /></a>}
                        {a.tiktok && <a href={a.tiktok} target="_blank" rel="noopener noreferrer" className="text-[var(--esl-text-secondary)]"><ExternalLink size={13} /></a>}
                        {a.facebook && <a href={a.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600"><ExternalLink size={13} /></a>}
                        {a.youtube && <a href={a.youtube} target="_blank" rel="noopener noreferrer" className="text-red-500"><ExternalLink size={13} /></a>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--esl-text-secondary)]">
                      {new Date(a.createdAt).toLocaleDateString('mn-MN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        a.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        a.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {a.status === 'APPROVED' ? 'Зөвшөөрсөн' : a.status === 'REJECTED' ? 'Татгалзсан' : 'Хүлээгдэж буй'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setDetail(a); setActionForm({ tier: a.targetTier, adminNote: '' }); }}
                        className="px-2 py-1 text-xs bg-[var(--esl-bg-hover)] text-[var(--esl-text)] rounded-lg flex items-center gap-1">
                        <Eye size={12} /> Харах
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--esl-bg-section)] rounded-2xl p-6 w-full max-w-lg border border-[var(--esl-border)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[var(--esl-text)]">Хүсэлтийн дэлгэрэнгүй</h2>
              <button onClick={() => setDetail(null)} className="p-1 hover:bg-[var(--esl-bg-hover)] rounded"><X size={18} /></button>
            </div>

            {/* Seller info */}
            <div className="bg-[var(--esl-bg-page)] rounded-lg p-3 mb-4">
              <p className="font-medium text-[var(--esl-text)]">{detail.seller.displayName}</p>
              <p className="text-xs text-[var(--esl-text-secondary)]">@{detail.seller.username} · {detail.seller.totalSales} борлуулалт · {detail.followers.toLocaleString()} дагагч</p>
            </div>

            {/* Screenshot */}
            {detail.screenshot && (
              <div className="mb-4">
                <p className="text-xs font-medium text-[var(--esl-text-secondary)] mb-1">Screenshot</p>
                <img src={detail.screenshot} alt="Screenshot" className="w-full rounded-lg border border-[var(--esl-border)]" />
              </div>
            )}

            {/* Social links */}
            <div className="flex gap-2 mb-4">
              {detail.instagram && <a href={detail.instagram} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1 bg-pink-50 text-pink-600 rounded-lg flex items-center gap-1"><ExternalLink size={10} /> Instagram</a>}
              {detail.tiktok && <a href={detail.tiktok} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1 bg-[var(--esl-bg-muted)] text-[var(--esl-text-primary)] rounded-lg flex items-center gap-1"><ExternalLink size={10} /> TikTok</a>}
              {detail.facebook && <a href={detail.facebook} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-lg flex items-center gap-1"><ExternalLink size={10} /> Facebook</a>}
              {detail.youtube && <a href={detail.youtube} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-lg flex items-center gap-1"><ExternalLink size={10} /> YouTube</a>}
            </div>

            {detail.note && (
              <div className="bg-[var(--esl-bg-page)] rounded-lg p-3 mb-4">
                <p className="text-xs font-medium text-[var(--esl-text-secondary)] mb-1">Тайлбар</p>
                <p className="text-sm text-[var(--esl-text)]">{detail.note}</p>
              </div>
            )}

            {detail.status === 'PENDING' && (
              <>
                {/* Tier select */}
                <div className="mb-3">
                  <label className="text-sm font-medium text-[var(--esl-text)] mb-1 block">Tier сонгох</label>
                  <select value={actionForm.tier} onChange={(e) => setActionForm({ ...actionForm, tier: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text)]">
                    {getApplicableTiers().map((t) => (
                      <option key={t.type} value={t.type}>{t.emoji} {t.label} (+{t.bonus}%)</option>
                    ))}
                  </select>
                </div>

                {/* Admin note */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-[var(--esl-text)] mb-1 block">Admin тэмдэглэл</label>
                  <textarea value={actionForm.adminNote} onChange={(e) => setActionForm({ ...actionForm, adminNote: e.target.value })}
                    placeholder="Шийдвэрийн тайлбар..." rows={2}
                    className="w-full px-3 py-2 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text)]" />
                </div>

                <div className="flex gap-2">
                  <button onClick={() => handleAction('approve')} disabled={processing}
                    className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                    <CheckCircle size={14} /> Зөвшөөрөх
                  </button>
                  <button onClick={() => handleAction('reject')} disabled={processing}
                    className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                    <XCircle size={14} /> Татгалзах
                  </button>
                </div>
              </>
            )}

            {detail.status !== 'PENDING' && detail.adminNote && (
              <div className="bg-[var(--esl-bg-page)] rounded-lg p-3">
                <p className="text-xs font-medium text-[var(--esl-text-secondary)]">Admin тэмдэглэл</p>
                <p className="text-sm text-[var(--esl-text)]">{detail.adminNote}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
