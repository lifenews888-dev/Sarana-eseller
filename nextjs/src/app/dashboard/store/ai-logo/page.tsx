'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared/Toast';
import { canUseAI, getSubscription, getCurrentPlan, saveSubscription } from '@/lib/subscription';
import { Sparkles, Lock, Palette, UtensilsCrossed, Shirt, Monitor, Sparkle, Trophy } from 'lucide-react';

interface LogoHistory {
  id: string;
  businessName: string;
  industry: string;
  style: string;
  colors: string[];
  createdAt: string;
}

const INDUSTRIES = [
  { id: 'food', name: 'Хоол хүнс', icon: <UtensilsCrossed className="w-4 h-4 inline" /> },
  { id: 'fashion', name: 'Хувцас загвар', icon: <Shirt className="w-4 h-4 inline" /> },
  { id: 'tech', name: 'Технологи', icon: <Monitor className="w-4 h-4 inline" /> },
  { id: 'beauty', name: 'Гоо сайхан', icon: <Sparkle className="w-4 h-4 inline" /> },
  { id: 'sports', name: 'Спорт', icon: <Trophy className="w-4 h-4 inline" /> },
];

const LOGO_STYLES = [
  { id: 'modern', name: 'Орчин үеийн' },
  { id: 'classic', name: 'Сонгодог' },
  { id: 'playful', name: 'Хөгжилтэй' },
  { id: 'minimal', name: 'Минимал' },
];

const COLOR_PALETTES = [
  { id: 'blue', colors: ['#1a73e8', '#4285f4', '#8ab4f8'], name: 'Цэнхэр' },
  { id: 'green', colors: ['#0d652d', '#34a853', '#81c995'], name: 'Ногоон' },
  { id: 'red', colors: ['#c5221f', '#ea4335', '#f28b82'], name: 'Улаан' },
  { id: 'purple', colors: ['#7b1fa2', '#ab47bc', '#ce93d8'], name: 'Ягаан нил' },
  { id: 'orange', colors: ['#e65100', '#fb8c00', '#ffcc80'], name: 'Улбар шар' },
  { id: 'dark', colors: ['#202124', '#3c4043', '#5f6368'], name: 'Хар' },
];

const SHAPES: Record<string, string[]> = {
  food: ['●', '◆', '▲'],
  fashion: ['◇', '○', '□'],
  tech: ['⬡', '△', '◈'],
  beauty: ['✿', '◎', '❋'],
  sports: ['★', '⬟', '◆'],
};

export default function AILogoPage() {
  const toast = useToast();
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('food');
  const [style, setStyle] = useState('modern');
  const [palette, setPalette] = useState('blue');
  const [generating, setGenerating] = useState(false);
  const [logoGenerated, setLogoGenerated] = useState(false);
  const [history, setHistory] = useState<LogoHistory[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('eseller_logo_history');
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--esl-bg-section)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const aiCheck = canUseAI();
  const plan = getCurrentPlan();
  const sub = getSubscription();
  const remainingCredits = plan.limits.aiCredits === -1 ? 'Хязгааргүй' : Math.max(0, plan.limits.aiCredits - sub.aiCreditsUsed);
  const selectedPalette = COLOR_PALETTES.find((p) => p.id === palette)!;

  if (!aiCheck.allowed) {
    return (
      <div className="min-h-screen bg-[var(--esl-bg-section)] p-4 md:p-6">
        <div className="bg-gradient-to-r from-purple-600 to-[#C41E25] rounded-xl p-8 text-center text-white mb-6">
          <span className="text-4xl mb-3 block"><Sparkles className="w-10 h-10 mx-auto" /></span>
          <h1 className="text-2xl font-bold">AI Лого үүсгэгч</h1>
          <p className="opacity-90 mt-1">Бизнесийнхээ лого автоматаар үүсгэ</p>
        </div>
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-8 text-center max-w-lg mx-auto">
          <span className="text-5xl block mb-4"><Lock className="w-12 h-12 mx-auto" /></span>
          <h2 className="text-xl font-bold text-[var(--esl-text-primary)] mb-2">AI боломж хязгаарлагдсан</h2>
          <p className="text-[var(--esl-text-secondary)] mb-4">Энэ боломжийг ашиглахын тулд Стандарт эсвэл дээш багц руу шилжинэ үү.</p>
          <a href="/dashboard/store/package" className="inline-block bg-gradient-to-r from-purple-500 to-[#C41E25] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition">
            Багц шинэчлэх
          </a>
        </div>
      </div>
    );
  }

  function handleGenerate() {
    if (!businessName.trim()) {
      toast.show('Бизнесийн нэр оруулна уу', 'warn');
      return;
    }
    setGenerating(true);
    setTimeout(() => {
      setLogoGenerated(true);
      const newSub = { ...sub, aiCreditsUsed: sub.aiCreditsUsed + 1 };
      saveSubscription(newSub);
      const entry: LogoHistory = {
        id: Date.now().toString(),
        businessName,
        industry,
        style,
        colors: selectedPalette.colors,
        createdAt: new Date().toISOString(),
      };
      const newHistory = [entry, ...history].slice(0, 20);
      setHistory(newHistory);
      localStorage.setItem('eseller_logo_history', JSON.stringify(newHistory));
      setGenerating(false);
      toast.show('Лого амжилттай үүслээ!', 'ok');
    }, 2500);
  }

  function handleDownload() {
    toast.show('Лого татах боломж удахгүй нэмэгдэнэ', 'ok');
  }

  const shapes = SHAPES[industry] || SHAPES.food;

  return (
    <div className="min-h-screen bg-[var(--esl-bg-section)] p-4 md:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-[#C41E25] rounded-xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="w-7 h-7" /> AI Лого үүсгэгч</h1>
            <p className="opacity-90 text-sm mt-1">Бизнесийнхээ мэргэжлийн лого хэдхэн секундэд үүсгэ</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-sm">
            AI кредит: <span className="font-bold">{remainingCredits}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6">
          <h2 className="font-bold text-[var(--esl-text-primary)] mb-4">Тохиргоо</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Бизнесийн нэр</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Жишээ: FoodHub"
              className="w-full border border-[var(--esl-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--esl-text-primary)] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-2">Салбар</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind.id}
                  onClick={() => setIndustry(ind.id)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    industry === ind.id
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-[var(--esl-border)] text-[var(--esl-text-primary)] hover:border-[var(--esl-border-strong)]'
                  }`}
                >
                  <span className="mr-1 inline-flex">{ind.icon}</span> {ind.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-2">Загвар</label>
            <div className="grid grid-cols-2 gap-2">
              {LOGO_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    style === s.id
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-[var(--esl-border)] text-[var(--esl-text-primary)] hover:border-[var(--esl-border-strong)]'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-2">Өнгөний палитр</label>
            <div className="grid grid-cols-3 gap-2">
              {COLOR_PALETTES.map((cp) => (
                <button
                  key={cp.id}
                  onClick={() => setPalette(cp.id)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    palette === cp.id ? 'border-purple-500 bg-purple-50' : 'border-[var(--esl-border)] hover:border-[var(--esl-border-strong)]'
                  }`}
                >
                  <div className="flex justify-center gap-1 mb-1">
                    {cp.colors.map((c, i) => (
                      <div key={i} className="w-5 h-5 rounded-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-xs text-[var(--esl-text-secondary)]">{cp.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !businessName.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-[#C41E25] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Үүсгэж байна...
              </>
            ) : (
              <><Sparkles className="w-4 h-4" /> Лого үүсгэх</>
            )}
          </button>
        </div>

        {/* Preview */}
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6">
          <h2 className="font-bold text-[var(--esl-text-primary)] mb-4">Урьдчилан харах</h2>

          {logoGenerated ? (
            <div className="space-y-6">
              {/* Logo preview */}
              <div className="flex justify-center">
                <div className="w-64 h-64 bg-[var(--esl-bg-card)] rounded-2xl border-2 border-[var(--esl-border)] shadow-lg flex flex-col items-center justify-center p-6">
                  <div
                    className="text-5xl mb-2 font-bold tracking-tight"
                    style={{ color: selectedPalette.colors[0] }}
                  >
                    {shapes[0]}
                  </div>
                  <div
                    className="text-2xl font-black tracking-tight text-center"
                    style={{
                      color: selectedPalette.colors[0],
                      fontFamily:
                        style === 'classic'
                          ? 'Georgia, serif'
                          : style === 'playful'
                          ? '"Comic Sans MS", cursive'
                          : style === 'minimal'
                          ? '"Helvetica Neue", sans-serif'
                          : 'inherit',
                      letterSpacing: style === 'minimal' ? '0.15em' : style === 'modern' ? '-0.02em' : 'normal',
                    }}
                  >
                    {businessName}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {selectedPalette.colors.map((c, i) => (
                      <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-[10px] text-[var(--esl-text-muted)] mt-2 uppercase tracking-widest">
                    {INDUSTRIES.find((i) => i.id === industry)?.name}
                  </span>
                </div>
              </div>

              {/* Dark variant */}
              <div className="flex justify-center">
                <div
                  className="w-64 h-32 rounded-xl flex items-center justify-center gap-3 p-4"
                  style={{ backgroundColor: selectedPalette.colors[0] }}
                >
                  <span className="text-3xl text-white">{shapes[1]}</span>
                  <span className="text-xl font-bold text-white">{businessName}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-800 transition"
                >
                  PNG татах
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 border border-[var(--esl-border)] text-[var(--esl-text-primary)] py-2.5 rounded-xl font-semibold text-sm hover:bg-[var(--esl-bg-section)] transition"
                >
                  SVG татах
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-[var(--esl-bg-section)] rounded-xl border-2 border-dashed border-[var(--esl-border)]">
              <div className="text-center text-[var(--esl-text-muted)]">
                <span className="block mb-2"><Palette className="w-10 h-10 mx-auto" /></span>
                <p className="text-sm">Бизнесийн нэр оруулж лого үүсгэнэ үү</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6 mt-6">
          <h2 className="font-bold text-[var(--esl-text-primary)] mb-4">Түүх</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {history.map((h) => (
              <div key={h.id} className="border border-[var(--esl-border)] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-0.5">
                    {h.colors.map((c, i) => (
                      <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-[var(--esl-text-primary)] truncate">{h.businessName}</span>
                </div>
                <p className="text-xs text-[var(--esl-text-secondary)]">{h.industry} / {h.style}</p>
                <p className="text-xs text-[var(--esl-text-muted)] mt-1">{new Date(h.createdAt).toLocaleDateString('mn-MN')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
