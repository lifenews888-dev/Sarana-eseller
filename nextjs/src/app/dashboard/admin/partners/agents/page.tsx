'use client';

import { useState, useEffect } from 'react';
import { Users, Search, CheckCircle, XCircle, Shield } from 'lucide-react';

interface Agent {
  id: string;
  partnerId: string;
  userId: string;
  agentCode: string;
  displayName: string;
  licenseNo: string | null;
  isVerified: boolean;
  isActive: boolean;
  tier: string;
  totalListings: number;
  totalSales: number;
  totalEarned: number;
  joinedAt: string;
}

const TIER_COLORS: Record<string, { bg: string; text: string }> = {
  JUNIOR: { bg: 'rgba(148,163,184,0.15)', text: '#94A3B8' },
  SENIOR: { bg: 'rgba(59,130,246,0.15)', text: '#3B82F6' },
  EXPERT: { bg: 'rgba(168,85,247,0.15)', text: '#A855F7' },
  MASTER: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
};

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/admin/partners/agents', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(d => setAgents(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = agents.filter(a =>
    a.displayName.toLowerCase().includes(search.toLowerCase()) ||
    a.agentCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--esl-text)] flex items-center gap-2">
            <Users className="w-6 h-6" /> Агентууд
          </h1>
          <p className="text-sm text-[var(--esl-text-secondary)] mt-1">
            Нийт {agents.length} агент
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--esl-text-disabled)]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Агент хайх..."
          className="w-full pl-10 pr-4 py-2 bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text)]"
        />
      </div>

      {/* Table */}
      <div className="bg-[var(--esl-bg-section)] rounded-xl border border-[var(--esl-border)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[var(--esl-text-secondary)]">Ачааллаж байна...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-[var(--esl-text-secondary)]">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>Агент олдсонгүй</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--esl-border)] text-left text-[var(--esl-text-secondary)]">
                <th className="px-4 py-3">Агент</th>
                <th className="px-4 py-3">Код</th>
                <th className="px-4 py-3">Түвшин</th>
                <th className="px-4 py-3">Зарууд</th>
                <th className="px-4 py-3">Борлуулалт</th>
                <th className="px-4 py-3">Орлого</th>
                <th className="px-4 py-3">Статус</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const tier = TIER_COLORS[a.tier] || TIER_COLORS.JUNIOR;
                return (
                  <tr key={a.id} className="border-b border-[var(--esl-border)] hover:bg-[var(--esl-bg-hover)]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--esl-text)]">{a.displayName}</div>
                      {a.licenseNo && <div className="text-xs text-[var(--esl-text-secondary)]">#{a.licenseNo}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--esl-text)]">{a.agentCode}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs rounded-full font-medium" style={{ background: tier.bg, color: tier.text }}>
                        {a.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--esl-text)]">{a.totalListings}</td>
                    <td className="px-4 py-3 text-[var(--esl-text)]">{a.totalSales}</td>
                    <td className="px-4 py-3 text-[var(--esl-text)] font-medium">{a.totalEarned.toLocaleString()}₮</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {a.isVerified && (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                            <Shield size={10} /> Баталгаажсан
                          </span>
                        )}
                        <span className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${a.isActive ? 'bg-blue-100 text-blue-700' : 'bg-[var(--esl-bg-muted)] text-[var(--esl-text-secondary)]'}`}>
                          {a.isActive ? <CheckCircle size={10} /> : <XCircle size={10} />}
                          {a.isActive ? 'Идэвхтэй' : 'Зогссон'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
