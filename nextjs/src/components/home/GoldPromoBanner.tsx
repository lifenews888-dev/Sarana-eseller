'use client';
import Link from 'next/link';
import { Crown } from 'lucide-react';
import { REALISTIC_BANNER_IMAGES } from '@/lib/realistic-banner-assets';

export default function GoldPromoBanner() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 pb-10">
      <div
        className="rounded-[20px] p-8 md:p-10 flex items-center justify-between flex-wrap gap-5 border border-[rgba(249,168,37,0.28)] bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(110deg, rgba(14,10,2,0.92) 0%, rgba(26,17,0,0.78) 48%, rgba(14,10,2,0.38) 100%), url(${REALISTIC_BANNER_IMAGES.gold})`,
        }}
      >
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <Crown className="w-8 h-8 text-[#F9A825]" />
            <span className="text-[#F9A825] text-[22px] font-black tracking-[2px]">GOLD</span>
          </div>
          <h3 className="text-white text-xl font-bold mb-1.5">
            Gold гишүүн болж 200,000₮+ хэмнэнэ
          </h3>
          <p className="text-white/60 text-sm">
            Үнэгүй хүргэлт · 5% нэмэлт хямдрал · 2x оноо · VIP дэмжлэг
          </p>
        </div>
        <Link href="/gold" className="bg-[#F9A825] text-black px-7 py-3.5 rounded-xl no-underline font-extrabold text-[15px] whitespace-nowrap hover:bg-[#e6991f] transition-colors">
          30 хоног үнэгүй турших →
        </Link>
      </div>
    </section>
  );
}
