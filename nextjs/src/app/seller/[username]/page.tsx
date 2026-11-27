'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Share2, ShoppingBag, QrCode, Copy, Check } from 'lucide-react';
import { ShareModal } from '@/components/shared/ShareModal';
import EntityCard from '@/components/cards/EntityCard';
import StartSellingModal from '@/components/seller/StartSellingModal';

/* ═══ Types ═══ */
type SellerInfo = {
  username: string;
  displayName: string;
  bio?: string | null;
  avatar?: string | null;
  isVerified: boolean;
  commissionRate: number;
  totalSales: number;
};
type SellerItem = { id: string; name: string; price: number; salePrice?: number; image: string; rating?: number };

export default function SellerPage() {
  const [seller, setSeller] = useState<SellerInfo | null>(null);
  const [products, setProducts] = useState<SellerItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ok' | 'missing'>('loading');
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [sellingItem, setSellingItem] = useState<{ id: string; name?: string; price?: number; images?: string[] } | null>(null);
  const shareUrl = seller ? `https://eseller.mn/seller/${seller.username}` : '';

  // Бодит борлуулагчийн мэдээлэл — зохиомол (demo) мэдээлэл харуулахгүй
  useEffect(() => {
    const username = window.location.pathname.split('/').pop() || '';
    fetch(`/api/seller-page/${encodeURIComponent(decodeURIComponent(username))}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.seller) {
          setSeller(data.seller);
          setProducts(Array.isArray(data.products) ? data.products : []);
          setStatus('ok');
        } else setStatus('missing');
      })
      .catch(() => setStatus('missing'));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status !== 'ok' || !seller) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--esl-bg-page)' }}>
        {status === 'loading' ? (
          <div className="w-8 h-8 rounded-full border-2 border-[#E8242C] border-t-transparent animate-spin" />
        ) : (
          <div className="text-center max-w-sm">
            <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--esl-text-primary)' }}>Борлуулагч олдсонгүй</h1>
            <p className="text-sm mb-5" style={{ color: 'var(--esl-text-muted)' }}>Энэ холбоос буруу эсвэл борлуулагчийн хуудас идэвхгүй байна.</p>
            <Link href="/store" className="inline-block rounded-xl bg-[#E8242C] px-5 py-2.5 text-sm font-bold text-white no-underline">Дэлгүүр үзэх</Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--esl-bg-page)' }}>

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden" style={{ background: '#E8242C' }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_120%,rgba(0,0,0,0.4),transparent)]" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 py-14 text-center">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-white/20 border-3 border-white/40 flex items-center justify-center text-3xl font-black text-white mx-auto mb-4 shadow-xl">
            {seller.displayName.charAt(0)}
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-2xl font-black text-white">{seller.displayName}</h1>
            {seller.isVerified && (
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">✓</span>
            )}
          </div>

          <p className="text-white/80 text-sm mb-6 max-w-md mx-auto">{seller.bio || ''}</p>

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-6">
            <div>
              <p className="text-2xl font-black text-white">{seller.totalSales}</p>
              <p className="text-xs text-white/70">Борлуулалт</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white">{products.length}</p>
              <p className="text-xs text-white/70">Бараа</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white">{seller.commissionRate}%</p>
              <p className="text-xs text-white/70">Комисс</p>
            </div>
          </div>

          {/* Share */}
          <div className="flex justify-center gap-2">
            <button onClick={handleCopy} className="flex items-center gap-2 bg-white/20 border border-white/30 text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer hover:bg-white/30 transition backdrop-blur-sm">
              {copied ? <><Check className="w-3.5 h-3.5" /> Хуулагдлаа</> : <><Copy className="w-3.5 h-3.5" /> Линк хуулах</>}
            </button>
            <button className="flex items-center gap-2 bg-white/20 border border-white/30 text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer hover:bg-white/30 transition backdrop-blur-sm">
              <QrCode className="w-3.5 h-3.5" /> QR код
            </button>
            <button onClick={() => setShareOpen(true)} className="flex items-center gap-2 bg-white/20 border border-white/30 text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer hover:bg-white/30 transition backdrop-blur-sm">
              <Share2 className="w-3.5 h-3.5" /> Хуваалцах
            </button>
          </div>
        </div>
      </section>

      {/* ═══ PRODUCTS ═══ */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--esl-text-primary)' }}>
          <ShoppingBag className="w-5 h-5 inline mr-2" />
          Миний бараа бүтээгдэхүүн
        </h2>

        {products.length === 0 && (
          <p className="text-sm py-10 text-center rounded-2xl border" style={{ color: 'var(--esl-text-muted)', borderColor: 'var(--esl-border)' }}>
            Энэ борлуулагч одоогоор бараа нэмээгүй байна.
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {products.map((p) => (
            <EntityCard
              key={p.id}
              item={{
                id: p.id,
                name: p.name,
                price: p.salePrice || p.price,
                originalPrice: p.salePrice ? p.price : undefined,
                images: p.image ? [p.image] : [],
                rating: p.rating,
                allowAffiliate: true,
                metadata: { orderCount: '—' },
              }}
              entityType="STORE"
              showSellerBtn={false}
            />
          ))}
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t py-8 text-center" style={{ borderColor: 'var(--esl-border)', background: 'var(--esl-bg-section)' }}>
        <p className="text-xs" style={{ color: 'var(--esl-text-muted)' }}>
          {seller.displayName} — eseller.mn борлуулагч
        </p>
        <Link href="/feed" className="text-xs text-[#E8242C] no-underline mt-2 inline-block">eseller.mn →</Link>
      </footer>

      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} url={shareUrl} title={seller.displayName} description="eseller.mn борлуулагчийн хуудас" />
      <StartSellingModal item={sellingItem} isOpen={!!sellingItem} onClose={() => setSellingItem(null)} />
    </div>
  );
}
