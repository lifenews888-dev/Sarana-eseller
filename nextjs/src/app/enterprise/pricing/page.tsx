import { Check, Star } from 'lucide-react';
import Link from 'next/link';

const PLANS = [
  {
    name: 'Starter',
    price: '500,000₮',
    period: '/сар',
    description: 'Жижиг бизнест зориулсан',
    popular: false,
    features: [
      '5 admin хэрэглэгч',
      'Custom subdomain (xxx.eseller.mn)',
      'Брэндийн өнгөний тохиргоо',
      'Тусдаа дэмжлэг',
      '2% комисс (Free 5%-ийн оронд)',
      'Стандарт аналитик',
    ],
  },
  {
    name: 'Business',
    price: '1,500,000₮',
    period: '/сар',
    description: 'Дунд хэмжээний бизнест',
    popular: true,
    features: [
      'Starter-ийн бүх боломж +',
      '20 admin хэрэглэгч',
      'Enterprise аналитик + PDF export',
      'B2B бөөний үнийн тогтолцоо',
      'Email/SMS автоматжуулалт',
      'Priority дэмжлэг (4 цагт хариу)',
      '1.5% комисс',
    ],
  },
  {
    name: 'Corporate',
    price: 'Тохиролцоно',
    period: '',
    description: 'Том байгууллагуудад',
    popular: false,
    features: [
      'Business-ийн бүх боломж +',
      'Тоогүй хэрэглэгч',
      'White-label (өөрийн домайн)',
      'ERP интеграци',
      'SLA 99.9%',
      'Dedicated account manager',
      '1% комисс',
      'Custom API интеграци',
    ],
  },
];

export default function EnterprisePricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="text-center py-16 px-4">
        <h1 className="text-4xl font-extrabold text-[var(--esl-text-primary)] mb-4">Enterprise багцууд</h1>
        <p className="text-lg text-[var(--esl-text-secondary)] max-w-xl mx-auto">
          Бизнесийн хэмжээндээ тохирсон багц сонгоод дэлгүүрээ дараагийн түвшинд гаргаарай
        </p>
      </div>

      {/* Pricing cards */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-[var(--esl-bg-card)] rounded-2xl border-2 p-8 flex flex-col ${
                plan.popular ? 'border-blue-900 shadow-xl scale-105' : 'border-[var(--esl-border)]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-900 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-white" /> Хамгийн их сонгогддог
                </div>
              )}
              <h3 className="text-xl font-bold text-[var(--esl-text-primary)]">{plan.name}</h3>
              <p className="text-sm text-[var(--esl-text-secondary)] mt-1 mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-3xl font-extrabold text-[var(--esl-text-primary)]">{plan.price}</span>
                <span className="text-[var(--esl-text-muted)]">{plan.period}</span>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-[var(--esl-text-secondary)]">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.name === 'Corporate' ? '/contact' : '/dashboard/seller/enterprise'}
                className={`block text-center py-3 rounded-xl font-semibold text-sm transition no-underline ${
                  plan.popular
                    ? 'bg-blue-900 text-white hover:bg-blue-800'
                    : 'bg-[var(--esl-bg-muted)] text-[var(--esl-text-primary)] hover:bg-[var(--esl-bg-hover)]'
                }`}
              >
                {plan.name === 'Corporate' ? 'Холбоо барих' : 'Эхлэх'}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Түгээмэл асуулт</h2>
          <div className="space-y-4">
            {[
              { q: 'Багцаа дараа нь солих боломжтой юу?', a: 'Тийм. Хүссэн үедээ дээшлүүлэх эсвэл бууруулах боломжтой.' },
              { q: 'Комисс хэрхэн тооцоолох вэ?', a: 'Борлуулалтын дүнгээс хувиар тооцоолно. Enterprise багц авсан тохиолдолд хамгийн бага комисс хэмжээ хэрэглэнэ.' },
              { q: 'Custom домайн тохируулах боломжтой юу?', a: 'Corporate багцад өөрийн домайн (жнь: shop.company.mn) тохируулах боломжтой.' },
            ].map((faq, i) => (
              <details key={i} className="bg-[var(--esl-bg-card)] rounded-xl border p-4 group">
                <summary className="font-medium cursor-pointer list-none flex items-center justify-between">
                  {faq.q}
                  <span className="text-[var(--esl-text-muted)] group-open:rotate-180 transition">▼</span>
                </summary>
                <p className="text-sm text-[var(--esl-text-secondary)] mt-3">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
