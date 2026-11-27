'use client';
import Link from 'next/link';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared/Toast';
import { canUseAI, getSubscription, getCurrentPlan, saveSubscription } from '@/lib/subscription';
import { FileText, Lock, Sparkles, ClipboardCopy, CheckCircle, Briefcase, Smile, Flame, Gem } from 'lucide-react';

const TONES = [
  { id: 'professional', name: 'Мэргэжлийн', icon: <Briefcase className="w-4 h-4 inline" /> },
  { id: 'casual', name: 'Энгийн', icon: <Smile className="w-4 h-4 inline" /> },
  { id: 'exciting', name: 'Сэтгэл хөдлөм', icon: <Flame className="w-4 h-4 inline" /> },
  { id: 'luxury', name: 'Люкс', icon: <Gem className="w-4 h-4 inline" /> },
];

const LANGUAGES = [
  { id: 'mn', name: 'Монгол' },
  { id: 'en', name: 'English' },
];

function generateDescription(name: string, features: string, tone: string, lang: string): string {
  const featureList = features
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean);

  if (lang === 'en') {
    const toneMap: Record<string, string> = {
      professional: `Introducing ${name} - a premium product designed for those who value quality and reliability.`,
      casual: `Meet ${name}! Your new favorite product that makes life easier and more enjoyable.`,
      exciting: `🔥 You NEED ${name} in your life! This game-changing product is here to blow your mind!`,
      luxury: `Discover the exquisite ${name} - crafted with unparalleled attention to detail for the most discerning tastes.`,
    };
    let desc = toneMap[tone] || toneMap.professional;
    if (featureList.length > 0) {
      desc += '\n\nKey Features:\n' + featureList.map((f) => `• ${f}`).join('\n');
    }
    desc += `\n\nOrder now and experience the difference with ${name}.`;
    return desc;
  }

  const toneMap: Record<string, string> = {
    professional: `${name} — чанар, найдвартай байдлыг эрхэмлэдэг хэрэглэгчдэд зориулсан дээд зэргийн бүтээгдэхүүн.`,
    casual: `${name}-г танилцуулъя! Таны амьдралыг илүү хялбар, тав тухтай болгох шинэ найз.`,
    exciting: `🔥 ${name} — таны амьдралыг БҮРЭН өөрчлөх гайхалтай бүтээгдэхүүн! Энэ боломжийг бүү алд!`,
    luxury: `${name} — дэлхийн жишигт нийцсэн, хамгийн өндөр стандартаар бүтээгдсэн онцгой бүтээгдэхүүн.`,
  };

  let desc = toneMap[tone] || toneMap.professional;

  if (featureList.length > 0) {
    desc += '\n\nОнцлог шинж чанарууд:\n' + featureList.map((f) => `✅ ${f}`).join('\n');
  }

  const closingMap: Record<string, string> = {
    professional: `\n\n${name}-г одоо захиалж, чанарын ялгааг мэдрээрэй.`,
    casual: `\n\nЗа яах вэ, ${name}-г туршаад үзэх үү? 😉`,
    exciting: `\n\n⚡ ОДОО ЗАХИАЛААРАЙ! Тоо хязгаартай! ⚡`,
    luxury: `\n\nТаны хүсэл тэмүүлэлд нийцсэн ${name} — онцгой сонголт.`,
  };

  desc += closingMap[tone] || closingMap.professional;
  return desc;
}

export default function AIDescriptionPage() {
  const toast = useToast();
  const [productName, setProductName] = useState('');
  const [features, setFeatures] = useState('');
  const [tone, setTone] = useState('professional');
  const [lang, setLang] = useState('mn');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const deferred = window.setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => window.clearTimeout(deferred);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--esl-bg-section)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#E8242C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const aiCheck = canUseAI();
  const plan = getCurrentPlan();
  const sub = getSubscription();
  const remainingCredits = plan.limits.aiCredits === -1 ? 'Хязгааргүй' : Math.max(0, plan.limits.aiCredits - sub.aiCreditsUsed);

  if (!aiCheck.allowed) {
    return (
      <div className="min-h-screen bg-[var(--esl-bg-section)] p-4 md:p-6">
        <div className="bg-gradient-to-r from-blue-600 to-[#C41E25] rounded-xl p-8 text-center text-white mb-6">
          <span className="text-4xl mb-3 block"><FileText className="w-10 h-10 mx-auto" /></span>
          <h1 className="text-2xl font-bold">AI Тайлбар бичигч</h1>
          <p className="opacity-90 mt-1">Бүтээгдэхүүний тайлбар автоматаар бич</p>
        </div>
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-8 text-center max-w-lg mx-auto">
          <span className="text-5xl block mb-4"><Lock className="w-12 h-12 mx-auto" /></span>
          <h2 className="text-xl font-bold text-[var(--esl-text-primary)] mb-2">AI боломж хязгаарлагдсан</h2>
          <p className="text-[var(--esl-text-secondary)] mb-4">Энэ боломжийг ашиглахын тулд Стандарт эсвэл дээш багц руу шилжинэ үү.</p>
          <Link href="/dashboard/store/package" className="inline-block bg-gradient-to-r from-blue-500 to-[#C41E25] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition">
            Багц шинэчлэх
          </Link>
        </div>
      </div>
    );
  }

  function handleGenerate() {
    if (!productName.trim()) {
      toast.show('Барааны нэр оруулна уу', 'warn');
      return;
    }
    setGenerating(true);
    setTimeout(() => {
      const desc = generateDescription(productName, features, tone, lang);
      setResult(desc);
      const newSub = { ...sub, aiCreditsUsed: sub.aiCreditsUsed + 1 };
      saveSubscription(newSub);
      setGenerating(false);
      toast.show('Тайлбар амжилттай үүслээ!', 'ok');
    }, 1500);
  }

  function handleCopy() {
    navigator.clipboard.writeText(result).then(() => {
      toast.show('Хуулагдлаа!', 'ok');
    });
  }

  function handleApply() {
    toast.show('Бүтээгдэхүүнд хэрэгжүүлэх боломж удахгүй нэмэгдэнэ', 'ok');
  }

  return (
    <div className="min-h-screen bg-[var(--esl-bg-section)] p-4 md:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-[#C41E25] rounded-xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-7 h-7" /> AI Тайлбар бичигч</h1>
            <p className="opacity-90 text-sm mt-1">Бүтээгдэхүүний борлуулалтыг нэмэгдүүлэх мэргэжлийн тайлбар бич</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-sm">
            AI кредит: <span className="font-bold">{remainingCredits}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6">
          <h2 className="font-bold text-[var(--esl-text-primary)] mb-4">Мэдээлэл оруулах</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Барааны нэр</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Жишээ: Premium цагаан цамц"
              className="w-full border border-[var(--esl-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--esl-text-primary)] focus:ring-2 focus:ring-[#E8242C]/40 focus:border-[#E8242C] outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Гол онцлогууд (мөр тус бүрт 1)</label>
            <textarea
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              rows={4}
              placeholder={"100% цэвэр хөвөн\nS, M, L, XL хэмжээтэй\nМонгол үйлдвэрлэл"}
              className="w-full border border-[var(--esl-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--esl-text-primary)] focus:ring-2 focus:ring-[#E8242C]/40 focus:border-[#E8242C] outline-none resize-none"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-2">Өнгө аяс</label>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    tone === t.id
                      ? 'border-[#E8242C] bg-[var(--esl-brand-bg)] text-[#E8242C]'
                      : 'border-[var(--esl-border)] text-[var(--esl-text-primary)] hover:border-[var(--esl-border-strong)]'
                  }`}
                >
                  <span className="mr-1 inline-flex">{t.icon}</span> {t.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-2">Хэл</label>
            <div className="flex gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLang(l.id)}
                  className={`flex-1 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    lang === l.id
                      ? 'border-[#E8242C] bg-[var(--esl-brand-bg)] text-[#E8242C]'
                      : 'border-[var(--esl-border)] text-[var(--esl-text-primary)] hover:border-[var(--esl-border-strong)]'
                  }`}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !productName.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-[#C41E25] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Бичиж байна...
              </>
            ) : (
              <><Sparkles className="w-4 h-4" /> Тайлбар үүсгэх</>
            )}
          </button>
        </div>

        {/* Result */}
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6">
          <h2 className="font-bold text-[var(--esl-text-primary)] mb-4">Үр дүн</h2>

          {result ? (
            <div>
              <div className="bg-[var(--esl-bg-section)] rounded-xl border border-[var(--esl-border)] p-4 mb-4 whitespace-pre-wrap text-sm text-[var(--esl-text-primary)] leading-relaxed min-h-[200px]">
                {result}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-800 transition flex items-center justify-center gap-2"
                >
                  <ClipboardCopy className="w-4 h-4" /> Хуулах
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 bg-[#E8242C] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[#C41E25] transition flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Бараанд хэрэгжүүлэх
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-[var(--esl-bg-section)] rounded-xl border-2 border-dashed border-[var(--esl-border)]">
              <div className="text-center text-[var(--esl-text-muted)]">
                <span className="block mb-2"><FileText className="w-10 h-10 mx-auto" /></span>
                <p className="text-sm">Мэдээлэл оруулж тайлбар үүсгэнэ үү</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
