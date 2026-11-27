'use client';

/**
 * Жижиг чатын цонх доторх "Зурвас" таб — зарын эзэнтэй харилцах.
 * Нэвтэрсэн хэрэглэгч: /api/listing-chats (Bearer токен).
 * Зочин: энэ төхөөрөмж дээр хадгалсан токенуудаар /api/listing-chats/guest/*.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, MessageCircle, SendHorizonal } from 'lucide-react';
import { readGuestChats } from '@/lib/guestChatClient';

const BRAND = '#E8242C';

export type MiniChatTarget = { id: string; guest: boolean };

type Row = {
  id: string;
  guest: boolean;
  title: string;
  otherName?: string;
  lastMessage?: string;
  lastAt?: string;
  unread: number;
  feedItemId?: string;
};

type Msg = { id: string; text: string; mine: boolean; createdAt: string };

function authHeaders(): Record<string, string> {
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return t ? { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` } : { 'Content-Type': 'application/json' };
}

function timeLabel(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('mn-MN');
}

export default function MiniInbox({ initial }: { initial?: MiniChatTarget | null }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [active, setActive] = useState<MiniChatTarget | null>(initial || null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [head, setHead] = useState<{ otherName: string; title: string; feedItemId?: string } | null>(null);
  const [missing, setMissing] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (initial) setActive(initial); }, [initial]);

  // Чатын жагсаалт
  const loadList = useCallback(async () => {
    const out: Row[] = [];
    if (localStorage.getItem('token')) {
      const b = await fetch('/api/listing-chats', { headers: authHeaders(), credentials: 'include', cache: 'no-store' })
        .then((r) => r.json()).catch(() => null);
      if (b?.success && Array.isArray(b.data)) {
        for (const c of b.data) {
          out.push({ id: c.id, guest: false, title: c.title, otherName: c.otherName, lastMessage: c.lastMessage, lastAt: c.lastAt, unread: c.unread || 0, feedItemId: c.feedItemId });
        }
      }
    }
    const guests = readGuestChats();
    if (guests.length) {
      const b = await fetch('/api/listing-chats/guest/unread', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chats: guests.map((g) => ({ chatId: g.chatId, token: g.token })) }),
      }).then((r) => r.json()).catch(() => null);
      const info = new Map<string, { lastMessage: string; lastAt: string; unread: number }>(
        (b?.data?.chats || []).map((c: { id: string; lastMessage: string; lastAt: string; unread: number }) => [c.id, c]),
      );
      for (const g of guests) {
        if (out.some((r) => r.id === g.chatId)) continue;
        const i = info.get(g.chatId);
        if (b?.success && !i) continue; // устсан/хүчингүй чат
        out.push({ id: g.chatId, guest: true, title: g.title || 'Зар', otherName: 'Зарын эзэн', lastMessage: i?.lastMessage, lastAt: i?.lastAt, unread: i?.unread || 0, feedItemId: g.feedItemId });
      }
    }
    out.sort((a, b) => (b.lastAt || '').localeCompare(a.lastAt || ''));
    setRows(out);
  }, []);

  useEffect(() => {
    if (active) return;
    void loadList();
    const t = window.setInterval(() => void loadList(), 15000);
    return () => window.clearInterval(t);
  }, [active, loadList]);

  // Нэг чатын мессежүүд
  const loadThread = useCallback(async (target: MiniChatTarget) => {
    let b: { success?: boolean; data?: { chat: { otherName: string; title: string; feedItemId?: string }; messages: Msg[] } } | null = null;
    if (target.guest) {
      const ref = readGuestChats().find((g) => g.chatId === target.id);
      if (!ref) { setMissing(true); return; }
      b = await fetch(`/api/listing-chats/guest/${target.id}?token=${encodeURIComponent(ref.token)}`, { cache: 'no-store' })
        .then((r) => r.json()).catch(() => null);
    } else {
      b = await fetch(`/api/listing-chats/${target.id}`, { headers: authHeaders(), credentials: 'include', cache: 'no-store' })
        .then((r) => r.json()).catch(() => null);
    }
    if (b?.success && b.data) {
      setMsgs(b.data.messages);
      setHead({ otherName: b.data.chat.otherName, title: b.data.chat.title, feedItemId: b.data.chat.feedItemId });
      setMissing(false);
    } else if (b) {
      setMissing(true);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    setMsgs([]); setHead(null); setMissing(false);
    void loadThread(active);
    const t = window.setInterval(() => void loadThread(active), 5000);
    return () => window.clearInterval(t);
  }, [active, loadThread]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [msgs.length]);

  const send = async () => {
    const body = text.trim();
    if (!active || !body || sending) return;
    setSending(true);
    try {
      let r: Response;
      if (active.guest) {
        const ref = readGuestChats().find((g) => g.chatId === active.id);
        r = await fetch(`/api/listing-chats/guest/${active.id}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: ref?.token, text: body }),
        });
      } else {
        r = await fetch(`/api/listing-chats/${active.id}`, {
          method: 'POST', headers: authHeaders(), credentials: 'include', body: JSON.stringify({ text: body }),
        });
      }
      const b = await r.json().catch(() => null);
      if (b?.success) { setMsgs((m) => [...m, b.data]); setText(''); setSendError(''); }
      else setSendError(b?.error || 'Мессеж илгээж чадсангүй');
    } finally {
      setSending(false);
    }
  };

  // ── Нэг чат ──
  if (active) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b border-[var(--esl-border)] px-2 py-2">
          <button type="button" onClick={() => setActive(null)} aria-label="Буцах" className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-[var(--esl-text-primary)] hover:bg-[var(--esl-bg-section)]">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[var(--esl-text-primary)]">{head?.otherName || '…'}</p>
            {head?.feedItemId ? (
              <a href={`/feed/${head.feedItemId}`} className="block truncate text-[11px] no-underline" style={{ color: BRAND }}>{head.title}</a>
            ) : (
              <p className="truncate text-[11px] text-[var(--esl-text-muted)]">{head?.title}</p>
            )}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          {missing ? (
            <p className="mt-10 text-center text-xs text-[var(--esl-text-muted)]">Энэ чат олдсонгүй эсвэл хугацаа нь дууссан.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {msgs.map((m) => (
                <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap break-words px-3 py-2 text-[13px] leading-relaxed ${m.mine ? 'rounded-[16px_16px_4px_16px] text-white' : 'rounded-[16px_16px_16px_4px] bg-[var(--esl-bg-section)] text-[var(--esl-text-primary)]'}`}
                    style={m.mine ? { background: BRAND } : undefined}
                  >
                    {m.text}
                    <div className="mt-0.5 text-right text-[10px] opacity-60">{timeLabel(m.createdAt)}</div>
                  </div>
                </div>
              ))}
              {msgs.length > 0 && msgs.every((m) => m.mine) && (
                <p className="text-center text-[11px] text-[var(--esl-text-muted)]">Зарын эзний хариуг хүлээж байна…</p>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>
        {sendError && <p className="border-t border-[var(--esl-border)] px-3 pt-2 text-xs text-red-500">{sendError}</p>}
        <div className="flex shrink-0 gap-2 border-t border-[var(--esl-border)] px-2.5 pt-2.5" style={{ paddingBottom: 'max(0.75rem, calc(env(safe-area-inset-bottom, 0px) + 0.35rem))' }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
            maxLength={1000}
            enterKeyHint="send"
            autoComplete="off"
            placeholder="Мессеж бичих…"
            disabled={missing}
            className="min-w-0 flex-1 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-section)] px-3.5 py-3 text-base text-[var(--esl-text-primary)] outline-none focus:border-[#E8242C] sm:py-2.5 sm:text-[13px]"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={!text.trim() || sending || missing}
            aria-label="Илгээх"
            className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border-0 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:h-11 sm:w-11"
            style={{ background: text.trim() ? BRAND : 'var(--esl-bg-section)', color: text.trim() ? '#fff' : 'var(--esl-text-muted)' }}
          >
            <SendHorizonal className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  // ── Жагсаалт ──
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      {rows === null ? (
        <p className="mt-10 text-center text-xs text-[var(--esl-text-muted)]">Ачаалж байна…</p>
      ) : rows.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <MessageCircle className="mx-auto mb-3 h-8 w-8 text-[var(--esl-text-muted)]" />
          <p className="text-sm font-semibold text-[var(--esl-text-primary)]">Зурвас алга</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--esl-text-muted)]">
            Зарын хуудсан дээрх <b>Чатлах</b> товчоор зарын эзэнд бичнэ үү — нэвтрэхгүйгээр ч болно. Хариу нь энд ирнэ.
          </p>
        </div>
      ) : (
        rows.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setActive({ id: r.id, guest: r.guest })}
            className="flex w-full cursor-pointer items-start gap-2 border-0 border-b border-[var(--esl-border)] bg-transparent px-3 py-3 text-left hover:bg-[var(--esl-bg-section)]"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-bold text-[var(--esl-text-primary)]">{r.otherName}</span>
                <span className="ml-auto shrink-0 text-[10px] text-[var(--esl-text-muted)]">{timeLabel(r.lastAt)}</span>
              </div>
              <p className="truncate text-[11px] text-[var(--esl-text-muted)]">{r.title}</p>
              {r.lastMessage && <p className="truncate text-xs text-[var(--esl-text-secondary)]">{r.lastMessage}</p>}
            </div>
            {r.unread > 0 && (
              <span className="mt-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white" style={{ background: BRAND }}>{r.unread}</span>
            )}
          </button>
        ))
      )}
    </div>
  );
}
