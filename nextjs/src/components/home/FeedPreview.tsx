'use client';
import Link from 'next/link';
import { Package, MapPin } from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';

type FeedPost = {
  id: string;
  title: string;
  price?: number | null;
  district?: string | null;
  media?: { url?: string | null }[];
  category?: { name?: string | null } | null;
};

export default function FeedPreview({ posts }: { posts: FeedPost[] }) {
  return (
    <section className="max-w-[1200px] mx-auto px-4 pb-10">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-[var(--esl-text-primary)] text-xl font-bold">
          Сүүлийн зарууд
        </h2>
        <Link href="/feed" className="text-[#E8242C] text-sm font-semibold no-underline">
          Бүгдийг харах →
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="bg-[var(--esl-bg-card)] rounded-2xl p-8 text-center border border-[var(--esl-border)]">
          <p className="text-[var(--esl-text-muted)] mb-4">Зар тун удахгүй нэмэгдэнэ!</p>
          <Link href="/feed" className="inline-block bg-[#E8242C] text-white px-6 py-2.5 rounded-xl no-underline font-semibold">
            Зарын булан үзэх →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {posts.map((post) => (
            <Link key={post.id} href={`/feed/${post.id}`} className="no-underline group">
              <div className="bg-[var(--esl-bg-card)] rounded-2xl overflow-hidden border border-[var(--esl-border)] group-hover:-translate-y-1 group-hover:shadow-lg transition-all">
                <div className="aspect-[4/3] bg-[var(--esl-bg-section)] overflow-hidden relative">
                  {post.media?.[0]?.url ? (
                    <SafeImage src={post.media[0].url} alt={post.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--esl-text-muted)]">
                      <Package size={40} />
                    </div>
                  )}
                  {post.category && (
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded-md">
                      {post.category.name}
                    </div>
                  )}
                </div>
                <div className="p-3.5">
                  <p className="text-[var(--esl-text-primary)] font-semibold text-sm mb-2 line-clamp-2">{post.title}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-[#E8242C] font-extrabold text-base">
                      {post.price ? post.price.toLocaleString() + '₮' : 'Үнэ тохиролцоно'}
                    </span>
                    {post.district && (
                      <span className="text-[var(--esl-text-muted)] text-xs inline-flex items-center gap-0.5">
                        <MapPin size={12} /> {post.district}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
