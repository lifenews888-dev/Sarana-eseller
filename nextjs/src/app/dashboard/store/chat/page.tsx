'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Package, Send, ChevronLeft, Ban, Loader2, MessageCircle,
} from 'lucide-react';

/* ═══ Types ═══ */
interface Conv {
  id: string;
  customerName: string;
  lastMessage: string | null;
  lastAt: string;
  unreadCount: number;
  tag: string | null;
  orderNumber: string | null;
  productName: string | null;
  productPrice: number | null;
  customerId: string;
  status?: string;
}

interface Msg {
  id: string;
  senderId: string;
  senderRole: string;
  text: string | null;
  imageUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

interface CustomerStats {
  orderCount: number;
  totalSpent: number;
  phone: string | null;
}

/* ═══ Helpers ═══ */
function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
}

function getAvatarColor(name: string): [string, string] {
  const colors: [string, string][] = [
    ['#E6F1FB', '#0C447C'],
    ['#E1F5EE', '#085041'],
    ['#FBEAF0', '#72243E'],
    ['#EEEDFE', '#3C3489'],
    ['#FAEEDA', '#633806'],
    ['#FCEBEB', '#791F1F'],
  ];
  const idx = (name?.charCodeAt(0) || 0) % colors.length;
  return colors[idx];
}

function formatTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString('mn', { hour: '2-digit', minute: '2-digit' });
  if (diff < 172800000) return 'Өчигдөр';
  return d.toLocaleDateString('mn', { month: 'short', day: 'numeric' });
}

function formatPrice(n: number) {
  return n.toLocaleString('mn-MN') + '₮';
}

const QUICK_REPLIES = [
  'Таны захиалга баталгаажлаа. Удахгүй хүргэнэ.',
  'Бараа нөөцөд байна. Хэдэн ширхэг авах вэ?',
  'Уучлаарай, бараа түр дууссан байна.',
  'Хүргэлт 1–3 хоногт хийгдэнэ. Баярлалаа!',
];

/* ═══ Page ═══ */
export default function SellerChatPage() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [activeConv, setActiveConv] = useState<Conv | null>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const [listLoading, setListLoading] = useState(true);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const msgsEndRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    activeIdRef.current = activeConv?.id ?? null;
  }, [activeConv?.id]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  const fetchConvs = useCallback(async (silent = false) => {
    if (!silent) setListLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('filter', filter);
      if (debouncedSearch) params.set('search', debouncedSearch);

      const res = await fetch(`/api/seller/conversations?${params}`, {
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || 'Чатыг ачаалж чадсангүй');
        if (!silent) setConvs([]);
        return;
      }

      if (Array.isArray(data)) {
        setConvs(data);
        // Keep active selection if still present
        setActiveConv((prev) => {
          if (!prev) return data[0] ?? null;
          const still = data.find((c: Conv) => c.id === prev.id);
          return still ?? prev;
        });
      }
    } catch {
      setError('Сүлжээний алдаа');
    } finally {
      if (!silent) setListLoading(false);
    }
  }, [filter, debouncedSearch]);

  useEffect(() => {
    void fetchConvs(false);
    const interval = setInterval(() => void fetchConvs(true), 5000);
    return () => clearInterval(interval);
  }, [fetchConvs]);

  const loadMessages = useCallback(async (convId: string, silent = false) => {
    if (!silent) setMsgsLoading(true);
    try {
      const res = await fetch(`/api/seller/conversations/${convId}/messages`, {
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => null);
      if (activeIdRef.current !== convId) return;

      if (!res.ok) {
        if (!silent) setMsgs([]);
        return;
      }

      if (Array.isArray(data)) {
        setMsgs(data);
        // Clear unread locally
        setConvs((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c)),
        );
      } else {
        setMsgs([]);
      }
    } catch {
      if (activeIdRef.current === convId && !silent) setMsgs([]);
    } finally {
      if (activeIdRef.current === convId && !silent) setMsgsLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/seller/conversations/${convId}`, {
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => null);
      if (activeIdRef.current !== convId) return;
      if (res.ok && data?.customerStats) {
        setStats(data.customerStats as CustomerStats);
      } else {
        setStats(null);
      }
    } catch {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    if (!activeConv) {
      setMsgs([]);
      setStats(null);
      return;
    }
    setMsgs([]);
    void loadMessages(activeConv.id, false);
    void loadDetail(activeConv.id);
    const interval = setInterval(() => void loadMessages(activeConv.id, true), 3000);
    return () => clearInterval(interval);
  }, [activeConv?.id, loadMessages, loadDetail]);

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const selectConv = (conv: Conv) => {
    setActiveConv(conv);
    setMobileShowChat(true);
    setConvs((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c)),
    );
  };

  const sendMessage = useCallback(
    async (override?: string) => {
      const text = (override ?? input).trim();
      if (!text || !activeConv || sending) return;

      setSending(true);
      setInput('');

      const tempId = 'temp-' + Date.now();
      const tempMsg: Msg = {
        id: tempId,
        senderId: 'seller',
        senderRole: 'seller',
        text,
        imageUrl: null,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setMsgs((prev) => [...prev, tempMsg]);
      setConvs((prev) =>
        prev.map((c) =>
          c.id === activeConv.id
            ? { ...c, lastMessage: text, lastAt: new Date().toISOString() }
            : c,
        ),
      );

      try {
        const res = await fetch(
          `/api/seller/conversations/${activeConv.id}/messages`,
          {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ text }),
          },
        );
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setMsgs((prev) => prev.filter((m) => m.id !== tempId));
          setError(data?.error || 'Мессеж илгээж чадсангүй');
          setInput(text);
          return;
        }
        setMsgs((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  id: data.id,
                  senderId: data.senderId,
                  senderRole: data.senderRole,
                  text: data.text,
                  imageUrl: data.imageUrl,
                  isRead: data.isRead ?? false,
                  createdAt: data.createdAt,
                }
              : m,
          ),
        );
      } catch {
        setMsgs((prev) => prev.filter((m) => m.id !== tempId));
        setError('Сүлжээний алдаа');
        setInput(text);
      } finally {
        setSending(false);
      }
    },
    [input, activeConv, sending],
  );

  const blockConversation = async () => {
    if (!activeConv) return;
    if (!confirm('Энэ чатыг блоклох уу?')) return;
    try {
      const res = await fetch(`/api/seller/conversations/${activeConv.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: 'blocked' }),
      });
      if (res.ok) {
        setConvs((prev) => prev.filter((c) => c.id !== activeConv.id));
        setActiveConv(null);
        setMobileShowChat(false);
        setMsgs([]);
      }
    } catch {
      /* ignore */
    }
  };

  const totalUnread = convs.reduce((s, c) => s + (c.unreadCount || 0), 0);

  return (
    <div
      className="grid overflow-hidden rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-page)] lg:grid-cols-[minmax(260px,300px)_1fr_minmax(220px,260px)]"
      style={{
        gridTemplateColumns: '1fr',
        minHeight: 'calc(100vh - 64px)',
      }}
    >
        {/* ═══ LEFT: Conversation List ═══ */}
        <div
          className={`flex flex-col border-r border-[var(--esl-border)] bg-[var(--esl-bg-page)] ${
            mobileShowChat ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="flex items-center justify-between border-b border-[var(--esl-border)] px-4 py-3.5">
            <span className="text-sm font-semibold text-[var(--esl-text-primary)]">
              Дэлгүүрийн чат
            </span>
            {totalUnread > 0 && (
              <span className="rounded-full bg-[rgba(232,36,44,0.12)] px-2 py-0.5 text-[11px] font-semibold text-[#E8242C]">
                {totalUnread} шинэ
              </span>
            )}
          </div>

          <div className="relative m-3">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--esl-text-muted)]"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Хэрэглэгч, захиалга хайх..."
              className="w-full rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-card)] py-2 pl-8 pr-3 text-xs text-[var(--esl-text-primary)] outline-none focus:border-[#E8242C]"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 px-3 pb-2">
            {[
              { key: 'all', label: 'Бүгд' },
              { key: 'unread', label: 'Уншаагүй' },
              { key: 'order', label: 'Захиалга' },
              { key: 'question', label: 'Асуулт' },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] ${
                  filter === f.key
                    ? 'border-[rgba(232,36,44,0.35)] bg-[rgba(232,36,44,0.1)] text-[#E8242C]'
                    : 'border-[var(--esl-border)] bg-transparent text-[var(--esl-text-muted)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mx-3 mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-400">
              {error}
              <button
                type="button"
                className="ml-2 underline"
                onClick={() => void fetchConvs(false)}
              >
                Дахин
              </button>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto">
            {listLoading && convs.length === 0 ? (
              <div className="flex justify-center p-10">
                <Loader2 className="h-5 w-5 animate-spin text-[#E8242C]" />
              </div>
            ) : convs.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <MessageCircle className="mx-auto mb-3 h-10 w-10 text-[var(--esl-text-muted)] opacity-40" />
                <p className="text-sm font-medium text-[var(--esl-text-primary)]">
                  Чат байхгүй байна
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-[var(--esl-text-muted)]">
                  Худалдан авагч барааны хуудаснаас «Борлуулагчтай чатлах» дарвал энд харагдана.
                </p>
              </div>
            ) : (
              convs.map((conv) => {
                const [bg, tc] = getAvatarColor(conv.customerName);
                const isActive = activeConv?.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => selectConv(conv)}
                    className={`relative flex w-full cursor-pointer gap-2.5 border-b border-[var(--esl-border)]/60 px-3.5 py-2.5 text-left transition ${
                      isActive
                        ? 'border-l-2 border-l-[#E8242C] bg-[rgba(232,36,44,0.06)]'
                        : 'border-l-2 border-l-transparent hover:bg-[var(--esl-bg-section)]'
                    }`}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                      style={{ background: bg, color: tc }}
                    >
                      {getInitials(conv.customerName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-baseline justify-between gap-1">
                        <span
                          className={`truncate text-[13px] font-medium ${
                            isActive ? 'text-[#E8242C]' : 'text-[var(--esl-text-primary)]'
                          }`}
                        >
                          {conv.customerName}
                        </span>
                        <span className="shrink-0 text-[10px] text-[var(--esl-text-muted)]">
                          {formatTime(conv.lastAt)}
                        </span>
                      </div>
                      {conv.productName && (
                        <div className="truncate text-[10px] text-[#E8242C]/80">
                          {conv.productName}
                        </div>
                      )}
                      <div className="truncate text-[11px] text-[var(--esl-text-muted)]">
                        {conv.lastMessage || '...'}
                      </div>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="absolute bottom-2.5 right-3 min-w-4 rounded-full bg-[#E8242C] px-1 text-center text-[9px] font-bold text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ═══ MIDDLE: Chat Area ═══ */}
        <div
          className={`min-h-0 flex-col bg-[var(--esl-bg-page)] ${
            mobileShowChat ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {activeConv ? (
            <>
              <div className="flex items-center gap-2.5 border-b border-[var(--esl-border)] px-3 py-3">
                <button
                  type="button"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[var(--esl-text-muted)] lg:hidden"
                  onClick={() => setMobileShowChat(false)}
                  aria-label="Жагсаалт руу буцах"
                >
                  <ChevronLeft size={18} />
                </button>
                {(() => {
                  const [bg, tc] = getAvatarColor(activeConv.customerName);
                  return (
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold"
                      style={{ background: bg, color: tc }}
                    >
                      {getInitials(activeConv.customerName)}
                    </div>
                  );
                })()}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-[var(--esl-text-primary)]">
                    {activeConv.customerName}
                  </div>
                  <div className="text-[11px] text-[var(--esl-text-muted)]">
                    {activeConv.tag === 'order'
                      ? `Захиалга ${activeConv.orderNumber || ''}`
                      : 'Асуулт'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void blockConversation()}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[var(--esl-text-muted)] hover:bg-red-500/10 hover:text-red-400"
                  title="Блоклох"
                >
                  <Ban size={15} />
                </button>
              </div>

              {activeConv.productName && (
                <div className="m-3 flex items-center gap-2.5 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-3 py-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-section)]">
                    <Package size={18} className="text-[var(--esl-text-muted)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-[var(--esl-text-primary)]">
                      {activeConv.productName}
                    </div>
                    {activeConv.productPrice != null && (
                      <div className="text-sm font-semibold text-[#E8242C]">
                        {formatPrice(activeConv.productPrice)}
                      </div>
                    )}
                  </div>
                  {activeConv.orderNumber && (
                    <span className="shrink-0 rounded-md border border-[var(--esl-border)] px-2 py-1 text-[10px] text-[var(--esl-text-muted)]">
                      {activeConv.orderNumber}
                    </span>
                  )}
                </div>
              )}

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3.5 py-3">
                {msgsLoading && msgs.length === 0 ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="h-5 w-5 animate-spin text-[#E8242C]" />
                  </div>
                ) : msgs.length === 0 ? (
                  <p className="py-16 text-center text-xs text-[var(--esl-text-muted)]">
                    Мессеж байхгүй. Эхний хариугаа бичнэ үү.
                  </p>
                ) : (
                  msgs.map((msg) => {
                    const isMe = msg.senderRole === 'seller';
                    const [bg, tc] = isMe
                      ? (['#FCEBEB', '#A32D2D'] as [string, string])
                      : getAvatarColor(activeConv.customerName);
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <div
                          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                          style={{ background: bg, color: tc }}
                        >
                          {isMe ? 'Та' : getInitials(activeConv.customerName)}
                        </div>
                        <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                          {msg.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={msg.imageUrl}
                              alt=""
                              className="mb-1.5 max-h-40 max-w-full rounded-xl border border-[var(--esl-border)]"
                            />
                          )}
                          {msg.text && (
                            <div
                              className={`px-3 py-2 text-[13px] leading-relaxed ${
                                isMe
                                  ? 'rounded-[14px_4px_14px_14px] bg-[#E8242C] text-white'
                                  : 'rounded-[4px_14px_14px_14px] bg-[var(--esl-bg-card)] text-[var(--esl-text-primary)]'
                              }`}
                            >
                              {msg.text}
                            </div>
                          )}
                          <div
                            className={`mt-1 text-[10px] text-[var(--esl-text-muted)] ${
                              isMe ? 'text-right' : 'text-left'
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString('mn', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {isMe && (msg.isRead ? ' · ✓✓' : ' · ✓')}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={msgsEndRef} />
              </div>

              {msgs.length <= 2 && (
                <div className="flex flex-wrap gap-1.5 border-t border-[var(--esl-border)]/50 px-3 py-2">
                  {QUICK_REPLIES.map((q) => (
                    <button
                      key={q}
                      type="button"
                      disabled={sending}
                      onClick={() => void sendMessage(q)}
                      className="cursor-pointer rounded-full border border-[var(--esl-border)] bg-[var(--esl-bg-section)] px-2.5 py-1.5 text-[11px] text-[var(--esl-text-muted)] hover:border-[#E8242C]/50 disabled:opacity-50"
                    >
                      {q.length > 36 ? q.slice(0, 36) + '…' : q}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2 border-t border-[var(--esl-border)] p-3">
                <div className="flex flex-1 items-center gap-1.5 rounded-full border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-3 py-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void sendMessage();
                      }
                    }}
                    placeholder="Мессеж бичих..."
                    disabled={sending}
                    className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-[var(--esl-text-primary)] outline-none disabled:opacity-50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={!input.trim() || sending}
                  className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 text-white disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: input.trim() && !sending ? '#E8242C' : 'var(--esl-border)' }}
                  aria-label="Илгээх"
                >
                  {sending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <MessageCircle className="h-12 w-12 text-[var(--esl-text-muted)] opacity-30" />
              <p className="text-sm text-[var(--esl-text-muted)]">Чат сонгоно уу</p>
            </div>
          )}
        </div>

        {/* ═══ RIGHT: Info Panel ═══ */}
        <div className="hidden flex-col border-l border-[var(--esl-border)] bg-[var(--esl-bg-page)] lg:flex">
          {activeConv ? (
            <>
              <div className="border-b border-[var(--esl-border)] px-4 py-3.5">
                <span className="text-[13px] font-semibold text-[var(--esl-text-primary)]">
                  Дэлгэрэнгүй
                </span>
              </div>

              <div className="border-b border-[var(--esl-border)] px-4 py-3.5">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--esl-text-muted)]">
                  Хэрэглэгч
                </div>
                <div className="mb-3 flex items-center gap-2">
                  {(() => {
                    const [bg, tc] = getAvatarColor(activeConv.customerName);
                    return (
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold"
                        style={{ background: bg, color: tc }}
                      >
                        {getInitials(activeConv.customerName)}
                      </div>
                    );
                  })()}
                  <div>
                    <div className="text-[13px] font-medium text-[var(--esl-text-primary)]">
                      {activeConv.customerName}
                    </div>
                  </div>
                </div>
                {[
                  ['Нийт захиалга', stats ? String(stats.orderCount) : '—'],
                  [
                    'Зарцуулсан',
                    stats ? formatPrice(stats.totalSpent || 0) : '—',
                  ],
                  ['Утас', stats?.phone || '—'],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="mb-1.5 flex justify-between text-xs"
                  >
                    <span className="text-[var(--esl-text-muted)]">{k}</span>
                    <span className="font-medium text-[var(--esl-text-primary)]">{v}</span>
                  </div>
                ))}
              </div>

              {activeConv.orderNumber && (
                <div className="border-b border-[var(--esl-border)] px-4 py-3.5">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--esl-text-muted)]">
                    Захиалга {activeConv.orderNumber}
                  </div>
                  {[
                    ['Бараа', activeConv.productName || '—'],
                    [
                      'Дүн',
                      activeConv.productPrice != null
                        ? formatPrice(activeConv.productPrice)
                        : '—',
                    ],
                  ].map(([k, v]) => (
                    <div key={k} className="mb-1.5 flex justify-between text-xs">
                      <span className="text-[var(--esl-text-muted)]">{k}</span>
                      <span
                        className={`font-medium ${
                          k === 'Дүн' ? 'text-[#E8242C]' : 'text-[var(--esl-text-primary)]'
                        }`}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="px-4 py-3">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--esl-text-muted)]">
                  Хурдан хариу
                </div>
                {QUICK_REPLIES.map((text) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => setInput(text)}
                    className="mb-1.5 w-full cursor-pointer rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-2.5 py-2 text-left text-[11px] text-[var(--esl-text-muted)] transition hover:border-[#E8242C] hover:text-[#E8242C]"
                  >
                    {text.length > 48 ? text.slice(0, 48) + '…' : text}
                  </button>
                ))}
              </div>

              <div className="mt-auto border-t border-[var(--esl-border)] px-4 py-3">
                <button
                  type="button"
                  onClick={() => void blockConversation()}
                  className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 py-2 text-xs font-medium text-red-400"
                >
                  <Ban size={12} /> Блоклох
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-5 text-center text-xs text-[var(--esl-text-muted)]">
              Чат сонгоход дэлгэрэнгүй мэдээлэл харагдана
            </div>
          )}
        </div>
    </div>
  );
}
