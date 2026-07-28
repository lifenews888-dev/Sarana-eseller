'use client';

/**
 * Unified eseller assistant — one FAB, two modes.
 * Mobile UX focus: shop (AI худалдаа) mode sheet, keyboard-safe input, budget chips.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bot,
  Headphones,
  MessageCircle,
  SendHorizonal,
  Sparkles,
  X,
} from 'lucide-react';

type Mode = 'help' | 'shop';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

const ts = () =>
  new Date().toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });

const uid = () => Math.random().toString(36).slice(2, 10);

/** Minimal **bold** + plain text for chat bubbles (no full markdown). */
function renderChatText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

const WELCOME: Record<Mode, string> = {
  help:
    'Сайн байна уу! Би eseller туслах. Захиалга, төлбөр, хүргэлт, дэлгүүр нээх талаар асуугаарай 😊',
  shop:
    'Сайн байна уу! Би AI худалдааны туслах. Юу хайж байгаагаа хэлээрэй — төсөв, бэлэг, бараа санал болгоё 🛍️',
};

const QUICK: Record<Mode, string[]> = {
  help: ['Захиалга хянах', 'QPay төлбөр', 'Буцаалт', 'Дэлгүүр нээх'],
  shop: ['50,000₮-н бэлэг', 'Гэрийн тавилга', 'Хямдралтай бараа', 'Хүүхдийн'],
};

const BUDGETS = [
  { label: '25мян', value: 25_000 },
  { label: '50мян', value: 50_000 },
  { label: '100мян', value: 100_000 },
  { label: '250мян', value: 250_000 },
  { label: 'Бүгд', value: 0 },
];

const MODE_META: Record<
  Mode,
  { label: string; title: string; short: string; Icon: typeof Bot; accent: string; header: string }
> = {
  help: {
    label: 'Тусламж',
    title: 'eseller туслах',
    short: 'Захиалга · хүргэлт · QPay',
    Icon: Headphones,
    accent: '#E8242C',
    header: 'from-[#E8242C] to-[#C41E25]',
  },
  shop: {
    label: 'Бараа хайх',
    title: 'AI Худалдааны туслах',
    short: 'Санал · төсөв · бэлэг',
    Icon: Sparkles,
    accent: '#7C3AED',
    header: 'from-violet-600 to-fuchsia-500',
  },
};

export default function EsellerAssistant() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('shop');
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', content: WELCOME.shop, time: ts() },
  ]);
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [budget, setBudget] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
    return () => window.cancelAnimationFrame(id);
  }, [messages, open, mode]);

  // Avoid iOS focusing input on open (keyboard covers half the sheet) — focus only desktop
  useEffect(() => {
    if (!open) return;
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      inputRef.current?.focus();
    }
  }, [open, mode]);

  // Lock body scroll while sheet open on mobile
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setHistory([]);
    setMessages([{ id: uid(), role: 'assistant', content: WELCOME[next], time: ts() }]);
    setInput('');
    setLoading(false);
  };

  const send = useCallback(
    async (override?: string) => {
      const text = (override ?? input).trim();
      if (!text || loading) return;

      const userMsg: Message = { id: uid(), role: 'user', content: text, time: ts() };
      setMessages((prev) => [...prev, userMsg]);
      if (!override) setInput('');
      setLoading(true);

      const assistantId = uid();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', time: ts() },
      ]);

      try {
        if (mode === 'help') {
          const res = await fetch('/api/chat/bot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, history }),
          });
          const data = await res.json().catch(() => ({}));
          const reply =
            (typeof data.reply === 'string' && data.reply) ||
            'Уучлаарай, хариу авч чадсангүй. Дахин оролдоно уу.';
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: reply } : m)),
          );
          setHistory((prev) => [
            ...prev,
            { role: 'user', content: text },
            { role: 'assistant', content: reply },
          ]);
        } else {
          const res = await fetch('/api/ai/shop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: text,
              history,
              ...(budget > 0 ? { budget } : {}),
            }),
          });

          if (!res.ok) throw new Error('shop api');

          const contentType = res.headers.get('content-type') ?? '';
          if (contentType.includes('text/event-stream') && res.body) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let full = '';
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
                  const parsed = JSON.parse(payload) as { text?: string };
                  if (parsed.text) {
                    full += parsed.text;
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantId ? { ...m, content: full } : m,
                      ),
                    );
                  }
                } catch {
                  /* skip */
                }
              }
            }
            const finalText =
              full.trim() ||
              'Одоогоор тохирох бараа олдсонгүй. Төсөв эсвэл түлхүүр үгээ өөрчилж үзнэ үү.';
            if (!full.trim()) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: finalText } : m,
                ),
              );
            }
            setHistory((prev) => [
              ...prev,
              { role: 'user', content: text },
              { role: 'assistant', content: finalText },
            ]);
          } else {
            const data = await res.json().catch(() => ({}));
            const reply =
              (typeof data.reply === 'string' && data.reply) ||
              data.error ||
              'Алдаа гарлаа';
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: reply } : m)),
            );
            setHistory((prev) => [
              ...prev,
              { role: 'user', content: text },
              { role: 'assistant', content: reply },
            ]);
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    mode === 'shop'
                      ? 'Бараа хайлт түр ажиллахгүй байна. Дахин оролдоно уу эсвэл /store-оос хайна уу.'
                      : 'Алдаа гарлаа. Дахин оролдоно уу.',
                }
              : m,
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [budget, history, input, loading, mode],
  );

  const meta = MODE_META[mode];

  return (
    <>
      {/* FAB — hidden while open so it doesn't cover the input on phones */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="AI худалдааны туслах нээх"
          className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] right-4 z-[9000] flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-0 bg-gradient-to-br from-violet-600 to-[#E8242C] text-white shadow-lg shadow-violet-900/25 transition active:scale-95 md:bottom-6 md:right-6"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <>
          {/* Backdrop — tap to close; keeps focus on sheet */}
          <button
            type="button"
            aria-label="Туслах хаах"
            className="fixed inset-0 z-[8980] cursor-default border-0 bg-black/45 backdrop-blur-[2px] md:bg-black/30"
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={meta.title}
            className="fixed inset-x-0 bottom-0 z-[8990] flex h-[min(90dvh,100%)] max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[min(580px,calc(100dvh-3rem))] sm:max-h-[calc(100dvh-3rem)] sm:w-[min(400px,calc(100vw-2rem))] sm:rounded-2xl"
          >
            {/* Handle */}
            <div className="flex shrink-0 justify-center pt-2 sm:hidden" aria-hidden>
              <div className="h-1 w-10 rounded-full bg-[var(--esl-border)]" />
            </div>

            {/* Header */}
            <div className={`flex shrink-0 items-center gap-3 bg-gradient-to-r ${meta.header} px-3 py-2.5 sm:px-4 sm:py-3`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                <meta.Icon className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-white">{meta.title}</div>
                <div className="truncate text-[11px] text-white/80">{meta.short}</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Хаах"
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border-0 bg-white/15 text-white hover:bg-white/25"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mode tabs — large hit area */}
            <div className="flex shrink-0 gap-1 border-b border-[var(--esl-border)] bg-[var(--esl-bg-section)] p-1.5">
              {(Object.keys(MODE_META) as Mode[]).map((key) => {
                const m = MODE_META[key];
                const active = mode === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => switchMode(key)}
                    className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border-0 px-2 text-xs font-bold transition ${
                      active
                        ? 'bg-[var(--esl-bg-card)] text-[var(--esl-text-primary)] shadow-sm'
                        : 'bg-transparent text-[var(--esl-text-muted)]'
                    }`}
                  >
                    <m.Icon className="h-4 w-4" style={active ? { color: m.accent } : undefined} />
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Shop budget chips */}
            {mode === 'shop' && (
              <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-[var(--esl-border)] px-3 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <span className="shrink-0 self-center text-[10px] font-semibold text-[var(--esl-text-muted)]">
                  Төсөв:
                </span>
                {BUDGETS.map((b) => {
                  const active = budget === b.value;
                  return (
                    <button
                      key={b.label}
                      type="button"
                      onClick={() => setBudget(b.value)}
                      className={`shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                        active
                          ? 'border-violet-500 bg-violet-500/15 text-violet-600'
                          : 'border-[var(--esl-border)] bg-[var(--esl-bg-section)] text-[var(--esl-text-muted)]'
                      }`}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Messages — flex-1 needs explicit parent height (sheet h-[90dvh]) */}
            <div
              ref={listRef}
              className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-3 py-3 [-webkit-overflow-scrolling:touch]"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] whitespace-pre-wrap break-words px-3.5 py-2.5 text-[13px] leading-relaxed sm:max-w-[85%] ${
                      msg.role === 'user'
                        ? 'rounded-[16px_16px_4px_16px] text-white'
                        : 'rounded-[16px_16px_16px_4px] bg-[var(--esl-bg-section)] text-[var(--esl-text-primary)]'
                    }`}
                    style={msg.role === 'user' ? { background: meta.accent } : undefined}
                  >
                    {msg.content ? (
                      <>
                        {renderChatText(msg.content)}
                        <div className="mt-1 text-right text-[10px] opacity-50">{msg.time}</div>
                      </>
                    ) : (
                      <span className="flex gap-1.5 py-0.5" aria-label="Бичиж байна">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} className="h-px shrink-0" />
            </div>

            {/* Quick prompts — larger touch targets */}
            {messages.length <= 2 && (
              <div className="flex shrink-0 flex-wrap gap-2 border-t border-[var(--esl-border)]/60 px-3 py-2">
                {QUICK[mode].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void send(q)}
                    disabled={loading}
                    className="min-h-9 cursor-pointer rounded-full border border-[var(--esl-border)] bg-[var(--esl-bg-section)] px-3 py-1.5 text-[12px] font-semibold text-[var(--esl-text-muted)] transition active:scale-95 disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Composer — 16px font prevents iOS zoom; safe-area padding */}
            <div
              className="flex shrink-0 gap-2 border-t border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-2.5"
              style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom, 0px))' }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                enterKeyHint="send"
                autoComplete="off"
                autoCorrect="on"
                placeholder={mode === 'help' ? 'Асуултаа бичнэ үү…' : 'Юу хайж байна вэ?'}
                disabled={loading}
                className="min-w-0 flex-1 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-section)] px-3.5 py-3 text-base text-[var(--esl-text-primary)] outline-none focus:border-violet-500 disabled:opacity-50 sm:text-[13px] sm:py-2.5"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={!input.trim() || loading}
                aria-label="Илгээх"
                className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border-0 text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:h-11 sm:w-11"
                style={{
                  background: input.trim() && !loading ? meta.accent : 'var(--esl-bg-section)',
                  color: input.trim() && !loading ? '#fff' : 'var(--esl-text-muted)',
                }}
              >
                <SendHorizonal className="h-5 w-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
