'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '@/lib/api';
import { formatPrice, discountPercent } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  Bot, X, Send, Mic, MicOff, Volume2, VolumeX, Sparkles,
  ShoppingCart, Star, ChevronRight, Lightbulb, MessageCircle,
  Zap, Target, ThumbsUp,
} from 'lucide-react';

interface AIProductMentorProps {
  product: Product;
  onClose: () => void;
  onStartSelling?: (product: Product) => void;
  username: string;
}

interface Message {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: Date;
  /** false — AI холбогдоогүй, барааны мэдээлэлд тулгуурласан энгийн зөвлөмж */
  ai?: boolean;
}


const QUICK_QUESTIONS = [
  { icon: Star, label: 'Давуу тал юу вэ?' },
  { icon: Target, label: 'Яаж зарах вэ?' },
  { icon: MessageCircle, label: 'Асуултад яаж хариулах?' },
  { icon: Zap, label: 'Өрсөлдөгчтэй харьцуулбал?' },
];

export default function AIProductMentor({ product, onClose, onStartSelling, username }: AIProductMentorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'ai',
      content: `Сайн байна уу! "${product.name}"-ийг хэрхэн санал болгох талаар асуугаарай — гол онцлог, пост бичих, хэрэглэгчийн асуултад хариулах.\n\nЗөвлөгөө нь барааны хуудсан дээрх мэдээлэлд тулгуурлана.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || typing) return;

    const now = new Date();
    const userMsg: Message = { id: `u${now.getTime()}`, role: 'user', content: text, timestamp: now };
    const history = messages.slice(1).map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }));
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    let reply = 'Хариу авч чадсангүй. Дахин оролдоно уу.';
    let ai = false;
    try {
      const r = await fetch('/api/ai/product-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          product: { name: product.name, price: product.price, salePrice: product.salePrice, category: product.category, description: product.description, commission: product.commission },
        }),
      });
      const b = await r.json();
      if (b?.success && b.data?.reply) { reply = b.data.reply; ai = Boolean(b.data.ai); }
    } catch { /* сүлжээний алдаа */ }
    setMessages((prev) => [...prev, { id: `a${now.getTime()}`, role: 'ai', content: reply, timestamp: new Date(), ai }]);
    setTyping(false);
  };

  const disc = discountPercent(product.price, product.salePrice);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-3 sm:inset-auto sm:right-4 sm:top-4 sm:bottom-4 sm:w-[440px] bg-[var(--esl-bg-card)] rounded-2xl z-[999] flex flex-col shadow-2xl overflow-hidden"
        initial={{ opacity: 0, x: 60, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 60, scale: 0.95 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6366F1] to-[#4338CA] px-5 py-4 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">AI Бүтээгдэхүүний зөвлөх</h3>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-white/60">Бэлэн</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setVoiceOn(!voiceOn)}
                className="w-8 h-8 rounded-lg bg-white/10 border-none cursor-pointer flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition"
              >
                {voiceOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 border-none cursor-pointer flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Product mini card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center text-2xl shrink-0">
              {product.emoji || '📦'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate">{product.name}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{formatPrice(product.salePrice || product.price)}</span>
                {disc > 0 && <span className="text-[10px] text-white/50 line-through">{formatPrice(product.price)}</span>}
                {product.commission && <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">{product.commission}%</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[var(--esl-bg-section)]">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div className={cn(
                'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-[#6366F1] text-white rounded-br-md'
                  : 'bg-[var(--esl-bg-card)] text-[var(--esl-text-primary)] border border-[var(--esl-border)] rounded-bl-md shadow-sm'
              )}>
                {msg.role === 'ai' && (
                  <div className="flex items-center gap-1 text-[10px] text-[#6366F1] font-bold mb-1.5">
                    <Sparkles className="w-3 h-3" /> {msg.ai === false ? 'Зөвлөмж' : 'AI Зөвлөх'}
                  </div>
                )}
                <div className="whitespace-pre-line text-[13px]">{msg.content}</div>
              </div>
            </motion.div>
          ))}

          {typing && (
            <div className="flex justify-start">
              <div className="bg-[var(--esl-bg-card)] rounded-2xl rounded-bl-md px-4 py-3 border border-[var(--esl-border)] shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#6366F1] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#6366F1] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#6366F1] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick questions */}
        {messages.length <= 2 && (
          <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-none bg-[var(--esl-bg-section)] border-t border-[var(--esl-border)]">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q.label}
                onClick={() => sendMessage(q.label)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl text-xs font-semibold text-[var(--esl-text-secondary)] hover:border-[#6366F1] hover:text-[#6366F1] transition-all cursor-pointer"
              >
                <q.icon className="w-3 h-3" />
                {q.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t border-[var(--esl-border)] bg-[var(--esl-bg-card)] shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                placeholder="Асуултаа бичнэ үү..."
                className="w-full bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-xl pl-4 pr-10 py-2.5 text-sm outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/10 transition-all"
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-transparent border-none cursor-pointer text-[var(--esl-text-muted)] hover:text-[#6366F1] transition flex items-center justify-center"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className={cn(
                'w-10 h-10 rounded-xl border-none cursor-pointer flex items-center justify-center transition-all',
                input.trim()
                  ? 'bg-[#6366F1] text-white shadow-[0_2px_8px_rgba(99,102,241,.3)] hover:bg-[#4F46E5]'
                  : 'bg-[var(--esl-bg-section)] text-[#CBD5E1] cursor-not-allowed'
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Start selling CTA */}
          {onStartSelling && (
            <button
              onClick={() => onStartSelling(product)}
              className="w-full mt-2 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold rounded-xl border-none cursor-pointer hover:shadow-[0_4px_12px_rgba(16,185,129,.3)] transition-all flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Борлуулж эхлэх
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
