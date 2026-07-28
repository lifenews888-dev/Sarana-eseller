'use client';

/**
 * eseller туслах — single brand assistant.
 * One red FAB + eseller sheet design. Two task tabs share the same UI shell:
 *  - help → /api/chat/bot
 *  - shop → /api/ai/shop
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Headphones, MessageSquare, SendHorizonal, ShoppingBag, X } from 'lucide-react';

type Mode = 'help' | 'shop';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

const BRAND = '#E8242C';
const BRAND_DARK = '#C41E25';

const ts = () =>
  new Date().toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });

const uid = () => Math.random().toString(36).slice(2, 10);

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
    'Сайн байна уу! Би eseller туслах. Захиалга, төлбөр, хүргэлт, дэлгүүр нээх — асуугаарай 😊',
  shop:
    'Сайн байна уу! Би eseller туслах. Бараа, бэлэг, төсөвөөр санал болгож чадна 🛍️',
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

const TABS: { key: Mode; label: string; Icon: typeof Bot }[] = [
  { key: 'help', label: 'Тусламж', Icon: Headphones },
  { key: 'shop', label: 'Бараа', Icon: ShoppingBag },
];

export default function EsellerAssistant() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('help');
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', content: WELCOME.help, time: ts() },
  ]);
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [budget, setBudget] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
    return () => window.cancelAnimationFrame(id);
  }, [messages, open, mode]);

  useEffect(() => {
    if (!open) return;
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      inputRef.current?.focus();
    }
  }, [open, mode]);

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

      setMessages((prev) => [
        ...prev,
        { id: uid(), role: 'user', content: text, time: ts() },
      ]);
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
                      ? 'Бараа хайлт түр ажиллахгүй байна. Дахин оролдоно уу эсвэл Дэлгүүр хэсгээс хайна уу.'
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

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="eseller туслах нээх"
          className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] right-4 z-[9000] flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-0 text-white shadow-lg transition active:scale-95 md:bottom-6 md:right-6"
          style={{
            background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`,
            boxShadow: '0 8px 24px rgba(232,36,44,0.35)',
          }}
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {open && (
        <>
          <button
            type="button"
            aria-label="Туслах хаах"
            className="fixed inset-0 z-[8980] cursor-default border-0 bg-black/45 backdrop-blur-[2px] md:bg-black/30"
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="eseller туслах"
            className="fixed inset-x-0 bottom-0 z-[8990] flex h-[min(90dvh,100%)] max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[min(580px,calc(100dvh-3rem))] sm:max-h-[calc(100dvh-3rem)] sm:w-[min(400px,calc(100vw-2rem))] sm:rounded-2xl"
          >
            <div className="flex shrink-0 justify-center pt-2 sm:hidden" aria-hidden>
              <div className="h-1 w-10 rounded-full bg-[var(--esl-border)]" />
            </div>

            {/* eseller brand header — same shell for both modes */}
            <div
              className="flex shrink-0 items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3"
              style={{
                background: `linear-gradient(90deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`,
              }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-white">
                  eseller<span className="font-black">.mn</span> туслах
                </div>
                <div className="truncate text-[11px] text-white/80">
                  {mode === 'help'
                    ? '● Онлайн · Захиалга · QPay · Хүргэлт'
                    : '● Бараа санал · Төсөв · Бэлэг'}
                </div>
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

            {/* Task switcher — same brand, not a second bot */}
            <div className="flex shrink-0 gap-1 border-b border-[var(--esl-border)] bg-[var(--esl-bg-section)] p-1.5">
              {TABS.map(({ key, label, Icon }) => {
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
                    <Icon
                      className="h-4 w-4"
                      style={active ? { color: BRAND } : undefined}
                    />
                    {label}
                  </button>
                );
              })}
            </div>

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
                          ? 'border-[#E8242C] bg-[rgba(232,36,44,0.12)] text-[#E8242C]'
                          : 'border-[var(--esl-border)] bg-[var(--esl-bg-section)] text-[var(--esl-text-muted)]'
                      }`}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-3 py-3 [-webkit-overflow-scrolling:touch]">
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
                    style={msg.role === 'user' ? { background: BRAND } : undefined}
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
                            className="inline-block h-1.5 w-1.5 animate-bounce rounded-full"
                            style={{
                              background: BRAND,
                              animationDelay: `${i * 0.15}s`,
                            }}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} className="h-px shrink-0" />
            </div>

            {messages.length <= 2 && (
              <div className="flex shrink-0 flex-wrap gap-2 border-t border-[var(--esl-border)]/60 px-3 py-2">
                {QUICK[mode].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void send(q)}
                    disabled={loading}
                    className="min-h-9 cursor-pointer rounded-full border border-[var(--esl-border)] bg-[var(--esl-bg-section)] px-3 py-1.5 text-[12px] font-semibold text-[var(--esl-text-muted)] transition hover:border-[#E8242C]/50 active:scale-95 disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

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
                placeholder={
                  mode === 'help' ? 'Асуултаа бичнэ үү…' : 'Юу хайж байна вэ?'
                }
                disabled={loading}
                className="min-w-0 flex-1 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-section)] px-3.5 py-3 text-base text-[var(--esl-text-primary)] outline-none focus:border-[#E8242C] disabled:opacity-50 sm:py-2.5 sm:text-[13px]"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={!input.trim() || loading}
                aria-label="Илгээх"
                className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border-0 text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:h-11 sm:w-11"
                style={{
                  background:
                    input.trim() && !loading ? BRAND : 'var(--esl-bg-section)',
                  color:
                    input.trim() && !loading ? '#fff' : 'var(--esl-text-muted)',
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
