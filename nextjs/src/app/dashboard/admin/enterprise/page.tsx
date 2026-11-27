'use client';

import { useState, useEffect } from 'react';
import { Building2, Globe, ExternalLink, Check, X, Loader2 } from 'lucide-react';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface EntShop {
  id: string;
  subdomain: string;
  customDomain: string | null;
  primaryColor: string;
  plan: string;
  isActive: boolean;
  createdAt: string;
  shop: { id: string; name: string; slug: string; logo: string | null };
}

const PLAN_COLORS: Record<string, string> = {
  STARTER: 'bg-[var(--esl-bg-muted)] text-[var(--esl-text-primary)]',
  BUSINESS: 'bg-blue-100 text-blue-700',
  CORPORATE: 'bg-purple-100 text-purple-700',
};

export default function AdminEnterprisePage() {
  const [shops, setShops] = useState<EntShop[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch('/api/admin/enterprise', { headers: authHeaders() });
      const data = await res.json();
      setShops(data.data?.shops || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    const deferred = window.setTimeout(() => { load(); }, 0);
    return () => window.clearTimeout(deferred);
  }, []);

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch('/api/admin/enterprise', {
      method: 'PATCH',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    load();
  };

  const updatePlan = async (id: string, plan: string) => {
    await fetch('/api/admin/enterprise', {
      method: 'PATCH',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, plan }),
    });
    load();
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-6 h-6 text-blue-900" />
        <h1 className="text-2xl font-bold">Enterprise дэлгүүрүүд</h1>
        <span className="text-sm text-[var(--esl-text-muted)] ml-2">{shops.length} дэлгүүр</span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--esl-text-muted)]"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : shops.length === 0 ? (
        <div className="text-center py-12 text-[var(--esl-text-muted)]">Enterprise дэлгүүр байхгүй</div>
      ) : (
        <div className="bg-[var(--esl-bg-card)] rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--esl-bg-section)] border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Дэлгүүр</th>
                <th className="text-left px-4 py-3 font-medium">Subdomain</th>
                <th className="text-left px-4 py-3 font-medium">Багц</th>
                <th className="text-left px-4 py-3 font-medium">Статус</th>
                <th className="text-left px-4 py-3 font-medium">Огноо</th>
                <th className="text-left px-4 py-3 font-medium">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((s) => (
                <tr key={s.id} className="border-b hover:bg-[var(--esl-bg-hover)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {s.shop.logo ? (
                        <img src={s.shop.logo} alt="" className="w-8 h-8 rounded" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-[var(--esl-bg-muted)] flex items-center justify-center text-sm">🏪</div>
                      )}
                      <span className="font-medium">{s.shop.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`https://${s.subdomain}.eseller.mn`} target="_blank" rel="noreferrer"
                      className="text-blue-600 flex items-center gap-1 text-xs">
                      {s.subdomain}.eseller.mn <ExternalLink className="w-3 h-3" />
                    </a>
                    {s.customDomain && (
                      <div className="text-xs text-[var(--esl-text-muted)] mt-0.5">{s.customDomain}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={s.plan}
                      onChange={(e) => updatePlan(s.id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded ${PLAN_COLORS[s.plan] || ''}`}
                    >
                      <option value="STARTER">Starter</option>
                      <option value="BUSINESS">Business</option>
                      <option value="CORPORATE">Corporate</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {s.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--esl-text-secondary)] text-xs">
                    {new Date(s.createdAt).toLocaleDateString('mn-MN')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(s.id, s.isActive)}
                      className={`text-xs font-medium ${s.isActive ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {s.isActive ? 'Хаах' : 'Идэвхжүүлэх'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
