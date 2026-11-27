'use client';

import { useState, useEffect } from 'react';
import {
  Search, Store, Crown, Ban, Shield, DollarSign, Users, RefreshCw,
  AlertTriangle, TrendingUp, Link2, ExternalLink, Eye,
} from 'lucide-react';

interface SellerRow {
  id: string; name: string; email: string; phone: string | null; role: string;
  isActive: boolean; createdAt: string;
  store: { name: string | null; commission: number | null } | null;
  shop: { id: string; name: string; slug: string; industry: string | null; subscription: { planKey: string; commissionRate: number | null } | null } | null;
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: 'Үнэгүй', color: '#94A3B8' },
  standard: { label: 'Стандарт', color: '#6366F1' },
  ultimate: { label: 'Алтимэйт', color: '#D97706' },
  ai_pro: { label: 'AI Pro', color: '#EC4899' },
};

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<SellerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total: 0, seller: 0, affiliate: 0, active: 0 });

  const fetchSellers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const params = new URLSearchParams({ role: 'seller' });
      if (search) params.set('q', search);

      const res = await fetch(`/api/admin/users?${params}`, { headers });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || `HTTP ${res.status}`);
        return;
      }

      const users = json.users || json.data?.users || [];
      setStats({
        total: json.total || json.data?.total || users.length,
        seller: json.breakdown?.seller || json.data?.breakdown?.seller || 0,
        affiliate: json.breakdown?.affiliate || json.data?.breakdown?.affiliate || 0,
        active: (users as SellerRow[]).filter((u) => u.isActive).length,
      });

      // Also fetch affiliate users
      const res2 = await fetch(`/api/admin/users?role=affiliate${search ? '&q=' + search : ''}`, { headers });
      const json2 = await res2.json();
      const affiliates = json2.users || json2.data?.users || [];

      const allSellers = [...users, ...affiliates];

      // Enrich with shop data (batch, not per-user)
      const enriched = await Promise.all((allSellers as SellerRow[]).map(async (u) => {
        try {
          const shopRes = await fetch(`/api/admin/shops?search=${encodeURIComponent(u.email)}&limit=1`, { headers });
          const shopData = await shopRes.json();
          const shop = shopData.data?.shops?.[0] || null;
          return { ...u, shop };
        } catch { return { ...u, shop: null }; }
      }));
      setSellers(enriched);
    } catch (e: unknown) {
      setError((e instanceof Error ? e.message : String(e)) || 'Сервертэй холбогдож чадсангүй');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchSellers, 300);
    return () => clearTimeout(t);
  }, [search]);

  const changePlan = async (shopId: string, planKey: string) => {
    const token = localStorage.getItem('token');
    await fetch(`/api/admin/shops/${shopId}/plan`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ planKey }),
    });
    fetchSellers();
  };

  const setCommission = async (shopId: string, rate: string) => {
    const token = localStorage.getItem('token');
    await fetch(`/api/admin/shops/${shopId}/commission`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ commissionRate: rate ? parseFloat(rate) : null }),
    });
  };

  return (
    <div>
      <div className="bg-dash-sidebar border-b border-dash-border px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-black flex items-center gap-2">
              <Users className="w-6 h-6 text-[var(--esl-accent)]" /> Борлуулагч удирдлага
            </h1>
            <p className="text-white/35 text-xs mt-1">Борлуулагч, affiliate, комисс, багц</p>
          </div>
          <button onClick={fetchSellers} className="p-2 rounded-lg bg-white/[.05] border border-white/10 text-white/50 hover:text-white transition cursor-pointer">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle size={18} className="text-red-400 shrink-0" />
            <div>
              <p className="text-red-400 text-sm font-semibold">Алдаа</p>
              <p className="text-red-400/70 text-xs">{error}</p>
            </div>
            <button onClick={fetchSellers} className="ml-auto text-red-400 text-xs font-bold bg-red-500/10 px-3 py-1.5 rounded-lg border-none cursor-pointer">Дахин</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Нийт борлуулагч', value: stats.seller + stats.affiliate, icon: <Users size={18} />, color: '#3B82F6' },
            { label: 'Дэлгүүр эзэд', value: stats.seller, icon: <Store size={18} />, color: '#22C55E' },
            { label: 'Affiliate', value: stats.affiliate, icon: <Link2 size={18} />, color: '#F59E0B' },
            { label: 'Идэвхтэй', value: stats.active, icon: <TrendingUp size={18} />, color: '#8B5CF6' },
          ].map((s, i) => (
            <div key={i} className="bg-dash-card border border-dash-border rounded-2xl p-5 hover:border-white/10 transition">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: s.color + '15' }}>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
              <div className="text-2xl font-black text-white">{s.value}</div>
              <span className="text-[11px] text-white/40">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Борлуулагч хайх..."
            className="w-full pl-10 pr-4 py-3 bg-dash-card border border-dash-border rounded-xl text-sm text-white outline-none focus:border-[var(--esl-accent)] transition" />
        </div>

        {/* Table */}
        <div className="bg-dash-card border border-dash-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[.03]">
                {['Борлуулагч', 'Ролл', 'Дэлгүүр', 'Салбар', 'Багц', 'Комисс %', 'Статус', 'Үйлдэл'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-[10px] font-bold text-white/40 uppercase tracking-wider border-b border-dash-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-16 text-white/30">Ачааллаж байна...</td></tr>
              ) : sellers.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-white/30">
                  {error ? 'Алдаа — дээрх мэдээлэл харна уу' : 'Борлуулагч олдсонгүй'}
                </td></tr>
              ) : sellers.map(s => {
                const planKey = s.shop?.subscription?.planKey || 'free';
                const planInfo = PLAN_LABELS[planKey] || PLAN_LABELS.free;
                const commRate = s.shop?.subscription?.commissionRate;
                return (
                  <tr key={s.id} className="border-b border-white/[.04] hover:bg-white/[.02] transition">
                    <td className="px-5 py-3.5">
                      <div className="text-white font-bold text-sm">{s.name}</div>
                      <div className="text-[10px] text-white/30">{s.email}</div>
                      {s.phone && <div className="text-[10px] text-white/20">{s.phone}</div>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                        s.role === 'seller' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                      }`}>{s.role === 'seller' ? 'Дэлгүүр' : 'Affiliate'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-white/60 text-xs">{s.shop?.name || s.store?.name || '—'}</td>
                    <td className="px-5 py-3.5 text-white/40 text-xs">{s.shop?.industry || '—'}</td>
                    <td className="px-5 py-3.5">
                      {s.shop ? (
                        <select value={planKey} onChange={e => changePlan(s.shop!.id, e.target.value)}
                          className="bg-dash-elevated text-white border border-dash-border rounded-lg px-2.5 py-1.5 text-xs outline-none cursor-pointer font-semibold"
                          style={{ color: planInfo.color }}>
                          {Object.entries(PLAN_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      ) : <span className="text-white/20 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {s.shop ? (
                        <div className="flex items-center gap-1">
                          <input type="number" defaultValue={commRate ?? ''} placeholder="—"
                            onBlur={e => setCommission(s.shop!.id, e.target.value)}
                            className="w-14 bg-dash-elevated text-white border border-dash-border rounded-lg px-2 py-1.5 text-xs outline-none" />
                          <span className="text-white/30 text-xs">%</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      {s.isActive ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400">Идэвхтэй</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400">Идэвхгүй</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1">
                        {s.shop && (
                          <button onClick={() => window.open(`/store/${s.shop!.slug}`, '_blank')}
                            className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border-none cursor-pointer hover:bg-blue-500/20">
                            <Eye size={13} />
                          </button>
                        )}
                        <span title="Verified badge" className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 cursor-pointer hover:bg-amber-500/20">
                          <Crown size={13} />
                        </span>
                        <span title="Payout" className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 cursor-pointer hover:bg-emerald-500/20">
                          <DollarSign size={13} />
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
