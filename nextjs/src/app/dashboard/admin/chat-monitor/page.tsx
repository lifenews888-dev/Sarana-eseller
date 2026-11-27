'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Search, MessageCircle, Shield, AlertTriangle, Ban, Eye,
  Download, ExternalLink, ToggleLeft, ToggleRight, RefreshCw,
} from 'lucide-react';

interface ChatUser {
  id: string;
  name: string;
  email?: string;
  role: string;
  avatar?: string;
}

interface ChatEntry {
  id: string;
  shopId: string;
  customer: ChatUser;
  lastMessage: string | null;
  lastAt: string | null;
  status: string;
  unreadCount: number;
  createdAt: string;
  context?: string;
}

export default function ChatMonitorPage() {
  const [chats, setChats] = useState<ChatEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ChatEntry | null>(null);
  // Spam шүүлтийн тохиргоо — серверт хадгалагдаж, зарын чатын мессеж бүрд мөрдөгдөнө
  const [mod, setMod] = useState<{ autoBlock: boolean; phoneFilter: boolean; linkFilter: boolean; repeatFilter: boolean } | null>(null);
  const [modSaving, setModSaving] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [chatType, setChatType] = useState<'shop' | 'listing'>('listing');
  const [thread, setThread] = useState<{ id: string; text: string; createdAt: string; side: 'buyer' | 'seller'; senderName: string }[] | null>(null);
  const [threadFeedId, setThreadFeedId] = useState<string | null>(null);

  // Чат сонгоход мессежүүдийг (зөвхөн унших) ачаална
  const openChat = async (chat: ChatEntry) => {
    setSelected(chat);
    setThread(null);
    setThreadFeedId(null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/chats/${chat.id}?type=${chatType}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setThread(Array.isArray(data.messages) ? data.messages : []);
      setThreadFeedId(data.feedItemId || null);
    } catch {
      setThread([]);
    }
  };

  const authHdr = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  };

  useEffect(() => {
    fetch('/api/admin/chat-moderation', { headers: authHdr() })
      .then((r) => r.json())
      .then((d) => { if (d && typeof d.autoBlock === 'boolean') setMod(d); })
      .catch(() => null);
  }, []);

  const toggleMod = async (key: 'autoBlock' | 'phoneFilter' | 'linkFilter' | 'repeatFilter') => {
    if (!mod || modSaving) return;
    const next = { ...mod, [key]: !mod[key] };
    setMod(next);
    setModSaving(true);
    try {
      const r = await fetch('/api/admin/chat-moderation', { method: 'PUT', headers: authHdr(), body: JSON.stringify(next) });
      const d = await r.json();
      if (r.ok && typeof d.autoBlock === 'boolean') setMod(d); else setMod(mod);
    } catch { setMod(mod); }
    setModSaving(false);
  };

  const setBlocked = async (chat: ChatEntry, block: boolean) => {
    setBlockBusy(true);
    try {
      const r = await fetch(`/api/admin/chats/${chat.id}`, {
        method: 'PATCH', headers: authHdr(), body: JSON.stringify({ type: chatType, action: block ? 'block' : 'unblock' }),
      });
      if (r.ok) {
        const status = block ? 'blocked' : 'active';
        setChats((cs) => cs.map((c) => (c.id === chat.id ? { ...c, status } : c)));
        setSelected((c) => (c && c.id === chat.id ? { ...c, status } : c));
      }
    } finally {
      setBlockBusy(false);
    }
  };

  const fetchChats = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/chats?page=${page}${chatType === 'listing' ? '&type=listing' : ''}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setChats(data.chats || []);
      setTotal(data.total || 0);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchChats(); }, [page, chatType]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = chats.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.customer?.name || '').toLowerCase().includes(q) ||
      (c.customer?.email || '').toLowerCase().includes(q) ||
      (c.lastMessage || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--esl-text-primary)]">Чат хяналтын самбар</h1>
          <p className="text-sm text-[var(--esl-text-secondary)]">Админ · Бүх харилцан яриа, spam шүүлт, лог</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchChats} className="flex items-center gap-1.5 px-4 py-2 bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl text-xs font-semibold text-[var(--esl-text-secondary)] hover:bg-[var(--esl-bg-section)] cursor-pointer transition">
            <RefreshCw className="w-3.5 h-3.5" /> Шинэчлэх
          </button>
          <button onClick={() => document.getElementById('spam-rules')?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-100 cursor-pointer transition border-none">
            <Shield className="w-3.5 h-3.5" /> Spam дүрэм
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Нийт чат', value: String(total), color: 'text-white' },
          { label: 'Энэ хуудас', value: String(filtered.length), color: 'text-green-400' },
          { label: 'Идэвхтэй (24 цаг)', value: String(chats.filter(c => c.lastAt && new Date(c.lastAt) > new Date(Date.now() - 86400000)).length), color: 'text-blue-400' },
          { label: 'Хуудас', value: `${page}/${Math.ceil(total / 20) || 1}`, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#1A1A2E] rounded-xl p-4 text-white">
            <div className="text-[10px] text-white/50 mb-1">{s.label}</div>
            <div className={cn('text-xl font-black', s.color)}>{loading ? '—' : s.value}</div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-1 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-1 w-fit">
            {([['listing', 'Зарын чат'], ['shop', 'Дэлгүүрийн чат']] as const).map(([k, label]) => (
              <button key={k} type="button" onClick={() => { setSelected(null); setThread(null); setPage(1); setChatType(k); }}
                className={cn('rounded-lg px-3 py-1.5 text-xs font-bold border-none cursor-pointer', chatType === k ? 'bg-[#E8242C] text-white' : 'bg-transparent text-[var(--esl-text-secondary)]')}>
                {label}
              </button>
            ))}
          </div>
          <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--esl-text-muted)]" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Хэрэглэгч, мессеж хайх..."
                className="w-full pl-10 pr-4 py-2 border border-[var(--esl-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--esl-bg-card)]" />
            </div>
          </div>

          <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl overflow-hidden">
            {loading ? (
              <div className="text-center py-12 text-[var(--esl-text-muted)] text-sm">Ачааллаж байна...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-10 h-10 text-[var(--esl-text-muted)] mx-auto mb-3 opacity-30" />
                <p className="text-sm text-[var(--esl-text-muted)]">Чат харилцан яриа байхгүй байна</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] text-[var(--esl-text-secondary)] uppercase tracking-wider border-b border-[var(--esl-border)] bg-[var(--esl-bg-section)]/50">
                    <th className="px-4 py-2.5 font-medium">Хэрэглэгч</th>
                    <th className="px-4 py-2.5 font-medium">Сүүлийн мессеж</th>
                    <th className="px-4 py-2.5 font-medium">Статус</th>
                    <th className="px-4 py-2.5 font-medium">Огноо</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--esl-border)]">
                  {filtered.map(chat => {
                    const isActive = selected?.id === chat.id;
                    return (
                      <tr key={chat.id} onClick={() => openChat(chat)}
                        className={cn('cursor-pointer transition', isActive ? 'bg-indigo-500/10' : 'hover:bg-[var(--esl-bg-section)]/50')}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                              {(chat.customer?.name || '?').charAt(0)}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-[var(--esl-text-primary)]">{chat.customer?.name || 'Unknown'}</div>
                              <div className="text-[10px] text-[var(--esl-text-muted)]">{chat.customer?.email || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-[var(--esl-text-primary)] truncate max-w-[200px]">
                            {chat.lastMessage || '(мессеж байхгүй)'}
                          </div>
                          {chat.context && <div className="text-[10px] text-[var(--esl-text-muted)] truncate max-w-[220px]">{chat.context}</div>}
                          {chat.unreadCount > 0 && (
                            <span className="text-[9px] font-bold bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                              {chat.unreadCount} уншаагүй
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-lg',
                            chat.status === 'active' ? 'bg-green-500/15 text-green-400' :
                            chat.status === 'blocked' ? 'bg-red-500/15 text-red-400' :
                            'bg-gray-500/15 text-gray-400'
                          )}>{chat.status === 'active' ? 'Идэвхтэй' : chat.status === 'blocked' ? 'Блок' : 'Архив'}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--esl-text-muted)]">
                          {chat.lastAt ? new Date(chat.lastAt).toLocaleDateString('mn-MN') : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {total > 20 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--esl-border)] text-xs text-[var(--esl-text-secondary)]">
                <span>Нийт {total} чат</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                    className="px-3 py-1 rounded border border-[var(--esl-border)] bg-[var(--esl-bg-card)] text-xs cursor-pointer disabled:opacity-30">←</button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)}
                    className="px-3 py-1 rounded border border-[var(--esl-border)] bg-[var(--esl-bg-card)] text-xs cursor-pointer disabled:opacity-30">→</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {selected ? (
            <>
              <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--esl-text-primary)]">Чат дэлгэрэнгүй</h3>
                  <button onClick={() => setSelected(null)} className="text-xs text-[var(--esl-text-muted)] hover:text-[var(--esl-text-secondary)] bg-transparent border-none cursor-pointer">✕</button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
                    {(selected.customer?.name || '?').charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--esl-text-primary)]">{selected.customer?.name}</div>
                    <div className="text-[10px] text-[var(--esl-text-muted)]">{selected.customer?.email || selected.customer?.role}</div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  {[
                    { label: 'Чат ID', value: selected.id.slice(-8) },
                    { label: 'Эхэлсэн', value: new Date(selected.createdAt).toLocaleDateString('mn-MN') },
                    { label: 'Сүүлийн идэвх', value: selected.lastAt ? new Date(selected.lastAt).toLocaleDateString('mn-MN') : '—' },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between">
                      <span className="text-[var(--esl-text-muted)]">{r.label}</span>
                      <span className="text-[var(--esl-text-primary)] font-medium">{r.value}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={blockBusy}
                  onClick={() => setBlocked(selected, selected.status !== 'blocked')}
                  className={cn('w-full flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold border cursor-pointer disabled:opacity-50',
                    selected.status === 'blocked' ? 'border-green-500/40 bg-green-500/10 text-green-400' : 'border-red-500/40 bg-red-500/10 text-red-400')}
                >
                  <Ban className="w-3.5 h-3.5" />
                  {selected.status === 'blocked' ? 'Блок цуцлах' : 'Чатыг блоклох'}
                </button>
                {selected.status === 'blocked' && chatType === 'listing' && (
                  <p className="text-[10px] text-[var(--esl-text-muted)]">Блоклосон чатад аль ч тал бичих боломжгүй. Зочин бол тэр дугаараас шинэ чат эхлүүлэх боломжгүй.</p>
                )}

                {threadFeedId && (
                  <a href={`/feed/${threadFeedId}`} target="_blank" rel="noreferrer" className="block text-xs font-semibold text-[#E8242C] no-underline">
                    <Eye className="w-3 h-3 inline mr-1" /> Зарыг харах
                  </a>
                )}

                {/* Мессежүүд (админ зөвхөн уншина — хариуг зарын эзэн /messages-ээс бичнэ) */}
                <div className="max-h-[360px] overflow-y-auto space-y-2 rounded-lg bg-[var(--esl-bg-section)] p-3">
                  {thread === null ? (
                    <p className="text-xs text-[var(--esl-text-muted)]">Ачаалж байна...</p>
                  ) : thread.length === 0 ? (
                    <p className="text-xs text-[var(--esl-text-muted)]">Мессеж алга</p>
                  ) : (
                    thread.map((m) => (
                      <div key={m.id} className={cn('flex', m.side === 'seller' ? 'justify-end' : 'justify-start')}>
                        <div className={cn('max-w-[85%] rounded-xl px-3 py-2 text-xs', m.side === 'seller' ? 'bg-indigo-500/20 text-[var(--esl-text-primary)]' : 'bg-[var(--esl-bg-card)] text-[var(--esl-text-primary)]')}>
                          <div className="mb-0.5 text-[10px] font-bold text-[var(--esl-text-muted)]">{m.senderName} · {new Date(m.createdAt).toLocaleString('mn-MN')}</div>
                          <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </>
          ) : (
            <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl p-8 text-center">
              <MessageCircle className="w-10 h-10 text-[var(--esl-text-muted)] mx-auto mb-3" />
              <p className="text-sm font-semibold text-[var(--esl-text-muted)]">Чат сонгоно уу</p>
              <p className="text-xs text-[var(--esl-text-muted)] mt-1">Чат сонгоход мессеж харагдана</p>
            </div>
          )}

          {/* Spam автомат шүүлт — зарын чатын бүх мессежид мөрдөгдөнө */}
          <div id="spam-rules" className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-[var(--esl-text-primary)]">Spam автомат шүүлт <span className="font-normal text-[var(--esl-text-muted)]">(зарын чат)</span></h4>
            {!mod ? (
              <p className="text-xs text-[var(--esl-text-muted)]">Ачаалж байна...</p>
            ) : (
              ([
                { key: 'autoBlock', label: 'Spam автомат блок', hint: '3 удаа шүүлтэд баригдвал чатыг хаана' },
                { key: 'phoneFilter', label: 'Утасны дугаар шүүлт', hint: 'Мессеж дэх утасны дугаарыг хориглоно' },
                { key: 'linkFilter', label: 'Гадаад холбоос шүүлт', hint: 'Вэб холбоос илгээхийг хориглоно' },
                { key: 'repeatFilter', label: 'Хэт давтамжтай мессеж', hint: '1 минутад 8-аас олныг хориглоно' },
              ] as const).map(t => (
                <div key={t.key} className="flex items-center justify-between gap-3">
                  <div>
                    <span className="block text-xs text-[var(--esl-text-secondary)]">{t.label}</span>
                    <span className="block text-[10px] text-[var(--esl-text-muted)]">{t.hint}</span>
                  </div>
                  <button onClick={() => toggleMod(t.key)} disabled={modSaving} className="bg-transparent border-none cursor-pointer p-0 disabled:opacity-50" aria-label={t.label}>
                    {mod[t.key] ? <ToggleRight className="w-6 h-6 text-indigo-600" /> : <ToggleLeft className="w-6 h-6 text-[var(--esl-text-muted)]" />}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
