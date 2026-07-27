'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatPrice } from '@/lib/utils';
import { useToast } from '@/components/shared/Toast';
import { getActiveStoreHeaders } from '@/lib/api';
import {
  Users, Check, X, Clock, Search, ShoppingBag, Loader2,
  BadgeCheck, Package, TrendingUp,
} from 'lucide-react';

/* ═══ Types ═══ */
interface SellerProduct {
  id: string;
  productName: string;
  isApproved: boolean;
  clicks: number;
  conversions: number;
}

interface Seller {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  email: string;
  isVerified: boolean;
  commissionRate: number;
  totalSales: number;
  totalEarned: number;
  products: SellerProduct[];
  pendingCount: number;
  approvedCount: number;
}

type Tab = 'pending' | 'approved' | 'all';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function SellersPage() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('pending');
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [acting, setActing] = useState<string | null>(null);

  const headers = useCallback(() => getActiveStoreHeaders(true), []);

  const fetchSellers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/store/sellers`, { headers: headers() });
      const json = await res.json();
      if (json.success) setSellers(json.data);
      else toast.show('Борлуулагчдыг ачаалж чадсангүй', 'error');
    } catch {
      toast.show('Сервертэй холбогдож чадсангүй', 'error');
    } finally {
      setLoading(false);
    }
  }, [headers, toast]);

  useEffect(() => { fetchSellers(); }, [fetchSellers]);

  const handleAction = async (productId: string, action: 'approve' | 'reject') => {
    setActing(productId);
    try {
      const res = await fetch(`${API}/api/store/sellers/${productId}`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.success) {
        toast.show(action === 'approve' ? 'Зөвшөөрөгдлөө' : 'Татгалзлаа', 'ok');
        fetchSellers();
      } else {
        toast.show(json.message || 'Алдаа гарлаа', 'error');
      }
    } catch {
      toast.show('Сервертэй холбогдож чадсангүй', 'error');
    } finally {
      setActing(null);
    }
  };

  /* ═══ Derived data ═══ */
  const q = search.toLowerCase();
  const filtered = sellers.filter(s => !q || s.name.toLowerCase().includes(q) || s.username.toLowerCase().includes(q));
  const pending = filtered.filter(s => s.pendingCount > 0);
  const approved = filtered.filter(s => s.approvedCount > 0);
  const visible = tab === 'pending' ? pending : tab === 'approved' ? approved : filtered;

  const totalEarned = sellers.reduce((s, x) => s + x.totalEarned, 0);
  const totalPending = sellers.reduce((s, x) => s + x.pendingCount, 0);

  /* ═══ Render ═══ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--esl-text-primary)' }}>Борлуулагчид</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--esl-text-muted)' }}>
            Борлуулагчдын хүсэлт батлах, гүйцэтгэл хянах
          </p>
        </div>
        {totalPending > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(232,36,44,0.1)] text-[#E8242C] text-xs font-bold rounded-full">
            <Clock className="w-3 h-3" /> {totalPending} хүсэлт хүлээгдэж байна
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Users, label: 'Нийт борлуулагч', value: sellers.length },
          { icon: TrendingUp, label: 'Нийт комисс олсон', value: formatPrice(totalEarned) },
          { icon: Clock, label: 'Хүлээгдэж буй', value: totalPending },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3 p-4 rounded-2xl border" style={{ background: 'var(--esl-bg-card)', borderColor: 'var(--esl-border)' }}>
            <div className="w-10 h-10 rounded-xl bg-[rgba(232,36,44,0.1)] flex items-center justify-center">
              <s.icon className="w-5 h-5 text-[#E8242C]" />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--esl-text-muted)' }}>{s.label}</p>
              <p className="text-lg font-bold" style={{ color: 'var(--esl-text-primary)' }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--esl-bg-page)' }}>
        {([
          { key: 'pending' as Tab, label: `Хүлээгдэж буй (${pending.length})`, icon: Clock },
          { key: 'approved' as Tab, label: `Зөвшөөрөгдсөн (${approved.length})`, icon: Check },
          { key: 'all' as Tab, label: 'Бүгд', icon: Users },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold border-none cursor-pointer transition-all ${
              tab === t.key ? 'bg-[var(--esl-bg-card)] text-[var(--esl-text-primary)] shadow-sm' : 'bg-transparent text-[var(--esl-text-muted)]'
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--esl-text-muted)' }} />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Борлуулагч хайх..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:border-[#E8242C]"
          style={{ background: 'var(--esl-bg-card)', borderColor: 'var(--esl-border)', color: 'var(--esl-text-primary)' }} />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#E8242C] animate-spin" />
          <p className="text-sm mt-3" style={{ color: 'var(--esl-text-muted)' }}>Ачааллаж байна...</p>
        </div>
      )}

      {/* Empty */}
      {!loading && visible.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--esl-text-muted)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--esl-text-primary)' }}>Борлуулагч байхгүй байна</p>
          <p className="text-xs mt-1" style={{ color: 'var(--esl-text-muted)' }}>
            {tab === 'pending' ? 'Хүлээгдэж буй хүсэлт алга' : 'Борлуулагч олдсонгүй'}
          </p>
        </div>
      )}

      {/* Seller cards */}
      {!loading && visible.length > 0 && (
        <div className="space-y-4">
          {visible.map(seller => {
            const pendingProducts = seller.products.filter(p => !p.isApproved);
            const approvedProducts = seller.products.filter(p => p.isApproved);

            return (
              <div key={seller.id} className="rounded-2xl border overflow-hidden" style={{ background: 'var(--esl-bg-card)', borderColor: 'var(--esl-border)' }}>
                {/* Seller info */}
                <div className="p-5 flex items-start gap-4">
                  {seller.avatar ? (
                    <img src={seller.avatar} alt={seller.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[rgba(232,36,44,0.1)] flex items-center justify-center text-lg font-bold text-[#E8242C] shrink-0">
                      {seller.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-bold" style={{ color: 'var(--esl-text-primary)' }}>{seller.name}</h3>
                      {seller.isVerified && <BadgeCheck className="w-4 h-4 text-[#E8242C]" />}
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--esl-bg-page)', color: 'var(--esl-text-muted)' }}>@{seller.username}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs" style={{ color: 'var(--esl-text-muted)' }}>
                      <span>Комисс: <strong className="text-[#E8242C]">{seller.commissionRate}%</strong></span>
                      <span>Борлуулалт: <strong style={{ color: 'var(--esl-text-primary)' }}>{seller.totalSales}</strong></span>
                      <span>Олсон: <strong className="text-[#E8242C]">{formatPrice(seller.totalEarned)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Approved products */}
                {approvedProducts.length > 0 && (
                  <div className="px-5 pb-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--esl-text-muted)' }}>
                      <Package className="w-3 h-3 inline mr-1" />Зөвшөөрөгдсөн ({approvedProducts.length})
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {approvedProducts.map(p => (
                        <span key={p.id} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border" style={{ background: 'var(--esl-bg-page)', borderColor: 'var(--esl-border)', color: 'var(--esl-text-primary)' }}>
                          <ShoppingBag className="w-3 h-3" /> {p.productName}
                          <span style={{ color: 'var(--esl-text-muted)' }}>· {p.clicks} клик · {p.conversions} борлуулалт</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending products with actions */}
                {pendingProducts.length > 0 && (
                  <div className="px-5 pb-4 border-t" style={{ borderColor: 'var(--esl-border)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2 mt-3" style={{ color: 'var(--esl-text-muted)' }}>
                      <Clock className="w-3 h-3 inline mr-1" />Хүлээгдэж буй ({pendingProducts.length})
                    </p>
                    <div className="space-y-2">
                      {pendingProducts.map(p => (
                        <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border" style={{ background: 'var(--esl-bg-page)', borderColor: 'var(--esl-border)' }}>
                          <div className="flex items-center gap-2 min-w-0">
                            <ShoppingBag className="w-4 h-4 shrink-0 text-[#E8242C]" />
                            <span className="text-sm font-medium truncate" style={{ color: 'var(--esl-text-primary)' }}>{p.productName}</span>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              disabled={acting === p.id}
                              onClick={() => handleAction(p.id, 'approve')}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#E8242C] text-white border-none cursor-pointer hover:bg-[#C41E25] transition disabled:opacity-50">
                              {acting === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Зөвшөөрөх
                            </button>
                            <button
                              disabled={acting === p.id}
                              onClick={() => handleAction(p.id, 'reject')}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer hover:bg-[var(--esl-bg-page)] transition disabled:opacity-50"
                              style={{ background: 'var(--esl-bg-card)', borderColor: 'var(--esl-border)', color: 'var(--esl-text-muted)' }}>
                              <X className="w-3 h-3" /> Татгалзах
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
