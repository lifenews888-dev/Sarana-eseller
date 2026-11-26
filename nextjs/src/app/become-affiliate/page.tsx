'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Share2, ShoppingBag, Wallet, Loader2, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import MobileNav from '@/components/shared/MobileNav';
import { useAuth } from '@/lib/auth';
import { canSeeAffiliateSalesTools } from '@/lib/affiliate-permissions';

const STEPS = [
  { icon: ShoppingBag, title: 'Бараа сонгоно', desc: 'Дэлгүүрүүдийн "борлуулагчаар зарах" нээлттэй барааноос сонгоно. Нөөц, хүргэлт таньд хамаагүй.' },
  { icon: Share2, title: 'Холбоосоо хуваалцана', desc: 'Өөрийн eseller.mn/r/… холбоосыг Facebook, Instagram, чатаар тараана. Холбоос 30 хоног хүчинтэй.' },
  { icon: Wallet, title: 'Комисс авна', desc: 'Таны холбоосоор орж ирсэн хэрэглэгч төлбөрөө төлөхөд комисс таны хэтэвчинд бүртгэгдэнэ.' },
];

export default function BecomeAffiliatePage() {
  const { user, isLoggedIn, login } = useAuth();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const isAffiliate = isLoggedIn && canSeeAffiliateSalesTools(user?.role);

  async function join() {
    setJoining(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/affiliate/join', {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.data?.token) throw new Error(body?.error || 'Бүртгэхэд алдаа гарлаа');
      if (user) login(body.data.token, { ...user, role: body.data.role });
      window.location.assign('/dashboard/affiliate');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Бүртгэхэд алдаа гарлаа');
      setJoining(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--esl-bg-page)]">
      <Navbar />
      <main className="mx-auto max-w-[960px] px-4 pb-20 pt-28">
        <section className="text-center">
          <span className="inline-block rounded-full bg-[#E8242C]/10 px-3 py-1 text-xs font-bold text-[#E8242C]">Борлуулагч</span>
          <h1 className="mt-4 text-[clamp(26px,4vw,40px)] font-black tracking-tight text-[var(--esl-text-primary)]">
            Бараа хуваалцаад комисс ол
          </h1>
          <p className="mx-auto mt-3 max-w-[560px] text-[15px] text-[var(--esl-text-secondary)]">
            Дэлгүүр нээх шаардлагагүй. Бусдын барааг өөрийн холбоосоор зарж, борлуулалт бүрээс комисс аваарай.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            {isAffiliate ? (
              <Link href="/dashboard/affiliate" className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#E8242C] px-7 text-sm font-extrabold text-white no-underline hover:bg-[#CC0000]">
                <CheckCircle2 className="h-4 w-4" /> Борлуулагчийн самбар руу
              </Link>
            ) : isLoggedIn ? (
              <button type="button" onClick={join} disabled={joining}
                className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-xl border-none bg-[#E8242C] px-7 text-sm font-extrabold text-white hover:bg-[#CC0000] disabled:opacity-60">
                {joining && <Loader2 className="h-4 w-4 animate-spin" />} Борлуулагч болох — үнэгүй
              </button>
            ) : (
              <Link href="/login?redirect=/become-affiliate#register" className="inline-flex h-12 items-center rounded-xl bg-[#E8242C] px-7 text-sm font-extrabold text-white no-underline hover:bg-[#CC0000]">
                Бүртгүүлээд эхлэх — үнэгүй
              </Link>
            )}
            {error && <p className="text-sm font-semibold text-[#E8242C]">{error}</p>}
            {!isLoggedIn && (
              <p className="text-xs text-[var(--esl-text-muted)]">
                Бүртгэлтэй юу? <Link href="/login?redirect=/become-affiliate" className="font-bold text-[#E8242C] no-underline">Нэвтрэх</Link>
              </p>
            )}
          </div>
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8242C]/10 text-[#E8242C]"><s.icon className="h-5 w-5" /></span>
                <span className="text-xs font-bold text-[var(--esl-text-muted)]">Алхам {i + 1}</span>
              </div>
              <h2 className="mt-3 text-base font-extrabold text-[var(--esl-text-primary)]">{s.title}</h2>
              <p className="mt-1 text-sm text-[var(--esl-text-secondary)]">{s.desc}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-5 text-sm text-[var(--esl-text-secondary)]">
          <p className="font-bold text-[var(--esl-text-primary)]">Дэлгүүр нээхийг хүсэж байна уу?</p>
          <p className="mt-1">Өөрийн бараагаа зарах бол <Link href="/open-shop" className="font-bold text-[#E8242C] no-underline">дэлгүүр нээх</Link> хэсгийг ашиглана уу.</p>
        </section>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
