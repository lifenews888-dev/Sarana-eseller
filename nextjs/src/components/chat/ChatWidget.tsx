'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Bot, SendHorizonal, X } from 'lucide-react';
import {
  announceChatDockOpen,
  CHAT_DOCK_OPEN_EVENT,
  type ChatDockId,
} from '@/lib/chat-dock';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  time: string;
}

const now = () => new Date().toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });
const DOCK_ID: ChatDockId = 'support';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      content: 'Сайн байна уу! Би eseller.mn-ийн туслах юм. Ямар асуулт байна вэ? 😊',
      role: 'assistant',
      time: now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const onOther = (e: Event) => {
      const id = (e as CustomEvent<{ id: ChatDockId }>).detail?.id;
      if (id && id !== DOCK_ID) setOpen(false);
    };
    window.addEventListener(CHAT_DOCK_OPEN_EVENT, onOther);
    return () => window.removeEventListener(CHAT_DOCK_OPEN_EVENT, onOther);
  }, []);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) announceChatDockOpen(DOCK_ID);
      return next;
    });
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const text = input;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), content: text, role: 'user', time: now() },
    ]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      setHistory((prev) => [
        ...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: data.reply },
      ]);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: data.reply,
          role: 'assistant',
          time: now(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: 'Алдаа гарлаа. Дахин оролдоно уу.',
          role: 'assistant',
          time: now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/*
        Dock slot 1 (lower FAB):
        mobile — above MobileNav (56px + safe-area + 12px)
        desktop — bottom-6
        z below MobileNav (9999) so tabs always win if anything overlaps
      */}
      <button
        type="button"
        onClick={toggle}
        aria-label={open ? 'Туслах чат хаах' : 'Eseller туслах нээх'}
        aria-expanded={open}
        className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] right-4 z-[9000] flex h-14 w-14 items-center justify-center rounded-full border-none bg-[#E8242C] text-white shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer md:bottom-6 md:right-6"
      >
        {open ? <X className="h-5 w-5" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Eseller туслах"
          className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem+8rem)] right-3 z-[8990] flex h-[min(500px,calc(100dvh-3.5rem-env(safe-area-inset-bottom,0px)-10.5rem))] w-[min(360px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[20px] border border-[var(--esl-border,#222)] bg-[var(--esl-bg-card,#141414)] shadow-2xl md:bottom-[calc(1.5rem+8rem)] md:right-6 md:h-[min(520px,calc(100dvh-11rem))]"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center gap-2.5 bg-[#E8242C] p-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white">Eseller Туслах</div>
              <div className="text-[11px] text-white/70">● Онлайн · 24/7</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Хаах"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-none bg-white/15 text-white cursor-pointer hover:bg-white/25"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain p-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-[16px_16px_4px_16px] bg-[#E8242C] text-white'
                      : 'rounded-[16px_16px_16px_4px] bg-[var(--esl-bg-section,#1A1A1A)] text-[var(--esl-text,#eee)]'
                  }`}
                >
                  {msg.content}
                  <div className="mt-1 text-right text-[10px] opacity-60">{msg.time}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex w-fit gap-1 rounded-[16px_16px_16px_4px] bg-[var(--esl-bg-section,#1A1A1A)] px-3.5 py-2.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#E8242C]"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          <div className="flex shrink-0 flex-wrap gap-1.5 px-3 pt-2">
            {['Захиалга хянах', 'Буцаалт хийх', 'Gold гишүүнчлэл'].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setInput(q)}
                className="cursor-pointer rounded-xl border border-[var(--esl-border,#222)] bg-[var(--esl-bg-section,#1A1A1A)] px-2.5 py-1 text-[11px] text-[var(--esl-text-muted,#999)] transition-colors hover:border-[#E8242C]"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex shrink-0 gap-2 border-t border-[var(--esl-border,#222)] p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom,0px))] md:pb-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Мессеж бичих..."
              className="min-w-0 flex-1 rounded-xl border border-[var(--esl-border,#222)] bg-[var(--esl-bg-section,#1A1A1A)] px-3.5 py-2 text-[13px] text-[var(--esl-text,#eee)] outline-none transition-colors focus:border-[#E8242C]"
            />
            <button
              type="button"
              onClick={send}
              disabled={!input.trim() || loading}
              aria-label="Илгээх"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-none ${
                input.trim()
                  ? 'cursor-pointer bg-[#E8242C] text-white'
                  : 'cursor-not-allowed bg-[var(--esl-bg-section,#1A1A1A)] text-[var(--esl-text-muted,#555)]'
              }`}
            >
              <SendHorizonal className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
