'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Send, MessageCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface Conv {
  id: string;
  shopId: string;
  customerName: string;
  productName?: string | null;
  lastMessage?: string | null;
  lastAt: string;
  unreadCount: number;
}

interface Msg {
  id: string;
  senderId: string;
  senderRole: string;
  text?: string | null;
  imageUrl?: string | null;
  createdAt: string;
}

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function BuyerChatInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const prefId = searchParams.get('c');

  const [convs, setConvs] = useState<Conv[]>([]);
  const [active, setActive] = useState<Conv | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeIdRef.current = active?.id ?? null;
  }, [active?.id]);

  const loadConvs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/chat/conversations?mine=1', {
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || 'Чатыг ачаалж чадсангүй');
        if (!silent) setConvs([]);
        return;
      }
      const list: Conv[] = Array.isArray(data) ? data : data?.data || [];
      setConvs(list);
      setError(null);
      setActive((prev) => {
        if (prefId) {
          const fromQuery = list.find((c) => c.id === prefId);
          if (fromQuery) return fromQuery;
        }
        if (prev) {
          const still = list.find((c) => c.id === prev.id);
          if (still) return still;
        }
        return list[0] ?? null;
      });
    } catch {
      setError('Сүлжээний алдаа');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [prefId]);

  useEffect(() => {
    void loadConvs(false);
    const i = setInterval(() => void loadConvs(true), 5000);
    return () => clearInterval(i);
  }, [loadConvs]);

  const loadMsgs = useCallback(async (convId: string, silent = false) => {
    try {
      const res = await fetch(`/api/chat/conversations/${convId}/messages`, {
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => null);
      if (activeIdRef.current !== convId) return;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];
      setMsgs(list);
    } catch {
      if (!silent && activeIdRef.current === convId) setMsgs([]);
    }
  }, []);

  useEffect(() => {
    if (!active) {
      setMsgs([]);
      return;
    }
    void loadMsgs(active.id, false);
    const i = setInterval(() => void loadMsgs(active.id, true), 3000);
    return () => clearInterval(i);
  }, [active?.id, loadMsgs]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const sendMsg = async () => {
    if (!input.trim() || !active || sending) return;
    setSending(true);
    const text = input.trim();
    setInput('');

    const tempId = 'temp-' + Date.now();
    setMsgs((prev) => [
      ...prev,
      {
        id: tempId,
        senderId: (user as { id?: string })?.id || 'me',
        senderRole: 'customer',
        text,
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch(`/api/chat/conversations/${active.id}/messages`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) {
        setMsgs((prev) => prev.filter((m) => m.id !== tempId));
        setInput(text);
        const err = await res.json().catch(() => ({}));
        setError(err?.error || 'Илгээж чадсангүй');
      } else {
        void loadMsgs(active.id, true);
        void loadConvs(true);
      }
    } catch {
      setMsgs((prev) => prev.filter((m) => m.id !== tempId));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const myId = (user as { id?: string; _id?: string })?.id || (user as { _id?: string })?._id;
  const filtered = search
    ? convs.filter(
        (c) =>
          (c.productName || '').toLowerCase().includes(search.toLowerCase()) ||
          (c.lastMessage || '').toLowerCase().includes(search.toLowerCase()),
      )
    : convs;

  return (
    <div className="flex h-[calc(100vh-4rem)]" style={{ background: 'var(--esl-bg-page)' }}>
      <div
        className="flex w-[300px] shrink-0 flex-col border-r"
        style={{ borderColor: 'var(--esl-border)', background: 'var(--esl-bg-card)' }}
      >
        <div className="border-b p-3" style={{ borderColor: 'var(--esl-border)' }}>
          <h2
            className="mb-2 flex items-center gap-2 text-sm font-bold"
            style={{ color: 'var(--esl-text-primary)' }}
          >
            <MessageCircle className="h-4 w-4" style={{ color: '#E8242C' }} /> Миний чат
          </h2>
          <div className="relative">
            <Search
              className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
              style={{ color: 'var(--esl-text-muted)' }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Хайх..."
              className="w-full rounded-lg py-2 pl-8 pr-3 text-xs"
              style={{
                background: 'var(--esl-bg-page)',
                border: '1px solid var(--esl-border)',
                color: 'var(--esl-text-primary)',
              }}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="mx-auto h-5 w-5 animate-spin" style={{ color: '#E8242C' }} />
            </div>
          ) : error && filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-red-400">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs" style={{ color: 'var(--esl-text-muted)' }}>
              Чат байхгүй. Барааны хуудаснаас «Борлуулагчтай чатлах» дарж эхлүүлнэ үү.
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActive(c)}
                className="w-full cursor-pointer px-3 py-3 text-left transition-colors"
                style={{
                  background: active?.id === c.id ? 'var(--esl-bg-section)' : 'transparent',
                  borderBottom: '1px solid var(--esl-border)',
                }}
              >
                <div className="mb-0.5 flex items-center justify-between">
                  <span
                    className="truncate text-xs font-bold"
                    style={{ color: 'var(--esl-text-primary)' }}
                  >
                    {c.productName || 'Дэлгүүр'}
                  </span>
                  {c.unreadCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E8242C] text-[10px] font-bold text-white">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                <p className="truncate text-[11px]" style={{ color: 'var(--esl-text-muted)' }}>
                  {c.lastMessage || '...'}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        {!active ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <MessageCircle
                className="mx-auto mb-3 h-12 w-12"
                style={{ color: 'var(--esl-text-muted)' }}
              />
              <p className="text-sm" style={{ color: 'var(--esl-text-muted)' }}>
                Чат сонгоно уу
              </p>
            </div>
          </div>
        ) : (
          <>
            <div
              className="flex items-center gap-3 border-b px-4 py-3"
              style={{ borderColor: 'var(--esl-border)', background: 'var(--esl-bg-card)' }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: '#E8242C' }}
              >
                {(active.productName || 'Д')[0]}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--esl-text-primary)' }}>
                  {active.productName || 'Дэлгүүрийн чат'}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--esl-text-muted)' }}>
                  Борлуулагчтай шууд чат
                </p>
              </div>
            </div>
            <div
              className="flex-1 space-y-2 overflow-y-auto p-4"
              style={{ background: 'var(--esl-bg-page)' }}
            >
              {msgs.map((m) => {
                const isMe =
                  m.senderRole === 'customer' ||
                  m.senderId === myId ||
                  String(m.id).startsWith('temp-');
                return (
                  <div
                    key={m.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className="max-w-[70%] rounded-xl px-3 py-2 text-sm"
                      style={{
                        background: isMe ? '#E8242C' : 'var(--esl-bg-card)',
                        color: isMe ? '#fff' : 'var(--esl-text-primary)',
                        border: isMe ? 'none' : '1px solid var(--esl-border)',
                      }}
                    >
                      {m.text}
                      {m.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.imageUrl}
                          alt=""
                          className="mt-1 max-w-full rounded-lg"
                          style={{ maxHeight: 200 }}
                        />
                      )}
                      <p className="mt-1 text-[9px]" style={{ opacity: 0.6 }}>
                        {new Date(m.createdAt).toLocaleTimeString('mn', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
            <div
              className="flex gap-2 border-t p-3"
              style={{ borderColor: 'var(--esl-border)', background: 'var(--esl-bg-card)' }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void sendMsg()}
                placeholder="Мессеж бичих..."
                className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                style={{
                  background: 'var(--esl-bg-page)',
                  border: '1px solid var(--esl-border)',
                  color: 'var(--esl-text-primary)',
                }}
              />
              <button
                type="button"
                onClick={() => void sendMsg()}
                disabled={sending || !input.trim()}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border-none text-white"
                style={{ background: input.trim() ? '#E8242C' : 'var(--esl-border)' }}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function BuyerChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#E8242C]" />
        </div>
      }
    >
      <BuyerChatInner />
    </Suspense>
  );
}
