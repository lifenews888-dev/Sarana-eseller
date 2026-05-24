'use client';

import { useState } from 'react';
import { Share2, Heart, Link2, Check } from 'lucide-react';
import { useToast } from '@/components/shared/Toast';
import { cn } from '@/lib/utils';

interface ShareWishlistBarProps {
  url?: string;
  title?: string;
  productId?: string;
  className?: string;
}

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Some embedded browsers block clipboard writes; use a DOM fallback.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export default function ShareWishlistBar({ url, title, productId, className }: ShareWishlistBarProps) {
  const [liked, setLiked] = useState(() => {
    if (!productId || typeof window === 'undefined') return false;
    return localStorage.getItem(`eseller:wishlist:${productId}`) === '1';
  });
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const wishlistKey = productId ? `eseller:wishlist:${productId}` : null;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: title || 'eseller.mn', url: shareUrl });
      } catch { /* cancelled */ }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await copyText(shareUrl);
      setCopied(true);
      toast.show('Линк хуулагдлаа', 'ok');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.show('Линк хуулахад алдаа гарлаа', 'error');
    }
  };

  const handleWishlist = () => {
    const next = !liked;
    setLiked(next);
    if (wishlistKey) {
      if (next) localStorage.setItem(wishlistKey, '1');
      else localStorage.removeItem(wishlistKey);
    }
    toast.show(next ? 'Хадгалагдлаа' : 'Хадгалсан жагсаалтаас хасагдлаа', 'ok');
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={handleShare}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--esl-bg-card)] border border-[var(--esl-border)] text-sm font-medium hover:bg-[var(--esl-bg-muted)] transition-colors"
      >
        <Share2 size={16} /> Хуваалцах
      </button>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Линк хуулагдлаа' : 'Линк хуулах'}
        title={copied ? 'Линк хуулагдлаа' : 'Линк хуулах'}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--esl-bg-card)] border border-[var(--esl-border)] text-sm font-medium hover:bg-[var(--esl-bg-muted)] transition-colors"
      >
        {copied ? <Check size={16} className="text-green-500" /> : <Link2 size={16} />}
      </button>
      <button
        type="button"
        onClick={handleWishlist}
        aria-pressed={liked}
        className={cn(
          'flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors',
          liked ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600' : 'bg-[var(--esl-bg-card)] border-[var(--esl-border)] hover:bg-[var(--esl-bg-muted)]'
        )}
      >
        <Heart size={16} fill={liked ? 'currentColor' : 'none'} /> Хадгалах
      </button>
    </div>
  );
}
