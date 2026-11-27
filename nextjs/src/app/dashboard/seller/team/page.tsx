'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Mail, Shield, Loader2, X, Clock } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/enterprise-permissions';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface Member {
  id: string;
  role: string;
  createdAt: string;
  user: { id: string; name: string; email: string; avatar: string | null };
}

interface Invite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
}

const ROLES = ['MANAGER', 'WAREHOUSE', 'MARKETER', 'ACCOUNTANT'] as const;

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('MANAGER');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await fetch('/api/enterprise/invite', { headers: authHeaders() });
      const data = await res.json();
      setMembers(data.data?.members || []);
      setInvites(data.data?.invites || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const invite = async () => {
    if (!email) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/enterprise/invite', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowInvite(false);
        setEmail('');
        load();
      } else {
        setError(data.error || 'Алдаа');
      }
    } catch { setError('Сүлжээний алдаа'); }
    setSending(false);
  };

  const removeMember = async (memberId: string) => {
    if (!confirm('Ажилтныг хасах уу?')) return;
    await fetch('/api/enterprise/invite', {
      method: 'DELETE',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    });
    load();
  };

  const cancelInvite = async (inviteId: string) => {
    await fetch('/api/enterprise/invite', {
      method: 'DELETE',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteId }),
    });
    load();
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-900" />
          <h1 className="text-2xl font-bold">Баг удирдлага</h1>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Урих
        </button>
      </div>

      {/* Members */}
      <div className="bg-[var(--esl-bg-card)] rounded-xl border divide-y">
        {loading ? (
          <div className="p-8 text-center text-[var(--esl-text-muted)]">Ачааллаж байна...</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-[var(--esl-text-muted)]">Ажилтан байхгүй</div>
        ) : (
          members.map((m) => (
            <div key={m.id} className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-full bg-[var(--esl-bg-muted)] flex items-center justify-center text-lg font-bold text-[var(--esl-text-secondary)]">
                {m.user.name?.[0] || '?'}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{m.user.name}</p>
                <p className="text-xs text-[var(--esl-text-muted)]">{m.user.email}</p>
              </div>
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {ROLE_LABELS[m.role as keyof typeof ROLE_LABELS] || m.role}
              </span>
              {m.role !== 'OWNER' && (
                <button onClick={() => removeMember(m.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-medium text-[var(--esl-text-secondary)] mb-2">Хүлээгдэж буй урилга</h2>
          <div className="bg-[var(--esl-bg-card)] rounded-xl border divide-y">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 p-4">
                <Mail className="w-5 h-5 text-[var(--esl-text-muted)]" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{inv.email}</p>
                  <p className="text-xs text-[var(--esl-text-muted)] flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(inv.expiresAt).toLocaleDateString('mn-MN')} хүртэл
                  </p>
                </div>
                <span className="text-xs text-[var(--esl-text-secondary)]">{ROLE_LABELS[inv.role as keyof typeof ROLE_LABELS] || inv.role}</span>
                <button onClick={() => cancelInvite(inv.id)} className="text-[var(--esl-text-muted)] hover:text-red-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowInvite(false)}>
          <div className="bg-[var(--esl-bg-card)] rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Ажилтан урих</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ажилтан@example.com"
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Эрх</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button onClick={invite} disabled={sending || !email}
                className="w-full bg-blue-900 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Урилга илгээх
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
