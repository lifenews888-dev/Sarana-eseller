'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessageCircle, Send, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import MobileNav from '@/components/shared/MobileNav';
import { useAuth } from '@/lib/auth';
import { useHydrated } from '@/lib/hooks/useHydrated';

type ChatRow = {
  id: string;
  feedItemId: string;
  title?: string | null;
  lastMessage?: string | null;
  lastAt: string;
  role: 'buyer' | 'seller';
  otherName: string;
  unread: number;
};
type Msg = { id: string; text: string; mine: boolean; createdAt: string };
type ChatInfo = { id: string; feedItemId: string; title?: string | null; role: 'buyer' | 'seller'; otherName: string };

function headers(): Record<string, string> {
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? d.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString('mn-MN');
}

function MessagesInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const activeId = sp.get('chat');
  const hydrated = useHydrated();
  const auth = useAuth();
  const isLoggedIn = hydrated && auth.isLoggedIn;
  const [chats, setChats] = useState<ChatRow[] | null>(null);
  const [info, setInfo] = useState<ChatInfo | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const loadChats = useCallback(() => {
    fetch('/api/listing-chats', { headers: headers(), credentials: 'include' })
      .then((r) => r.json())
      .then((b) => setChats(b?.success ? b.data : []))
      .catch(() => setChats([]));
  }, []);

  const loadThread = useCallback((id: string) => {
    fetch(`/api/listing-chats/${id}`, { headers: headers(), credentials: 'include' })
      .then((r) => r.json())
      .then((b) => {
        if (b?.success) { setInfo(b.data.chat); setMsgs(b.data.messages); }
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    loadChats();
    const t = setInterval(loadChats, 15000);
    return () => clearInterval(t);
  }, [isLoggedIn, loadChats]);

  useEffect(() => {
    if (!activeId || !isLoggedIn) return;
    loadThread(activeId);
    const t = setInterval(() => loadThread(activeId), 5000);
    return () => clearInterval(t);
  }, [activeId, isLoggedIn, loadThread]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [msgs.length]);

  const send = async () => {
    if (!activeId || !text.trim() || sending) return;
    setSending(true);
    try {
      const r = await fetch(`/api/listing-chats/${activeId}`, {
        method: 'POST', headers: headers(), credentials: 'include', body: JSON.stringify({ text: text.trim() }),
      });
      const b = await r.json();
      if (b?.success) { setMsgs((m) => [...m, b.data]); setText(''); loadChats(); }
    } finally {
      setSending(false);
    }
  };

  if (!hydrated) return null;
  if (!isLoggedIn) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-[var(--esl-text-muted)] mb-4">Мессежээ харахын тулд нэвтэрнэ үү.</p>
        <Link href="/login?redirect=/messages" className="rounded-xl bg-[#E8242C] px-5 py-2.5 text-sm font-bold text-white no-underline">Нэвтрэх</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-4 text-xl font-extrabold text-[var(--esl-text-primary)]">Мессеж</h1>
      <div className="grid min-h-[60vh] overflow-hidden rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] md:grid-cols-[320px_1fr]">
        <aside className={`border-r border-[var(--esl-border)] ${activeId ? 'hidden md:block' : ''}`}>
          {chats === null ? (
            <p className="p-4 text-sm text-[var(--esl-text-muted)]">Ачаалж байна...</p>
          ) : chats.length === 0 ? (
            <div className="p-6 text-center text-sm text-[var(--esl-text-muted)]">
              <MessageCircle className="mx-auto mb-2 h-8 w-8" />
              Мессеж алга. Зарын хуудсан дээрх &quot;Чатлах&quot; товчоор зарын эзэнд бичээрэй.
            </div>
          ) : (
            chats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => router.push(`/messages?chat=${c.id}`)}
                className={`block w-full border-b border-[var(--esl-border)] px-4 py-3 text-left hover:bg-[var(--esl-bg-muted)] ${c.id === activeId ? 'bg-[var(--esl-bg-muted)]' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold text-[var(--esl-text-primary)]">{c.otherName}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-[var(--esl-text-muted)]">{timeLabel(c.lastAt)}</span>
                </div>
                <p className="truncate text-xs text-[var(--esl-text-muted)]">{c.role === 'seller' ? 'Таны зар: ' : ''}{c.title}</p>
                <div className="flex items-center gap-2">
                  <p className="truncate text-xs text-[var(--esl-text-secondary)]">{c.lastMessage}</p>
                  {c.unread > 0 && <span className="ml-auto rounded-full bg-[#E8242C] px-1.5 text-[10px] font-bold text-white">{c.unread}</span>}
                </div>
              </button>
            ))
          )}
        </aside>

        <section className={`flex flex-col ${activeId ? '' : 'hidden md:flex'}`}>
          {!activeId || !info ? (
            <div className="m-auto p-6 text-sm text-[var(--esl-text-muted)]">Чат сонгоно уу</div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-[var(--esl-border)] px-4 py-3">
                <button type="button" onClick={() => router.push('/messages')} className="md:hidden" aria-label="Буцах"><ArrowLeft size={18} /></button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[var(--esl-text-primary)]">{info.otherName}</p>
                  <Link href={`/feed/${info.feedItemId}`} className="block truncate text-xs text-[#E8242C] no-underline">{info.title}</Link>
                </div>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4" style={{ maxHeight: '55vh' }}>
                {msgs.map((m) => (
                  <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.mine ? 'bg-[#E8242C] text-white' : 'bg-[var(--esl-bg-muted)] text-[var(--esl-text-primary)]'}`}>
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      <p className={`mt-0.5 text-[10px] ${m.mine ? 'text-white/70' : 'text-[var(--esl-text-muted)]'}`}>{timeLabel(m.createdAt)}</p>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <div className="flex gap-2 border-t border-[var(--esl-border)] p-3">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
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

export default function MessagesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--esl-bg-page)] pb-20 md:pb-0">
        <Suspense fallback={null}>
          <MessagesInner />
        </Suspense>
      </main>
      <MobileNav />
    </>
  );
}
