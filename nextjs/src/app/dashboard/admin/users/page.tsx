'use client';

import { useState, useEffect } from 'react';
import { Search, Shield, Ban, Users } from 'lucide-react';

interface UserRow {
  id: string; name: string; email: string; role: string;
  phone: string | null; isActive: boolean; createdAt: string;
}

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  buyer: { label: 'Худалдан авагч', color: '#3B82F6' },
  seller: { label: 'Дэлгүүр эзэн', color: '#22C55E' },
  affiliate: { label: 'Борлуулагч', color: '#F59E0B' },
  delivery: { label: 'Жолооч', color: '#06B6D4' },
  admin: { label: 'Админ', color: '#EF4444' },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [breakdown, setBreakdown] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  const fetchUsers = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({ page: String(page) });
    if (roleFilter !== 'all') params.set('role', roleFilter);
    if (search) params.set('q', search);
    try {
      const res = await fetch(`/api/admin/users?${params}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = await res.json();
      if (data.users) setUsers(data.users);
      if (data.breakdown) setBreakdown(data.breakdown);
      if (data.total) setTotal(data.total);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    const deferred = window.setTimeout(() => { fetchUsers(); }, 0);
    return () => window.clearTimeout(deferred);
  }, [roleFilter, search, page]);
  useEffect(() => {
    const deferred = window.setTimeout(() => { setPage(1); }, 0);
    return () => window.clearTimeout(deferred);
  }, [roleFilter, search]);

  const updateUser = async (userId: string, updates: Record<string, unknown>) => {
    const token = localStorage.getItem('token');
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ userId, ...updates }),
    });
    fetchUsers();
  };

  return (
    <div>
      <div className="bg-dash-sidebar border-b border-dash-border px-8 py-4">
        <h1 className="text-white text-lg font-black flex items-center gap-2"><Users className="w-5 h-5" /> Хэрэглэгч удирдлага</h1>
        <p className="text-white/35 text-xs mt-0.5">Role, block, нууц үг удирдлага</p>
      </div>

      <div className="p-8">
        {/* Role breakdown */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
            <button key={key} onClick={() => setRoleFilter(roleFilter === key ? 'all' : key)}
              className={`bg-dash-card border rounded-xl p-4 text-left cursor-pointer transition ${roleFilter === key ? 'border-dash-accent' : 'border-dash-border'}`}>
              <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{cfg.label}</div>
              <div className="text-xl font-black" style={{ color: cfg.color }}>{breakdown[key] || 0}</div>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Хэрэглэгч хайх..."
            className="w-full pl-10 pr-4 py-2.5 bg-dash-card border border-dash-border rounded-xl text-sm text-white outline-none focus:border-dash-accent" />
        </div>

        {/* Table */}
        <div className="bg-dash-card border border-dash-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[.03]">
                {['Нэр', 'Имэйл', 'Үүрэг', 'Утас', 'Бүртгэл', 'Статус', 'Үйлдэл'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-bold text-white/40 uppercase tracking-wider border-b border-dash-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-white/30">Ачааллаж байна...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-white/30">Хэрэглэгч олдсонгүй</td></tr>
              ) : users.map(u => {
                const rc = ROLE_CONFIG[u.role] || { label: u.role, color: '#888' };
                return (
                  <tr key={u.id} className="border-b border-white/[.04] hover:bg-white/[.02]">
                    <td className="px-5 py-3 text-white font-semibold">{u.name}</td>
                    <td className="px-5 py-3 text-white/50 text-xs">{u.email}</td>
                    <td className="px-5 py-3">
                      <select value={u.role} onChange={e => updateUser(u.id, { role: e.target.value })}
                        className="bg-dash-elevated text-white border border-dash-border rounded-lg px-2 py-1 text-xs outline-none cursor-pointer"
                        style={{ color: rc.color }}>
                        {Object.entries(ROLE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-white/40 text-xs">{u.phone || '—'}</td>
                    <td className="px-5 py-3 text-white/30 text-xs">{new Date(u.createdAt).toLocaleDateString('mn-MN')}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${u.isActive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                        {u.isActive ? 'Идэвхтэй' : 'Блоклогдсон'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => updateUser(u.id, { isActive: !u.isActive })}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border-none cursor-pointer ${
                          u.isActive ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                        }`}>
                        {u.isActive ? <><Ban className="w-3 h-3" /> Блок</> : <><Shield className="w-3 h-3" /> Нээх</>}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-2">
            <span className="text-xs text-white/30">Нийт {total} хэрэглэгч · Хуудас {page}/{totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1.5 bg-dash-card border border-dash-border rounded-lg text-xs text-white/60 disabled:opacity-30 cursor-pointer disabled:cursor-default">
                ← Өмнөх
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="px-3 py-1.5 bg-dash-card border border-dash-border rounded-lg text-xs text-white/60 disabled:opacity-30 cursor-pointer disabled:cursor-default">
                Дараах →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
