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
}

/* Mock AI responses based on product */
function getAIResponse(product: Product, userMsg: string): string {
  const q = userMsg.toLowerCase();
  const name = product.name;
  const price = formatPrice(product.salePrice || product.price);

  if (q.includes('давуу') || q.includes('онцлог') || q.includes('юу'))
    return `${name}-ийн гол давуу тал:\n\n✅ Чанарын баталгаатай — 4.5+ үнэлгээтэй\n✅ Хурдан хүргэлт — УБ дотор 2-4 цаг\n✅ Буцаалтын бодлого — 7 хоногийн дотор\n✅ QPay аюулгүй төлбөр\n\nҮнэ: ${price} — зах зээлийн дундаж үнээс 15% хямд.`;

  if (q.includes('яаж') || q.includes('зар') || q.includes('борлуул'))
    return `${name}-г зарах шилдэг стратеги:\n\n1️⃣ Story-д бараагийн зургийг "Before/After" хэлбэрээр тавь\n2️⃣ "Миний хэрэглэж үзсэн сэтгэгдэл" гэж бичээд найдвартай мэт харагдуул\n3️⃣ Хязгаарлагдмал хугацааны хямдрал гэдгийг онцол\n4️⃣ QR код бүхий poster хий, offline-д ч тараа\n\n💡 Зөвлөгөө: Оройн 19-21 цагт нийтлэвэл хамгийн үр дүнтэй.`;

  if (q.includes('асуулт') || q.includes('хариул') || q.includes('татгалз'))
    return `Хэрэглэгчийн түгээмэл асуултууд:\n\n❓ "Үнэтэй байна" → "Чанартай бараа удаан эдлэгддэг. Мөн одоо хямдралтай байгаа шүү!"\n\n❓ "Дараа авъя" → "Энэ хямдрал зөвхөн энэ долоо хоногт л байгаа. Линк илгээчихье?"\n\n❓ "Жинхэнэ юм уу?" → "Баталгаатай, буцаалтын бодлоготой. 500+ хэрэглэгч авсан."`;

  if (q.includes('харьцуул') || q.includes('өрсөлд'))
    return `${name}-ийн өрсөлдөх давуу тал:\n\n📊 Зах зээлийн дундаж үнэ: ${formatPrice((product.price || 0) * 1.15)}\n💰 Бидний үнэ: ${price}\n🚚 Хүргэлт: 2-4 цаг (өрсөлдөгч: 1-3 хоног)\n⭐ Үнэлгээ: ${product.rating || 4.5}/5\n🔄 Буцаалт: 7 хоног (өрсөлдөгч: байхгүй)\n\nЭнэ бараа таны хэрэглэгчдэд хамгийн сайн сонголт!`;

  return `${name}-ийн талаар:\n\nЭнэ бүтээгдэхүүн ${product.category || 'ерөнхий'} ангилалд хамаарна. Үнэ ${price}, ${product.commission ? product.commission + '% шимтгэлтэй' : 'шимтгэлтэй'}.\n\n${product.description || 'Чанартай, баталгаатай бүтээгдэхүүн.'}\n\nНадаас юу ч асуугаарай — давуу тал, зарах арга, хэрэглэгчийн асуултад хариулах гэх мэт! 🚀`;
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
      content: `Сайн байна уу! 🤖 Би "${product.name}"-ийн AI зөвлөх байна.\n\nЭнэ бүтээгдэхүүний талаар бүх зүйлийг мэднэ — давуу тал, зарах арга, хэрэглэгчийн асуултад хариулах стратеги.\n\nЮу мэдмээр байна?`,
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

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: getAIResponse(product, text),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setTyping(false);
    }, 800 + Math.random() * 1200);
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
                    <Sparkles className="w-3 h-3" /> AI Зөвлөх
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
