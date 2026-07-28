'use client';

/**
 * Unified eseller assistant — one FAB, two modes:
 *  - help: support FAQ / order / delivery (/api/chat/bot)
 *  - shop: product recommendations (/api/ai/shop)
 *
 * Replaces dual ChatWidget + AIShopperWidget FABs that cluttered mobile UI.
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

const WELCOME: Record<Mode, string> = {
  help:
    'Сайн байна уу! Би **eseller туслах**. Захиалга, төлбөр, хүргэлт, дэлгүүр нээх талаар асуугаарай 😊',
  shop:
    'Сайн байна уу! Би **AI худалдааны туслах**. Юу хайж байгаагаа хэлээрэй — төсөв, бэлэг, бараа санал болгоё 🛍️',
};

const QUICK: Record<Mode, string[]> = {
  help: ['Захиалга хянах', 'QPay төлбөр', 'Буцаалт', 'Дэлгүүр нээх'],
  shop: ['50,000₮-н бэлэг', 'Гэрийн тавилга', 'Хямдралтай бараа'],
};

const MODE_META: Record<
  Mode,
  { label: string; short: string; Icon: typeof Bot; accent: string; header: string }
> = {
  help: {
    label: 'Тусламж',
    short: 'Захиалга · хүргэлт · QPay',
    Icon: Headphones,
    accent: '#E8242C',
    header: 'from-[#E8242C] to-[#C41E25]',
  },
  shop: {
    label: 'Бараа хайх',
    short: 'Санал · төсөв · бэлэг',
    Icon: Sparkles,
    accent: '#7C3AED',
    header: 'from-violet-600 to-fuchsia-500',
  },
};

export default function EsellerAssistant() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('help');
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', content: WELCOME.help, time: ts() },
  ]);
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, mode]);

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setHistory([]);
    setMessages([
      { id: uid(), role: 'assistant', content: WELCOME[next], time: ts() },
    ]);
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
            body: JSON.stringify({ message: text, history }),
          });

          if (!res.ok) {
            throw new Error('shop api');
          }

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
            const finalText = full || 'Бараа олдсонгүй. Өөр түлхүүр үгээр хайна уу.';
            if (!full) {
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
              ? { ...m, content: 'Алдаа гарлаа. Дахин оролдоно уу.' }
              : m,
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [history, input, loading, mode],
  );

  const meta = MODE_META[mode];

  return (
    <>
      {/* Single FAB — above MobileNav */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Туслах хаах' : 'eseller туслах нээх'}
        aria-expanded={open}
        className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] right-4 z-[9000] flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-0 bg-gradient-to-br from-[#E8242C] to-[#9F1239] text-white shadow-lg shadow-red-900/30 transition active:scale-95 hover:scale-105 md:bottom-6 md:right-6"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="eseller туслах"
          className="fixed inset-x-0 bottom-0 top-auto z-[8990] flex max-h-[min(88dvh,640px)] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] shadow-2xl sm:inset-x-auto sm:bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+4.5rem)] sm:right-4 sm:top-auto sm:max-h-[min(560px,calc(100dvh-8rem))] sm:w-[min(400px,calc(100vw-1.5rem))] sm:rounded-2xl md:bottom-[5.5rem] md:right-6"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {/* Drag handle (mobile) */}
          <div className="flex shrink-0 justify-center pt-2 pb-0 sm:hidden" aria-hidden>
            <div className="h-1 w-10 rounded-full bg-[var(--esl-border)]" />
          </div>

          {/* Header */}
          <div className={`flex shrink-0 items-center gap-3 bg-gradient-to-r ${meta.header} px-4 py-3`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white">eseller туслах</div>
              <div className="truncate text-[11px] text-white/75">{meta.short}</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Хаах"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-0 bg-white/15 text-white hover:bg-white/25"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode tabs */}
          <div className="flex shrink-0 gap-1 border-b border-[var(--esl-border)] bg-[var(--esl-bg-section)] p-1.5">
            {(Object.keys(MODE_META) as Mode[]).map((key) => {
              const m = MODE_META[key];
              const active = mode === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => switchMode(key)}
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-0 px-2 py-2 text-xs font-bold transition ${
                    active
                      ? 'bg-[var(--esl-bg-card)] text-[var(--esl-text-primary)] shadow-sm'
                      : 'bg-transparent text-[var(--esl-text-muted)]'
                  }`}
                >
                  <m.Icon className="h-3.5 w-3.5" style={active ? { color: m.accent } : undefined} />
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Messages */}
          <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain p-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] whitespace-pre-wrap px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-[16px_16px_4px_16px] text-white'
                      : 'rounded-[16px_16px_16px_4px] bg-[var(--esl-bg-section)] text-[var(--esl-text-primary)]'
                  }`}
                  style={
                    msg.role === 'user'
                      ? { background: meta.accent }
                      : undefined
                  }
                >
                  {msg.content ? (
                    <>
                      {msg.content}
                      <div className="mt-1 text-right text-[10px] opacity-50">{msg.time}</div>
                    </>
                  ) : (
                    <span className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-60"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 2 && (
            <div className="flex shrink-0 flex-wrap gap-1.5 px-3 pb-1">
              {QUICK[mode].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  disabled={loading}
                  className="cursor-pointer rounded-full border border-[var(--esl-border)] bg-[var(--esl-bg-section)] px-2.5 py-1 text-[11px] font-medium text-[var(--esl-text-muted)] transition hover:border-[#E8242C]/50 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex shrink-0 gap-2 border-t border-[var(--esl-border)] p-2.5">
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
              placeholder={mode === 'help' ? 'Асуултаа бичнэ үү…' : 'Юу хайж байна вэ?'}
              disabled={loading}
              className="min-w-0 flex-1 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-section)] px-3.5 py-2.5 text-[13px] text-[var(--esl-text-primary)] outline-none focus:border-[#E8242C] disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={!input.trim() || loading}
              aria-label="Илгээх"
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-0 text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: input.trim() && !loading ? meta.accent : 'var(--esl-bg-section)' }}
            >
              <SendHorizonal className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
