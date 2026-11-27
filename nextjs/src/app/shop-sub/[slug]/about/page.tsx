import { getShopConfig } from '@/lib/shop-cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ShopAboutPage({ params }: Props) {
  const { slug } = await params;
  const config = await getShopConfig(slug);
  if (!config) redirect('https://eseller.mn');

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">{config.name}</h1>

      <div className="space-y-6">
        {/* Contact Info */}
        <div className="bg-[var(--esl-bg-card)] rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Холбоо барих</h2>
          <div className="space-y-3 text-sm">
            {config.phone && (
              <div className="flex items-center gap-3">
                <span className="text-[var(--esl-text-muted)]">📞</span>
                <a href={`tel:${config.phone}`} className="text-blue-600 no-underline">{config.phone}</a>
              </div>
            )}
            {config.address && (
              <div className="flex items-center gap-3">
                <span className="text-[var(--esl-text-muted)]">📍</span>
                <span>{config.address}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="text-[var(--esl-text-muted)]">🌐</span>
              <span>{config.slug}.eseller.mn</span>
            </div>
          </div>
        </div>

        {/* Plan badge */}
        <div className="bg-[var(--esl-bg-card)] rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-2">Баталгаажсан дэлгүүр</h2>
          <p className="text-sm text-[var(--esl-text-secondary)]">
            Энэ дэлгүүр eseller.mn Enterprise ({config.plan}) багцын гишүүн юм.
            Бүх захиалга eseller.mn-ийн escrow системээр хамгаалагдсан.
          </p>
        </div>

        {/* Back to products */}
        <Link
          href={`/shop-sub/${slug}/products`}
          className="inline-block text-white px-6 py-3 rounded-xl font-semibold text-sm no-underline"
          style={{ background: config.accentColor }}
        >
          Бараа үзэх →
        </Link>
      </div>
    </div>
  );
}
