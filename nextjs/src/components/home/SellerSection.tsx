'use client';
import Link from 'next/link';
import { REALISTIC_BANNER_IMAGES } from '@/lib/realistic-banner-assets';

export default function SellerSection() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 pb-10">
      <div
        className="rounded-[20px] p-8 md:p-10 border border-[var(--esl-border)] bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(115deg, rgba(8,8,8,0.9) 0%, rgba(18,18,18,0.78) 52%, rgba(232,36,44,0.28) 100%), url(${REALISTIC_BANNER_IMAGES.sellers})`,
        }}
      >
        <div className="text-center max-w-[600px] mx-auto">
          <h2 className="text-white text-2xl font-bold mb-3">
            Борлуулагч болж орлого олоорой
          </h2>
          <p className="text-white/75 text-sm mb-6">
            Бараа share хийж 10-20% комисс аваарай. Бараа нөөц, хүргэлт шаардлагагүй.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/become-seller" className="bg-[#E8242C] text-white px-6 py-3 rounded-xl no-underline font-bold text-sm hover:bg-[#c91f26] transition-colors">
              Борлуулагч болох →
            </Link>
            <Link href="/become-seller?source=open-shop" className="bg-white/12 text-white px-6 py-3 rounded-xl no-underline font-bold text-sm border border-white/25 hover:border-[#E8242C] transition-colors">
              Дэлгүүр нээх →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
