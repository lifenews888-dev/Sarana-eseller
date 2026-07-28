'use client';
import Link from 'next/link';

export default function SellerSection() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 pb-10">
      <div className="rounded-[20px] p-8 md:p-10 border border-[var(--esl-border)] bg-[var(--esl-bg-card)]">
        <div className="text-center max-w-[600px] mx-auto">
          <h2 className="text-[var(--esl-text-primary)] text-2xl font-bold mb-3">
            Борлуулагч болж орлого олоорой
          </h2>
          <p className="text-[var(--esl-text-secondary)] text-sm mb-6">
            Бараа share хийж 10-20% комисс аваарай. Бараа нөөц, хүргэлт шаардлагагүй.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/become-seller" className="bg-[#E8242C] text-white px-6 py-3 rounded-xl no-underline font-bold text-sm hover:bg-[#c91f26] transition-colors">
              Борлуулагч болох →
            </Link>
            <Link href="/open-shop" className="bg-[var(--esl-bg-section)] text-[var(--esl-text-primary)] px-6 py-3 rounded-xl no-underline font-bold text-sm border border-[var(--esl-border)] hover:border-[#E8242C] transition-colors">
              Дэлгүүр нээх →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
