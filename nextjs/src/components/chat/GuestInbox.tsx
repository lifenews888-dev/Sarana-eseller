'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Send } from 'lucide-react';
import { readGuestChats, type GuestChatRef } from '@/lib/guestChatClient';

type Msg = { id: string; text: string; mine: boolean; createdAt: string };

function timeLabel(iso: string) {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('mn-MN');
}

/** Бүртгэлгүй (зочин) хэрэглэгчийн энэ төхөөрөмж дээрх зарын чатууд */
export default function GuestInbox({ initialChatId }: { initialChatId?: string | null }) {
  const [chats] = useState<GuestChatRef[]>(() => readGuestChats());
  const [activeId, setActiveId] = useState<string | null>(initialChatId || chats[0]?.chatId || null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [otherName, setOtherName] = useState('');
  const [missing, setMissing] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const active = chats.find((c) => c.chatId === activeId) || null;

  const load = useCallback((ref: GuestChatRef) => {
    fetch(`/api/listing-chats/guest/${ref.chatId}?token=${encodeURIComponent(ref.token)}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((b) => {
        if (b?.success) { setMsgs(b.data.messages); setOtherName(b.data.chat.otherName); setMissing(false); }
        else setMissing(true);
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (!active) return;
    load(active);
    const t = window.setInterval(() => load(active), 5000);
    return () => window.clearInterval(t);
  }, [active, load]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [msgs.length]);

  const send = async () => {
    if (!active || !text.trim() || sending) return;
    setSending(true);
    try {
      const r = await fetch(`/api/listing-chats/guest/${active.chatId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: active.token, text: text.trim() }),
      });
      const b = await r.json();
      if (b?.success) { setMsgs((m) => [...m, b.data]); setText(''); setSendError(''); }
      else setSendError(b?.error || 'Мессеж илгээж чадсангүй');
    } finally {
      setSending(false);
    }
  };

  if (chats.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-sm text-[var(--esl-text-muted)]">Мессежээ харахын тулд нэвтэрнэ үү.</p>
        <Link href="/login?redirect=/messages" className="rounded-xl bg-[#E8242C] px-5 py-2.5 text-sm font-bold text-white no-underline">Нэвтрэх</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-1 text-xl font-extrabold text-[var(--esl-text-primary)]">Мессеж</h1>
      <p className="mb-4 text-xs text-[var(--esl-text-muted)]">
        Та бүртгэлгүй (зочин) байдлаар бичсэн тул эдгээр чат зөвхөн энэ төхөөрөмж дээр харагдана.{' '}
        <Link href="/login?redirect=/messages" className="font-bold text-[#E8242C]">Бүртгүүлэх</Link>
      </p>
      <div className="grid min-h-[50vh] overflow-hidden rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] md:grid-cols-[280px_1fr]">
        <aside className="border-r border-[var(--esl-border)]">
          {chats.map((c) => (
            <button
              key={c.chatId}
              type="button"
              onClick={() => setActiveId(c.chatId)}
              className={`block w-full border-b border-[var(--esl-border)] px-4 py-3 text-left text-sm ${c.chatId === activeId ? 'bg-[var(--esl-bg-muted)]' : ''}`}
            >
              <span className="line-clamp-2 font-semibold text-[var(--esl-text-primary)]">{c.title || 'Зар'}</span>
            </button>
          ))}
        </aside>
        <section className="flex flex-col">
          {!active ? (
            <div className="m-auto text-sm text-[var(--esl-text-muted)]">Чат сонгоно уу</div>
          ) : missing ? (
            <div className="m-auto p-6 text-sm text-[var(--esl-text-muted)]">Энэ чат олдсонгүй эсвэл хугацаа нь дууссан.</div>
          ) : (
            <>
              <div className="border-b border-[var(--esl-border)] px-4 py-3">
                <p className="text-sm font-bold text-[var(--esl-text-primary)]">{otherName || 'Зарын эзэн'}</p>
                {active.feedItemId && <Link href={`/feed/${active.feedItemId}`} className="text-xs text-[#E8242C] no-underline">{active.title}</Link>}
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4" style={{ maxHeight: '50vh' }}>
                {msgs.map((m) => (
                  <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.mine ? 'bg-[#E8242C] text-white' : 'bg-[var(--esl-bg-muted)] text-[var(--esl-text-primary)]'}`}>
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      <p className={`mt-0.5 text-[10px] ${m.mine ? 'text-white/70' : 'text-[var(--esl-text-muted)]'}`}>{timeLabel(m.createdAt)}</p>
                    </div>
                  </div>
                ))}
                {msgs.length > 0 && msgs.every((m) => m.mine) && (
                  <p className="text-center text-[11px] text-[var(--esl-text-muted)]">Зарын эзний хариуг хүлээж байна…</p>
                )}
                <div ref={endRef} />
              </div>
              {sendError && <p className="border-t border-[var(--esl-border)] px-3 pt-2 text-xs text-red-500">{sendError}</p>}
              <div className="flex gap-2 border-t border-[var(--esl-border)] p-3">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void send(); } }}
                  maxLength={1000}
                  placeholder="Мессеж бичих..."
                  className="h-11 flex-1 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg)] px-3 text-sm outline-none"
                />
                <button type="button" onClick={send} disabled={sending || !text.trim()} className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8242C] text-white disabled:opacity-50" aria-label="Илгээх">
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
