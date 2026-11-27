'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, TrendingUp, Send } from 'lucide-react';

interface ShopVat {
  shopId: string;
  shopName: string;
  shopType: string | null;
  annualSales: number;
  vatStatus: 'ok' | 'warning' | 'exceeded';
  progress: number;
}

interface Stats {
  vatRegistered: number;
  warning: number;
  exceeded: number;
}

function formatMoney(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M₮`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K₮`;
  return `${n}₮`;
}

export default function VatMonitorPage() {
  const [shops, setShops] = useState<ShopVat[]>([]);
  const [stats, setStats] = useState<Stats>({ vatRegistered: 0, warning: 0, exceeded: 0 });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/vat-monitor', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setShops(data.shops || []);
      setStats(data.stats || { vatRegistered: 0, warning: 0, exceeded: 0 });
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleNotify = async (shopId: string) => {
    setSending(shopId);
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/admin/vat-notify/${shopId}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      alert('Мэдэгдэл илгээсэн');
    } catch { alert('Алдаа гарлаа'); }
    setSending(null);
  };

  const getBarColor = (status: string) => {
    if (status === 'exceeded') return '#EF4444';
    if (status === 'warning') return '#F59E0B';
    return '#10B981';
  };

  const statCards = [
    { label: 'НӨАТ-тэй', value: stats.vatRegistered, icon: CheckCircle, color: '#10B981' },
    { label: 'Босгод ойртсон', value: stats.warning, icon: AlertTriangle, color: '#F59E0B' },
    { label: 'Босго давсан', value: stats.exceeded, icon: TrendingUp, color: '#EF4444' },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[var(--esl-text)]">НӨАТ хяналт</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-[var(--esl-bg-section)] rounded-xl p-4 border border-[var(--esl-border)]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${s.color}20` }}>
                <s.icon size={20} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xs text-[var(--esl-text-secondary)]">{s.label}</p>
                <p className="text-2xl font-bold text-[var(--esl-text)]">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[var(--esl-bg-section)] rounded-xl border border-[var(--esl-border)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[var(--esl-text-secondary)]">Ачааллаж байна...</div>
        ) : shops.length === 0 ? (
          <div className="p-8 text-center text-[var(--esl-text-secondary)]">Дэлгүүр олдсонгүй</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--esl-border)] text-left text-[var(--esl-text-secondary)]">
                <th className="px-4 py-3">Дэлгүүр</th>
                <th className="px-4 py-3">Жилийн борлуулалт</th>
                <th className="px-4 py-3">НӨАТ статус</th>
                <th className="px-4 py-3 w-48">Явц</th>
                <th className="px-4 py-3">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((shop) => (
                <tr
                  key={shop.shopId}
                  className={`border-b border-[var(--esl-border)] ${
                    shop.vatStatus === 'exceeded' ? 'bg-red-50/50' : shop.vatStatus === 'warning' ? 'bg-yellow-50/50' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--esl-text)]">{shop.shopName}</div>
                    <div className="text-xs text-[var(--esl-text-secondary)]">{shop.shopType || '-'}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-[var(--esl-text)]">
                    {formatMoney(shop.annualSales)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 text-xs rounded-full font-medium"
                      style={{
                        backgroundColor: `${getBarColor(shop.vatStatus)}20`,
                        color: getBarColor(shop.vatStatus),
                      }}
                    >
                      {shop.vatStatus === 'exceeded' ? 'Бүртгүүлэх' : shop.vatStatus === 'warning' ? 'Сануулга' : 'Хэвийн'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[var(--esl-bg-elevated)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, shop.progress)}%`,
                            backgroundColor: getBarColor(shop.vatStatus),
                          }}
                        />
                      </div>
                      <span className="text-xs text-[var(--esl-text-secondary)] w-10 text-right">{shop.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {(shop.vatStatus === 'warning' || shop.vatStatus === 'exceeded') && (
                      <button
                        onClick={() => handleNotify(shop.shopId)}
                        disabled={sending === shop.shopId}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-[#E8242C] text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        <Send size={12} /> {sending === shop.shopId ? '...' : 'Мэдэгдэл'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info */}
      <div className="bg-[var(--esl-bg-section)] rounded-xl p-4 border border-[var(--esl-border)] text-sm text-[var(--esl-text-secondary)]">
        <p className="font-medium text-[var(--esl-text)] mb-2">НӨАТ бүртгэлийн босго</p>
        <ul className="space-y-1">
          <li><span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2" />0 - 40,000,000₮: Хэвийн</li>
          <li><span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2" />40,000,000 - 50,000,000₮: Сануулга — НӨАТ бүртгүүлэх босгод ойртож байна</li>
          <li><span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2" />50,000,000₮+: Яаралтай — НӨАТ бүртгүүлэх заавал шаардлагатай</li>
        </ul>
      </div>
    </div>
  );
}
