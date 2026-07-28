'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, SendHorizonal, Sparkles, ShoppingBag } from 'lucide-react';
import {
  announceChatDockOpen,
  CHAT_DOCK_OPEN_EVENT,
  type ChatDockId,
} from '@/lib/chat-dock';

// ─── Types ───────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

type Occasion = 'gift' | 'self' | 'home' | 'family';

const OCCASIONS: { key: Occasion; label: string }[] = [
  { key: 'gift', label: 'Бэлэг' },
  { key: 'self', label: 'Өөртөө' },
  { key: 'home', label: 'Байшин' },
  { key: 'family', label: 'Гэр бүл' },
];

const QUICK_PROMPTS = [
  '50,000₮-н бэлэг',
  'Гэрийн тавилга',
  'Хүүхдийн хувцас',
];

const BUDGET_STEPS = [10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];

const ts = () =>
  new Date().toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });

const uid = () => Math.random().toString(36).slice(2, 10);

const formatBudget = (v: number) => {
  if (v >= 1_000_000) return `${v / 1_000_000}сая₮`;
  return `${(v / 1000).toFixed(0)}мян₮`;
};

const DOCK_ID: ChatDockId = 'shopper';

// ─── Component ───────────────────────────────────────────────
export default function AIShopperWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content:
        'Сайн байна уу! Би eseller.mn-ийн AI худалдааны туслах. Юу хайж байгаагаа хэлээрэй, тохирох бараа олж өгье!',
      time: ts(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [budget, setBudget] = useState(3);
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

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

  const send = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? input).trim();
      if (!text || loading) return;

      const userMsg: Message = { id: uid(), role: 'user', content: text, time: ts() };
      setMessages((prev) => [...prev, userMsg]);
      if (!overrideText) setInput('');
      setLoading(true);

      const assistantId = uid();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', time: ts() },
      ]);

      try {
        const res = await fetch('/api/ai/shop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history,
            budget: BUDGET_STEPS[budget],
            occasion: occasion
              ? OCCASIONS.find((o) => o.key === occasion)?.label
              : undefined,
          }),
        });

        if (!res.ok) {
          throw new Error('API error');
        }

        const contentType = res.headers.get('content-type') ?? '';

        if (contentType.includes('text/event-stream') && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let fullText = '';
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const payload = line.slice(6);
              if (payload === '[DONE]') break;
              try {
                const parsed = JSON.parse(payload) as { text: string };
                fullText += parsed.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: fullText } : m,
                  ),
                );
              } catch {
                // skip malformed JSON
              }
            }
          }

          setHistory((prev) => [
            ...prev,
            { role: 'user', content: text },
            { role: 'assistant', content: fullText },
          ]);
        } else {
          const data = await res.json();
          const reply: string = data.reply ?? data.error ?? 'Алдаа гарлаа';
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: reply } : m,
            ),
          );
          setHistory((prev) => [
            ...prev,
            { role: 'user', content: text },
            { role: 'assistant', content: reply },
          ]);
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: 'Алдаа гарлаа. Дахин оролдоно уу.' }
              : m,
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [input, loading, history, budget, occasion],
  );

  return (
    <>
      {/*
        Dock slot 2 (upper FAB) — stacked above support FAB.
        mobile: nav + gap + support FAB + gap
        desktop: bottom-6 + FAB + gap
      */}
      <button
        type="button"
        onClick={toggle}
        aria-label={open ? 'AI туслах хаах' : 'AI Худалдааны туслах нээх'}
        aria-expanded={open}
        className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem+3.5rem+0.625rem)] right-4 z-[9000] flex h-14 w-14 items-center justify-center rounded-full border-none bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30 transition-transform hover:scale-110 active:scale-95 cursor-pointer md:bottom-[calc(1.5rem+3.5rem+0.625rem)] md:right-6"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="AI Худалдааны туслах"
          className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem+8rem)] right-3 z-[8990] flex h-[min(520px,calc(100dvh-3.5rem-env(safe-area-inset-bottom,0px)-10.5rem))] w-[min(380px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-[var(--esl-border,#222)] bg-[var(--esl-bg-card,#141414)] shadow-2xl md:bottom-[calc(1.5rem+8rem)] md:right-6 md:h-[min(540px,calc(100dvh-11rem))]"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center gap-3 bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white">AI Худалдааны Туслах</div>
              <div className="text-[11px] text-white/70">Бараа хайх, зөвлөгөө авах</div>
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border-none bg-white/15 transition-colors hover:bg-white/25 cursor-pointer"
              aria-label="Шүүлтүүр"
            >
              <ShoppingBag className="h-4 w-4 text-white" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Хаах"
              className="flex h-8 w-8 items-center justify-center rounded-lg border-none bg-white/15 transition-colors hover:bg-white/25 cursor-pointer"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="shrink-0 border-b border-[var(--esl-border,#222)] bg-[var(--esl-bg-section,#1A1A1A)] px-4 py-3">
              <div className="mb-2">
                <label className="mb-1 block text-[11px] text-[var(--esl-text-muted,#999)]">
                  Төсөв: {formatBudget(BUDGET_STEPS[budget])}
                </label>
                <input
                  type="range"
                  min={0}
                  max={BUDGET_STEPS.length - 1}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full accent-violet-500"
                />
                <div className="flex justify-between text-[10px] text-[var(--esl-text-muted,#666)]">
                  <span>10мян₮</span>
                  <span>1сая₮</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {OCCASIONS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setOccasion(occasion === o.key ? null : o.key)}
                    className={`cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] transition-colors ${
                      occasion === o.key
                        ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                        : 'border-[var(--esl-border,#333)] bg-transparent text-[var(--esl-text-muted,#999)] hover:border-violet-400'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain p-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] whitespace-pre-wrap px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-[16px_16px_4px_16px] bg-violet-600 text-white'
                      : 'rounded-[16px_16px_16px_4px] bg-[var(--esl-bg-section,#1A1A1A)] text-[var(--esl-text,#eee)]'
                  }`}
                >
                  {msg.content || (
                    <span className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </span>
                  )}
                  {msg.content && (
                    <div className="mt-1 text-right text-[10px] opacity-50">{msg.time}</div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 2 && (
            <div className="flex shrink-0 flex-wrap gap-1.5 px-3 pt-1">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="cursor-pointer rounded-xl border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[11px] text-violet-300 transition-colors hover:bg-violet-500/20"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex shrink-0 gap-2 border-t border-[var(--esl-border,#222)] p-2.5">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Юу хайж байна вэ?"
              disabled={loading}
              className="min-w-0 flex-1 rounded-xl border border-[var(--esl-border,#222)] bg-[var(--esl-bg-section,#1A1A1A)] px-3.5 py-2 text-[13px] text-[var(--esl-text,#eee)] outline-none transition-colors focus:border-violet-500 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => send()}
              disabled={!input.trim() || loading}
              aria-label="Илгээх"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-none transition-colors ${
                input.trim() && !loading
                  ? 'cursor-pointer bg-violet-600 text-white hover:bg-violet-500'
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
