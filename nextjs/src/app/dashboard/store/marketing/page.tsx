'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/shared/Toast';
import StatCard from '@/components/dashboard/StatCard';
import { Link2, Smartphone, Target, Palette, Lightbulb, QrCode, Megaphone } from 'lucide-react';

const SOCIAL_TEMPLATES = [
  {
    platform: 'Facebook',
    icon: '📘',
    color: 'bg-blue-100 text-blue-700',
    template: (url: string, name: string) =>
      `🛍️ ${name} дэлгүүрээс шилдэг бүтээгдэхүүнүүдийг үзээрэй!\n\n✅ Чанартай бараа\n🚚 Хурдан хүргэлт\n💰 Хямд үнэ\n\n👉 ${url}`,
  },
  {
    platform: 'Instagram',
    icon: '📸',
    color: 'bg-pink-100 text-pink-700',
    template: (url: string, name: string) =>
      `✨ ${name} — Онлайн дэлгүүр\n\n🔥 Шинэ бүтээгдэхүүн нэмэгдлээ!\n💎 Чанарын баталгаатай\n📦 Хүргэлттэй\n\n🔗 Линк bio-д\n\n#eseller #onlineshop #mongolia #shopping`,
  },
  {
    platform: 'TikTok',
    icon: '🎵',
    color: 'bg-[var(--esl-bg-section)] text-[var(--esl-text-primary)]',
    template: (url: string, name: string) =>
      `🎬 ${name} дэлгүүрийн шинэ бараанууд!\n\n💥 Хямдралтай\n⭐ Шилдэг чанар\n🚀 Шууд захиалаарай\n\n${url}\n\n#eseller #online #shopping #mongolia`,
  },
];

export default function MarketingPage() {
  const { user } = useAuth();
  const toast = useToast();
  const storeName = user?.store?.name || user?.name || 'Миний дэлгүүр';
  const storeUrl = `https://eseller.mn/store/${user?.username || 'mystore'}`;
  const referralUrl = `${storeUrl}?ref=${user?.username || 'myref'}`;

  const [bannerText, setBannerText] = useState('🔥 Хямдрал! 20% хөнгөлөлт бүх бараанд!');
  const [bannerColor, setBannerColor] = useState('#6366F1');
  const [copied, setCopied] = useState<string | null>(null);

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      toast.show(`${label} хуулагдлаа!`, 'ok');
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-[var(--esl-bg-section)] p-6">
      {/* Header */}
      <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6 mb-6">
        <h1 className="text-2xl font-bold text-[var(--esl-text-primary)]">Маркетинг</h1>
        <p className="text-[var(--esl-text-secondary)] mt-1">Дэлгүүрээ сурталчлах хэрэгслүүд</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<Link2 className="w-6 h-6" />} label="Реферал линк клик" value={142} gradient="indigo" />
        <StatCard icon={<Smartphone className="w-6 h-6" />} label="Сошиал хуваалцсан" value={38} gradient="pink" />
        <StatCard icon={<Target className="w-6 h-6" />} label="Шинэ захиалагч" value={12} gradient="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referral Link */}
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6">
          <h2 className="text-lg font-bold text-[var(--esl-text-primary)] mb-4 flex items-center gap-2"><Link2 className="w-5 h-5" /> Реферал линк</h2>
          <p className="text-sm text-[var(--esl-text-secondary)] mb-3">Энэ линкээр орсон хэрэглэгчид таны дэлгүүрийг харж, захиалга өгнө.</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={referralUrl}
              className="flex-1 px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] bg-[var(--esl-bg-section)]"
            />
            <button
              onClick={() => copyToClipboard(referralUrl, 'Реферал линк')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                copied === 'Реферал линк' ? 'bg-green-500 text-white' : 'bg-[#E8242C] text-white hover:bg-[#C41E25]'
              }`}
            >
              {copied === 'Реферал линк' ? '✓ Хуулсан' : 'Хуулах'}
            </button>
          </div>
          <div className="mt-4 p-3 bg-[var(--esl-brand-bg)] rounded-lg">
            <p className="text-xs text-[#E8242C]">
              <Lightbulb className="w-3.5 h-3.5 inline shrink-0" /> Реферал линкээр орсон хэрэглэгчийн захиалгад таны шимтгэл тооцогдоно
            </p>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6">
          <h2 className="text-lg font-bold text-[var(--esl-text-primary)] mb-4 flex items-center gap-2"><QrCode className="w-5 h-5" /> QR Код</h2>
          <p className="text-sm text-[var(--esl-text-secondary)] mb-3">Дэлгүүрийн QR код — хэвлэж, хуваалцаарай.</p>
          <div className="flex flex-col items-center">
            <div className="w-48 h-48 bg-[var(--esl-bg-section)] border-2 border-dashed border-[var(--esl-border)] rounded-xl flex flex-col items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(storeUrl)}`}
                alt="QR Code"
                className="w-40 h-40 rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <p className="text-xs text-[var(--esl-text-muted)] mt-2">{storeUrl}</p>
            <button
              onClick={() => copyToClipboard(storeUrl, 'Дэлгүүрийн линк')}
              className="mt-3 px-4 py-2 bg-[var(--esl-bg-section)] text-[var(--esl-text-primary)] rounded-lg text-sm font-medium hover:bg-[var(--esl-bg-card-hover)] transition-colors"
            >
              Линк хуулах
            </button>
          </div>
        </div>

        {/* Social Media Templates */}
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-[var(--esl-text-primary)] mb-4 flex items-center gap-2"><Megaphone className="w-5 h-5" /> Сошиал медиа загвар</h2>
          <p className="text-sm text-[var(--esl-text-secondary)] mb-4">Бэлэн текст хуулж, сошиал хуудас дээрээ нийтлээрэй.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SOCIAL_TEMPLATES.map((tmpl) => {
              const text = tmpl.template(referralUrl, storeName);
              return (
                <div key={tmpl.platform} className="border border-[var(--esl-border)] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${tmpl.color}`}>
                      {tmpl.icon} {tmpl.platform}
                    </span>
                  </div>
                  <pre className="text-xs text-[var(--esl-text-secondary)] whitespace-pre-wrap bg-[var(--esl-bg-section)] rounded-lg p-3 mb-3 max-h-40 overflow-y-auto font-sans">
                    {text}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(text, tmpl.platform)}
                    className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                      copied === tmpl.platform ? 'bg-green-500 text-white' : 'bg-[var(--esl-bg-section)] text-[var(--esl-text-primary)] hover:bg-[var(--esl-bg-card-hover)]'
                    }`}
                  >
                    {copied === tmpl.platform ? '✓ Хуулсан' : 'Текст хуулах'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Banner Creator */}
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-[var(--esl-text-primary)] mb-4 flex items-center gap-2"><Palette className="w-5 h-5" /> Баннер үүсгэгч</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Баннер текст</label>
                <input
                  value={bannerText}
                  onChange={(e) => setBannerText(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Өнгө</label>
                <div className="flex gap-2">
                  {['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setBannerColor(color)}
                      className={`w-8 h-8 rounded-full transition-transform ${bannerColor === color ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : ''}`}
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  copyToClipboard(bannerText, 'Баннер текст');
                }}
                className="px-4 py-2 bg-[#E8242C] text-white rounded-lg text-sm font-medium hover:bg-[#C41E25] transition-colors"
              >
                Текст хуулах
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Урьдчилан харах</label>
              <div
                className="rounded-xl p-6 text-white text-center font-bold text-lg shadow-md"
                style={{ background: `linear-gradient(135deg, ${bannerColor}, ${bannerColor}dd)` }}
              >
                <p>{bannerText}</p>
                <p className="text-sm font-normal mt-2 opacity-80">{storeName} — eseller.mn</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
