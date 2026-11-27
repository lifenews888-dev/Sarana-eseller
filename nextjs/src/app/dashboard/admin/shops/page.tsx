'use client';

import { useState, useEffect } from 'react';
import {
  Search, Ban, Shield, Store, RefreshCw, ChevronLeft, ChevronRight,
  AlertTriangle, Users, TrendingUp, Package, MapPin, Eye, ExternalLink,
  MoreHorizontal, Filter, Download, Plus,
} from 'lucide-react';

interface ShopRow {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  phone?: string;
  district?: string;
  isBlocked: boolean;
  blockReason: string | null;
  createdAt: string;
  user: { name: string; email: string } | null;
  subscription: { planKey: string; commissionRate: number | null; expiresAt: string | null } | null;
  shopType?: { name: string } | null;
  _count?: { products: number };
}

const PLAN_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  free:     { label: 'Үнэгүй',    color: '#94A3B8', bg: '#94A3B815' },
  standard: { label: 'Стандарт',   color: '#6366F1', bg: '#6366F115' },
  ultimate: { label: 'Алтимэйт',  color: '#D97706', bg: '#D9770615' },
  ai_pro:   { label: 'AI Pro',     color: '#EC4899', bg: '#EC489915' },
};

export default function AdminShopsPage() {
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, noCoords: 0 });
  const [planBreakdown, setPlanBreakdown] = useState({ free: 0, standard: 0, ultimate: 0, ai_pro: 0 });

  const fetchShops = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/shops?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || json.message || `HTTP ${res.status}`);
        return;
      }

      // API returns { success, data: { shops, total, pages, stats, planBreakdown } }
      const d = json.data || json;
      if (d.shops) setShops(d.shops);
      if (d.planBreakdown) setPlanBreakdown(d.planBreakdown);
      if (d.stats) setStats(d.stats);
      if (d.total != null) setTotal(d.total);
      if (d.pages) setTotalPages(d.pages);
    } catch (e: unknown) {
      setError((e instanceof Error ? e.message : String(e)) || 'Сервертэй холбогдож чадсангүй');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShops(); }, [page]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchShops(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const changePlan = async (shopId: string, planKey: string) => {
    const token = localStorage.getItem('token');
    await fetch(`/api/admin/shops/${shopId}/plan`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ planKey }),
    });
    fetchShops();
  };

  const setCommission = async (shopId: string, rate: string) => {
    const token = localStorage.getItem('token');
    await fetch(`/api/admin/shops/${shopId}/commission`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ commissionRate: rate ? parseFloat(rate) : null }),
    });
    fetchShops();
  };

  const toggleBlock = async (shopId: string, blocked: boolean) => {
    if (blocked && !confirm('Энэ дэлгүүрийг блоклох уу?')) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/admin/shops/${shopId}/block`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ blocked, reason: blocked ? 'Админ блоклосон' : null }),
    });
    fetchShops();
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-dash-sidebar border-b border-dash-border px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-black flex items-center gap-2">
              <Store className="w-6 h-6 text-[var(--esl-accent)]" /> Дэлгүүр удирдлага
            </h1>
            <p className="text-white/35 text-xs mt-1">Багц, комисс, блоклох, статистик — {total} дэлгүүр</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchShops} className="p-2 rounded-lg bg-white/[.05] border border-white/10 text-white/50 hover:text-white transition cursor-pointer">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle size={18} className="text-red-400 shrink-0" />
            <div>
              <p className="text-red-400 text-sm font-semibold">Алдаа гарлаа</p>
              <p className="text-red-400/70 text-xs">{error}</p>
            </div>
            <button onClick={fetchShops} className="ml-auto text-red-400 text-xs font-bold bg-red-500/10 px-3 py-1.5 rounded-lg border-none cursor-pointer hover:bg-red-500/20">
              Дахин оролдох
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Нийт дэлгүүр', value: stats.total, icon: <Store size={18} />, color: '#3B82F6' },
            { label: 'Баталгаажсан', value: stats.verified, icon: <Shield size={18} />, color: '#22C55E' },
            { label: 'Хүлээгдэж буй', value: stats.pending, icon: <MapPin size={18} />, color: '#F59E0B' },
            { label: 'Байршилгүй', value: stats.noCoords, icon: <AlertTriangle size={18} />, color: '#EF4444' },
          ].map((s, i) => (
            <div key={i} className="bg-dash-card border border-dash-border rounded-2xl p-5 group hover:border-white/10 transition-all">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: s.color + '15' }}>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
              <div className="text-2xl font-black text-white">{s.value}</div>
              <span className="text-[11px] text-white/40">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Plan breakdown */}
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(PLAN_LABELS).map(([key, p]) => (
            <div key={key} className="bg-dash-card border border-dash-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-3 h-8 rounded-full" style={{ backgroundColor: p.color }} />
              <div>
                <div className="text-lg font-black" style={{ color: p.color }}>{planBreakdown[key as keyof typeof planBreakdown] || 0}</div>
                <div className="text-[10px] text-white/40">{p.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Дэлгүүр хайх..."
            className="w-full pl-10 pr-4 py-3 bg-dash-card border border-dash-border rounded-xl text-sm text-white outline-none focus:border-[var(--esl-accent)] transition" />
        </div>

        {/* Table */}
        <div className="bg-dash-card border border-dash-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[.03]">
                  {['Дэлгүүр', 'Эзэн', 'Төрөл', 'Багц', 'Комисс %', 'Статус', 'Үүсгэсэн', 'Үйлдэл'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-[10px] font-bold text-white/40 uppercase tracking-wider border-b border-dash-border">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-16 text-white/30 text-sm">Ачааллаж байна...</td></tr>
                ) : shops.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-16 text-white/30 text-sm">
                    {error ? 'Алдаа гарсан — дээрх мэдээллийг харна уу' : 'Дэлгүүр олдсонгүй'}
                  </td></tr>
                ) : shops.map(shop => {
                  const planKey = shop.subscription?.planKey || 'free';
                  const planInfo = PLAN_LABELS[planKey] || PLAN_LABELS.free;
                  const commRate = shop.subscription?.commissionRate;
                  return (
                    <tr key={shop.id} className={`border-b border-white/[.04] hover:bg-white/[.02] transition ${shop.isBlocked ? 'bg-red-500/[.03]' : ''}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-white/[.05] flex items-center justify-center shrink-0 overflow-hidden">
                            {shop.logo ? <img src={shop.logo} alt="" className="w-9 h-9 object-cover" /> : <Store size={16} className="text-white/30" />}
                          </div>
                          <div>
                            <div className="text-white font-bold text-sm">{shop.name}</div>
                            <div className="text-[10px] text-white/30 flex items-center gap-1">{shop.slug} {shop.district && <span>· {shop.district}</span>}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-white/70 text-xs">{shop.user?.name || '—'}</div>
                        <div className="text-[10px] text-white/30">{shop.user?.email || ''}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-white/50">{shop.shopType?.name || '—'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <select value={planKey} onChange={e => changePlan(shop.id, e.target.value)}
                          className="bg-dash-elevated text-white border border-dash-border rounded-lg px-2.5 py-1.5 text-xs outline-none cursor-pointer font-semibold"
                          style={{ color: planInfo.color }}>
                          {Object.entries(PLAN_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            defaultValue={commRate ?? ''}
                            placeholder="—"
                            onBlur={e => setCommission(shop.id, e.target.value)}
                            className="w-16 bg-dash-elevated text-white border border-dash-border rounded-lg px-2 py-1.5 text-xs outline-none"
                          />
                          <span className="text-white/30 text-xs">%</span>
                          {commRate != null && (
                            <button onClick={() => setCommission(shop.id, '')}
                              className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border-none cursor-pointer hover:bg-amber-500/20">
                              reset
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {shop.isBlocked ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 flex items-center gap-1 w-fit">
                            <Ban size={10} /> Блоклогдсон
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center gap-1 w-fit">
                            <Shield size={10} /> Идэвхтэй
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[11px] text-white/30">
                        {new Date(shop.createdAt).toLocaleDateString('mn-MN')}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => window.open(`/store/${shop.slug}`, '_blank')}
                            className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border-none cursor-pointer hover:bg-blue-500/20 transition">
                            <Eye size={13} />
                          </button>
                          <button onClick={() => toggleBlock(shop.id, !shop.isBlocked)}
                            className={`p-1.5 rounded-lg border-none cursor-pointer transition ${
                              shop.isBlocked ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            }`}>
                            {shop.isBlocked ? <Shield size={13} /> : <Ban size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-dash-border">
              <span className="text-[11px] text-white/30">{total} дэлгүүрийн {page}/{totalPages} хуудас</span>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="p-1.5 rounded-lg bg-white/[.05] border border-white/10 text-white/50 disabled:opacity-30 cursor-pointer">
                  <ChevronLeft size={14} />
                </button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="p-1.5 rounded-lg bg-white/[.05] border border-white/10 text-white/50 disabled:opacity-30 cursor-pointer">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
