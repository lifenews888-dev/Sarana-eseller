import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Check, ArrowRight, TrendingUp, Users, ShoppingBag, Globe } from 'lucide-react';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ company: string }>;
}

const DEMOS: Record<string, {
  name: string;
  logo: string;
  color: string;
  tagline: string;
  description: string;
  stats: { label: string; value: string }[];
  benefits: string[];
}> = {
  nomin: {
    name: 'Номин',
    logo: '/demo/nomin-logo.png',
    color: '#003DA5',
    tagline: 'Таны онлайн дэлгүүр 2 долоо хоногт бэлэн',
    description: 'Номины 50+ салбар, 10,000+ барааг нэг платформд нэгтгэж, онлайн борлуулалтыг 3 дахин нэмэгдүүлнэ.',
    stats: [
      { label: 'Салбар', value: '50+' },
      { label: 'Бараа', value: '10,000+' },
      { label: 'Сарын хүргэлт', value: '5,000+' },
      { label: 'Хэмнэлт/сар', value: '15M₮' },
    ],
    benefits: [
      'nomin.eseller.mn — өөрийн брэндтэй дэлгүүр',
      '50 ажилтны нэвтрэлт (role-тойгоо)',
      'Бүх салбараас бараа sync',
      'Enterprise analytics + PDF тайлан',
      'B2B бөөний үнийн тогтолцоо',
      '1% комисс (одоогийн 3-5%-ийн оронд)',
    ],
  },
  'khan-bank': {
    name: 'Хаан банк',
    logo: '/demo/khan-logo.png',
    color: '#00529B',
    tagline: '500,000 карт эзэмшигч eseller-д оноо зарцуулна',
    description: 'Хаан банкны loyalty оноог eseller-д шууд ашиглах боломжтой. Карт эзэмшигчид бараа худалдан авах шинэ сувгийг нээнэ.',
    stats: [
      { label: 'Карт эзэмшигч', value: '500,000+' },
      { label: 'Идэвхтэй оноо', value: '2.5B₮' },
      { label: 'Хөрвүүлэлтийн хувь', value: '1:1.5' },
      { label: 'Шинэ хэрэглэгч/сар', value: '10,000+' },
    ],
    benefits: [
      'Хаан банк оноо → eseller оноо хөрвүүлэлт',
      '500,000+ карт эзэмшигчид хүрэх',
      'Co-branded маркетинг',
      'API интеграци 2 долоо хоногт',
      'Тусгай комисс хөнгөлөлт',
      'Dedicated account manager',
    ],
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { company } = await params;
  const demo = DEMOS[company];
  if (!demo) return { title: 'Demo — eseller.mn' };
  return {
    title: `${demo.name} × eseller.mn — Enterprise Demo`,
    description: demo.description,
  };
}

export default async function EnterpriseDemoPage({ params }: Props) {
  const { company } = await params;
  const demo = DEMOS[company];
  if (!demo) notFound();

  return (
    <div className="min-h-screen bg-[var(--esl-bg-page)]">
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${demo.color}, ${demo.color}cc)` }}>
        <div className="max-w-5xl mx-auto px-6 py-20 text-white relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-4xl font-extrabold">{demo.name}</span>
            <span className="text-white/50 text-2xl">×</span>
            <span className="text-2xl font-bold text-white/80">eseller.mn</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">{demo.tagline}</h1>
          <p className="text-white/70 text-lg max-w-2xl mb-8">{demo.description}</p>
          <div className="flex gap-4">
            <Link href="/contact" className="bg-[var(--esl-bg-card)] text-[var(--esl-text-primary)] px-6 py-3 rounded-xl font-semibold text-sm no-underline hover:bg-[var(--esl-bg-hover)]">
              Уулзалт товлох
            </Link>
            <Link href="/enterprise/pricing" className="border border-white/30 text-white px-6 py-3 rounded-xl font-semibold text-sm no-underline hover:bg-white/10">
              Багцууд харах
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-5xl mx-auto px-6 -mt-10 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {demo.stats.map((s) => (
            <div key={s.label} className="bg-[var(--esl-bg-card)] rounded-xl border shadow-sm p-5 text-center">
              <p className="text-2xl font-extrabold" style={{ color: demo.color }}>{s.value}</p>
              <p className="text-sm text-[var(--esl-text-secondary)] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold mb-8">{demo.name}-д зориулсан давуу талууд</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {demo.benefits.map((b, i) => (
            <div key={i} className="flex items-start gap-3 p-4 bg-[var(--esl-bg-section)] rounded-xl">
              <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <span className="text-sm">{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-16 bg-[var(--esl-bg-section)]">
        <h2 className="text-2xl font-bold mb-3">Бэлэн үү?</h2>
        <p className="text-[var(--esl-text-secondary)] mb-6">2 долоо хоногт {demo.name}-ийн онлайн дэлгүүрийг ажиллуулна</p>
        <Link href="/contact" className="inline-flex items-center gap-2 bg-blue-900 text-white px-8 py-3 rounded-xl font-semibold no-underline">
          Эхлэх <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
