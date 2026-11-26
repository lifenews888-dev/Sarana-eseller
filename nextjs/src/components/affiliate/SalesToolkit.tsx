'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Copy, Check, Send, QrCode, Download, Link2,
  ChevronDown, HelpCircle, Sparkles, Shield,
  Image, FileText, GraduationCap, Play, Eye, ShoppingCart,
  MousePointerClick, ExternalLink, Smartphone, MessageCircle,
  Hash, Camera, Music, MessageSquare, Bird, ClipboardCopy,
  type LucideIcon,
} from 'lucide-react';

interface SalesToolkitProps {
  refLink: string;
  username: string;
  onCopy: (text: string, id?: string) => void;
  copiedId: string | null;
}

/* ═══ Constants ═══ */


const SHARE_CHANNELS: { name: string; icon: LucideIcon; color: string; url: string }[] = [
  { name: 'Messenger', icon: MessageSquare, color: '#0084FF', url: 'https://m.me/?ref=' },
  { name: 'Facebook', icon: Hash, color: '#1877F2', url: 'https://www.facebook.com/sharer/sharer.php?u=' },
  { name: 'Instagram', icon: Camera, color: '#E4405F', url: 'https://instagram.com' },
  { name: 'TikTok', icon: Music, color: '#010101', url: 'https://tiktok.com' },
  { name: 'WhatsApp', icon: MessageCircle, color: '#25D366', url: 'https://wa.me/?text=' },
  { name: 'Twitter/X', icon: Bird, color: '#1DA1F2', url: 'https://twitter.com/intent/tweet?url=' },
];

const CREATIVE_POSTERS = [
  { id: 1, title: 'Хямдрал зар', emoji: '🔥', bg: 'from-red-500 to-orange-500', desc: 'Хямдралтай бараа сурталчлах' },
  { id: 2, title: 'Шинэ бараа', emoji: '✨', bg: 'from-indigo-500 to-purple-600', desc: 'Шинэ ирэлт танилцуулах' },
  { id: 3, title: 'Flash Sale', emoji: '⚡', bg: 'from-amber-500 to-red-500', desc: 'Цаг хугацаатай хямдрал' },
  { id: 4, title: 'Бүтээгдэхүүн', emoji: '📦', bg: 'from-emerald-500 to-teal-600', desc: 'Бүтээгдэхүүний танилцуулга' },
  { id: 5, title: 'Ам сайн хүн', emoji: '💬', bg: 'from-blue-500 to-cyan-500', desc: 'Сэтгэгдэл харуулах' },
  { id: 6, title: 'Үнэгүй хүргэлт', emoji: '🚚', bg: 'from-violet-500 to-fuchsia-500', desc: 'Хүргэлтийн урамшуулал' },
];

const COPY_TEMPLATES = {
  story: [
    { title: 'Хямдралын Story', text: '⚡ ЗӨВХӨН ӨНӨӨДӨР!\n\nЭнэ бүтээгдэхүүн {discount}% хямдарлаа 🔥\n\nSwipe up 👆 эсвэл линк bio-д\n{link}' },
    { title: 'Шинэ бараа Story', text: '✨ ШИНЭ ИРЭЛТ!\n\nМиний санал болгож буй бүтээгдэхүүн 💯\nЧанар, үнэ хоёулаа 👌\n\n{link}' },
    { title: 'Countdown Story', text: '⏰ 3 цагийн дотор дуусна!\n\n🔥 Энэ үнээр авах сүүлийн боломж\n📦 Үнэгүй хүргэлт\n\nОдоо захиал 👇\n{link}' },
  ],
  post: [
    { title: 'Бараа танилцуулга', text: '🔥 Та энэ бүтээгдэхүүнийг шалгаж үзсэн үү?\n\n✅ Чанарын баталгаатай\n✅ Хурдан хүргэлт\n✅ QPay аюулгүй төлбөр\n\nМиний линкээр орж үзээрэй 👇\n{link}\n\n#eseller #shopping #хямдрал #онлайндэлгүүр' },
    { title: 'Хэрэглэгчийн сэтгэгдэл', text: '⭐⭐⭐⭐⭐\n\n"Маш сэтгэл хангалуун! Чанар маш сайн, хүргэлт хурдан байсан."\n— Баталгаажсан хэрэглэгч\n\nТа ч гэсэн туршаад үзээрэй 👇\n{link}' },
    { title: 'Хямдралын мэдэгдэл', text: '🚨 АНХААРУУЛГА: ХЯМДРАЛ!\n\nЭнэ долоо хоногт л энэ үнээр авах боломжтой 💰\n\n📦 Үнэгүй хүргэлт\n🔒 QPay аюулгүй төлбөр\n⭐ 4.8/5 үнэлгээтэй\n\nЗахиалах 👇\n{link}' },
  ],
  message: [
    { title: 'Найзад санал болгох', text: 'Сайн уу! 😊 Чамд энэ бараа таарна гэж бодоод л. Чанартай, үнэ зохистой. Энд харна уу: {link}' },
    { title: 'Буцаж холбогдох', text: 'Сайн байна уу! Өмнө нь бараанд сонирхол татсан байсан. Одоо хямдарсан байна 🔥 дахиад харна уу? {link}' },
    { title: 'Шинэ хэрэглэгчид', text: 'Сайн байна уу! eseller.mn дээр маш сайн бараанууд байгаа. Та ч нэг шалгаад үзээрэй? 😊 {link}' },
  ],
};

const TRAINING_VIDEOS = [
  { title: 'Facebook-р хэрхэн зарах вэ?', duration: '2:30', views: 1240, emoji: '📱', level: 'Анхан' },
  { title: 'TikTok богино видео хийх', duration: '1:45', views: 890, emoji: '🎵', level: 'Анхан' },
  { title: 'Story ашиглан борлуулах', duration: '3:10', views: 2100, emoji: '📸', level: 'Дунд' },
  { title: 'Messenger-р хэрхэн хандах', duration: '2:00', views: 650, emoji: '💬', level: 'Анхан' },
  { title: 'QR код ашиглах стратеги', duration: '1:20', views: 430, emoji: '📲', level: 'Дунд' },
  { title: 'Шилдэг борлуулагчийн нууц', duration: '4:15', views: 3200, emoji: '🏆', level: 'Дээд' },
];

const FAQ_ITEMS = [
  { q: 'Үнэтэй байна', a: 'Бид чанарын баталгаатай бараа санал болгодог. Мөн одоо хямдралтай цагт авбал ашигтай. Хэрэв та захиалвал хүргэлт ҮНЭГҮЙ.', tag: 'Үнэ' },
  { q: 'Дараа авъя', a: 'Мэдээж! Гэхдээ энэ хямдрал зөвхөн энэ долоо хоногт байгаа шүү. Би танд линк илгээчихье, дараа нь хэзээ ч авч болно.', tag: 'Хүлээлт' },
  { q: 'Чанар яаж байгаа юм?', a: 'Бүх бараа баталгаатай, буцаалтын бодлоготой. Одоо хүртэл 4.5+ үнэлгээтэй. Сэтгэгдлүүдийг харуулж болно.', tag: 'Чанар' },
  { q: 'Хүргэлт хэр удаан вэ?', a: 'Улаанбаатар дотор 2-4 цаг, хөдөө орон нутагт 1-3 хоног. QPay-р аюулгүй төлбөр хийнэ.', tag: 'Хүргэлт' },
  { q: 'Буцаалт хийж болох уу?', a: 'Тийм! 7 хоногийн дотор буцаалт хийх боломжтой. Бараа гэмтээгүй, ашиглаагүй байхад.', tag: 'Буцаалт' },
];

type ToolkitTab = 'creative' | 'copywriting' | 'training';

const TOOLKIT_TABS: { key: ToolkitTab; label: string; icon: React.ElementType }[] = [
  { key: 'creative', label: 'Контент сан', icon: Image },
  { key: 'copywriting', label: 'Бэлэн бичвэр', icon: FileText },
  { key: 'training', label: 'Сургалт', icon: GraduationCap },
];

/* ═══ Component ═══ */

export default function SalesToolkit({ refLink, username, onCopy, copiedId }: SalesToolkitProps) {
  const [activeTab, setActiveTab] = useState<ToolkitTab>('creative');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [copySection, setCopySection] = useState<'story' | 'post' | 'message'>('story');

  const shortLink = `eseller.mn/r/${username}`;

  return (
    <div className="space-y-6">

      {/* ════════════════════════════════════════
          ONE-CLICK SHARE + SHORT URL
          ════════════════════════════════════════ */}
      <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[var(--esl-text-primary)] text-sm flex items-center gap-2">
            <Send className="w-4 h-4 text-[#6366F1]" />
            Нэг товшилтоор хуваалцах
          </h3>
          {/* Short URL */}
          <button
            onClick={() => onCopy(refLink, 'short-url')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer',
              copiedId === 'short-url'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)] hover:bg-[#6366F1] hover:text-white'
            )}
          >
            <Link2 className="w-3 h-3" />
            {copiedId === 'short-url' ? '✓ Хуулсан' : shortLink}
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {SHARE_CHANNELS.map((ch) => (
            <a
              key={ch.name}
              href={`${ch.url}${encodeURIComponent(refLink)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[var(--esl-border)] hover:shadow-md hover:-translate-y-1 transition-all no-underline group"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-transform group-hover:scale-110" style={{ background: ch.color + '10' }}>
                <ch.icon className="w-5 h-5" style={{ color: ch.color }} />
              </div>
              <span className="text-[10px] font-semibold text-[var(--esl-text-secondary)]">{ch.name}</span>
            </a>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════
          3-TAB STRUCTURE
          ════════════════════════════════════════ */}
      <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl overflow-hidden">
        {/* Tab header */}
        <div className="flex border-b border-[var(--esl-border)]">
          {TOOLKIT_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all border-none cursor-pointer',
                activeTab === t.key
                  ? 'bg-[#6366F1] text-white'
                  : 'bg-[var(--esl-bg-card)] text-[var(--esl-text-muted)] hover:bg-[var(--esl-bg-section)] hover:text-[var(--esl-text-secondary)]'
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ═══ TAB 1: Creative Hub ═══ */}
          {activeTab === 'creative' && (
            <div className="space-y-6">
              {/* QR Code — branded */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-[var(--esl-border)]">
                <div className="relative shrink-0">
                  <div className="w-40 h-40 bg-[var(--esl-bg-card)] rounded-2xl border-2 border-[#6366F1]/20 flex items-center justify-center p-2.5 shadow-[0_4px_20px_rgba(99,102,241,.08)]">
                    <img loading="lazy" src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(refLink)}&bgcolor=ffffff&color=4338CA`} alt="QR" className="w-full h-full" width={160} height={160} />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#6366F1] text-white text-[9px] font-bold px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                    @{username}
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="text-sm font-bold text-[var(--esl-text-primary)] mb-1">Брэнд QR код</h4>
                  <p className="text-xs text-[var(--esl-text-muted)] mb-3 leading-relaxed">Poster, визит карт, нийтлэл дээрээ байршуулж болно</p>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <a href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(refLink)}&bgcolor=ffffff&color=4338CA&format=png`} download={`eseller-${username}-qr.png`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#6366F1] text-white rounded-lg text-xs font-bold no-underline hover:bg-[#4F46E5] transition-all">
                      <Download className="w-3.5 h-3.5" /> PNG татах
                    </a>
                  </div>
                </div>
              </div>

              {/* Poster Grid */}
              <div>
                <h4 className="text-sm font-bold text-[var(--esl-text-primary)] mb-3 flex items-center gap-2">
                  <Image className="w-4 h-4 text-[#6366F1]" />
                  Бэлэн постерууд
                  <span className="text-[10px] text-[var(--esl-text-muted)] font-medium">QR код автоматаар нэмэгдсэн</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CREATIVE_POSTERS.map((p) => (
                    <div key={p.id} className="group relative rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all">
                      <div className={`bg-gradient-to-br ${p.bg} aspect-[4/5] flex flex-col items-center justify-center text-white p-4 relative`}>
                        <div className="absolute top-3 right-3 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                          <QrCode className="w-5 h-5 text-white/80" />
                        </div>
                        <span className="text-4xl mb-2">{p.emoji}</span>
                        <span className="text-sm font-bold text-center">{p.title}</span>
                        <span className="text-[10px] text-white/70 mt-0.5">{p.desc}</span>
                        <span className="absolute bottom-2 text-[8px] text-white/40 font-mono">@{username}</span>
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button className="bg-[var(--esl-bg-card)] text-[var(--esl-text-primary)] px-4 py-2 rounded-lg text-xs font-bold border-none cursor-pointer flex items-center gap-1 hover:bg-[var(--esl-bg-section)] transition">
                          <Download className="w-3 h-3" /> Татах
                        </button>
                        <button className="bg-white/20 text-white px-4 py-2 rounded-lg text-xs font-bold border-none cursor-pointer backdrop-blur-sm flex items-center gap-1 hover:bg-white/30 transition">
                          <ExternalLink className="w-3 h-3" /> Засах
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB 2: Copywriting ═══ */}
          {activeTab === 'copywriting' && (
            <div className="space-y-5">
              {/* Sub-tabs */}
              <div className="flex gap-2">
                {[
                  { key: 'story' as const, label: 'Story текст', icon: Smartphone },
                  { key: 'post' as const, label: 'Post текст', icon: FileText },
                  { key: 'message' as const, label: 'Мессеж', icon: MessageCircle },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setCopySection(s.key)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer',
                      copySection === s.key
                        ? 'bg-[#6366F1] text-white shadow-sm'
                        : 'bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)] hover:bg-[#E2E8F0]'
                    )}
                  >
                    <s.icon className="w-3.5 h-3.5" />
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Templates */}
              <div className="space-y-3">
                {COPY_TEMPLATES[copySection].map((t, i) => (
                  <div key={i} className="bg-[var(--esl-bg-section)] rounded-xl p-4 border border-[var(--esl-border)] hover:border-[#6366F1]/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-[var(--esl-text-primary)]">{t.title}</span>
                      <button
                        onClick={() => onCopy(t.text.replace(/\{link\}/g, refLink).replace(/\{discount\}/g, '30'), `copy-${copySection}-${i}`)}
                        className={cn(
                          'text-xs font-bold px-3 py-1.5 rounded-lg transition-all border-none cursor-pointer flex items-center gap-1',
                          copiedId === `copy-${copySection}-${i}`
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-[var(--esl-bg-card)] text-[#6366F1] hover:bg-[#6366F1] hover:text-white border border-[var(--esl-border)]'
                        )}
                      >
                        {copiedId === `copy-${copySection}-${i}` ? <><Check className="w-3 h-3" /> Хуулсан</> : <><Copy className="w-3 h-3" /> Хуулах</>}
                      </button>
                    </div>
                    <p className="text-xs text-[var(--esl-text-secondary)] leading-relaxed whitespace-pre-line bg-[var(--esl-bg-card)] rounded-lg p-3 border border-[var(--esl-border)]">
                      {t.text.replace(/\{link\}/g, refLink).replace(/\{discount\}/g, '30')}
                    </p>
                  </div>
                ))}
              </div>

              {/* FAQ */}
              <div className="pt-4 border-t border-[var(--esl-border)]">
                <h4 className="text-sm font-bold text-[var(--esl-text-primary)] mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#6366F1]" />
                  Татгалзалд хариулах шигшмэл хариулт
                </h4>
                <div className="space-y-2">
                  {FAQ_ITEMS.map((faq, i) => (
                    <div key={i} className="border border-[var(--esl-border)] rounded-xl overflow-hidden">
                      <button
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-transparent border-none cursor-pointer text-left hover:bg-[var(--esl-bg-section)] transition-colors"
                      >
                        <HelpCircle className="w-4 h-4 text-[var(--esl-text-muted)] shrink-0" />
                        <span className="flex-1 text-sm font-semibold text-[var(--esl-text-primary)]">&ldquo;{faq.q}&rdquo;</span>
                        <span className="text-[10px] font-bold text-[var(--esl-text-muted)] bg-[var(--esl-bg-section)] px-2 py-0.5 rounded">{faq.tag}</span>
                        <ChevronDown className={cn('w-4 h-4 text-[var(--esl-text-muted)] transition-transform', openFaq === i && 'rotate-180')} />
                      </button>
                      {openFaq === i && (
                        <div className="px-4 pb-3">
                          <div className="bg-[#EEF2FF] rounded-lg p-3 border border-[#6366F1]/10">
                            <div className="text-[10px] font-bold text-[#6366F1] mb-1 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Санал болгох хариулт
                            </div>
                            <p className="text-xs text-[var(--esl-text-secondary)] leading-relaxed">{faq.a}</p>
                            <button
                              onClick={() => onCopy(faq.a, `faq-${i}`)}
                              className={cn('mt-2 text-[10px] font-bold px-2.5 py-1 rounded-md transition-all border-none cursor-pointer',
                                copiedId === `faq-${i}` ? 'bg-emerald-100 text-emerald-600' : 'bg-[var(--esl-bg-card)] text-[#6366F1] hover:bg-[#6366F1] hover:text-white')}
                            >
                              {copiedId === `faq-${i}` ? <><Check className="w-3 h-3 inline-block mr-0.5" /> Хуулсан</> : <><ClipboardCopy className="w-3 h-3 inline-block mr-0.5" /> Хуулах</>}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB 3: Training ═══ */}
          {activeTab === 'training' && (
            <div className="space-y-4">
              <p className="text-xs text-[var(--esl-text-muted)]">Шилдэг борлуулагчдын арга барилаас суралцаарай</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TRAINING_VIDEOS.map((v, i) => (
                  <div key={i} className="group flex items-center gap-3 p-3 rounded-xl border border-[var(--esl-border)] hover:border-[#6366F1]/20 hover:shadow-sm transition-all cursor-pointer">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#6366F1]/10 to-[#A78BFA]/10 flex items-center justify-center shrink-0 relative">
                      <span className="text-2xl">{v.emoji}</span>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-[#6366F1]/80 rounded-xl">
                        <Play className="w-5 h-5 text-white fill-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-bold text-[var(--esl-text-primary)] truncate group-hover:text-[#6366F1] transition-colors">{v.title}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-[var(--esl-text-muted)]">{v.duration}</span>
                        <span className="text-[10px] text-[var(--esl-text-muted)]">&middot;</span>
                        <span className="text-[10px] text-[var(--esl-text-muted)]">{v.views.toLocaleString()} үзсэн</span>
                        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded',
                          v.level === 'Анхан' ? 'bg-emerald-50 text-emerald-600' :
                          v.level === 'Дунд' ? 'bg-amber-50 text-amber-600' : 'bg-violet-50 text-violet-600'
                        )}>
                          {v.level}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tips */}
              <div className="bg-gradient-to-br from-[#EEF2FF] to-[#F5F3FF] rounded-xl border border-[#6366F1]/10 p-4 mt-4">
                <h4 className="text-sm font-bold text-[var(--esl-text-primary)] mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#6366F1]" /> Ахисан зөвлөгөө
                </h4>
                <ul className="space-y-1.5 text-xs text-[var(--esl-text-secondary)]">
                  <li className="flex items-start gap-2"><span className="text-[#6366F1] font-bold">1.</span> Бүтээгдэхүүнийг өөрөө туршиж үзсэн бол итгэлтэй санал болгоно</li>
                  <li className="flex items-start gap-2"><span className="text-[#6366F1] font-bold">2.</span> Оройн 19-21 цагт нийтэлбэл хамгийн олон хүнд хүрнэ</li>
                  <li className="flex items-start gap-2"><span className="text-[#6366F1] font-bold">3.</span> Reels/Story богино контент илүү хурдан тархдаг</li>
                  <li className="flex items-start gap-2"><span className="text-[#6366F1] font-bold">4.</span> QR кодоо визит карт, poster дээрээ заавал тавь</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
