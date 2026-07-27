'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Star, Shield, ShoppingBag, Users, Share2, Mail, Clock } from 'lucide-react';
import { ShareModal } from '@/components/shared/ShareModal';
import ChatWidget from '@/components/chat/ChatWidget';
import SafeImage from '@/components/ui/SafeImage';
import { publicShopUrl } from '@/lib/public-shop-url';

interface ShopData {
  id: string; name: string; slug: string; storefrontSlug?: string | null; logo?: string | null; phone?: string | null;
  address?: string | null; industry?: string | null; district?: string | null;
  allowSellers?: boolean; sellerCommission?: number;
  storefrontConfig?: Record<string, unknown> | null;
  user?: { name: string; avatar?: string | null };
}

interface ProductData {
  _id: string; id?: string; name: string; price: number; salePrice?: number | null;
  images?: string[]; emoji?: string | null; category?: string | null;
  rating?: number | null; reviewCount?: number | null; stock?: number | null;
}

type StorefrontBannerData = {
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
};

type StorefrontMenuItem = {
  href?: string;
  label?: string;
};

const ENTITY_BADGES: Record<string, { label: string; emoji: string; color: string }> = {
  store: { label: 'Онлайн дэлгүүр', emoji: '🏪', color: '#3B82F6' },
  service: { label: 'Үйлчилгээ', emoji: '🛎️', color: '#888780' },
  agent: { label: 'ҮХХ агент', emoji: '🏠', color: '#7F77DD' },
  company: { label: 'Барилгын компани', emoji: '🏗️', color: '#22C55E' },
  auto_dealer: { label: 'Авто худалдаа', emoji: '🚗', color: '#F59E0B' },
};

function formatPrice(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + ' сая₮';
  return n.toLocaleString() + '₮';
}

function discountPct(price: number, sale?: number | null) {
  if (!sale || sale >= price) return 0;
  return Math.round((1 - sale / price) * 100);
}

export default function StorefrontClient({ shop, products }: { shop: ShopData; products: ProductData[] }) {
  const badge = ENTITY_BADGES[shop.industry || 'store'] || ENTITY_BADGES.store;
  const [shareOpen, setShareOpen] = useState(false);
  const publicSlug = shop.storefrontSlug || shop.slug;
  const shareUrl = publicShopUrl(typeof window !== 'undefined' ? window.location.origin : 'https://eseller.mn', publicSlug);

  // Read storefront config
  const cfg = (shop.storefrontConfig || {}) as Record<string, unknown>;
  const primaryColor = (cfg.primaryColor as string) || '#E8242C';
  const heroTitle = (cfg.heroTitle as string) || '';
  const heroSubtitle = (cfg.heroSubtitle as string) || '';
  const ctaText = (cfg.ctaText as string) || 'Захиалах';
  const banners = Array.isArray(cfg.banners) ? (cfg.banners as StorefrontBannerData[]) : [];
  const menuItems = Array.isArray(cfg.menuItems) ? (cfg.menuItems as StorefrontMenuItem[]) : [];
  const socialLinks = (cfg.socialLinks as Record<string, string>) || {};
  const contactInfo = (cfg.contactInfo as Record<string, string>) || {};
  const logoUrl = (cfg.logoUrl as string) || shop.logo;
  const sections = (cfg.sections as string[]) || ['hero', 'products', 'about', 'reviews', 'contact'];
  const show = (key: string) => sections.includes(key);

  return (
    <div className="min-h-screen" style={{ background: 'var(--esl-bg-page)' }}>

      {/* ═══ HERO ═══ */}
      {show('hero') && (
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, #0A0A0A 0%, #1A1A2E 50%, ${primaryColor} 150%)` }}>
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 80% 50% at 50% -20%, ${primaryColor}4D, transparent)` }} />
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
          <div className="flex items-start gap-5 mb-6">
            {logoUrl ? (
              <SafeImage src={logoUrl} alt={shop.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-lg" />
            ) : (
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg" style={{ background: primaryColor }}>
                {shop.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: badge.color + '33', color: '#fff', border: `1px solid ${badge.color}66` }}>
                  {badge.emoji} {badge.label}
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 text-white/90 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Баталгаажсан
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">{heroTitle || shop.name}</h1>
            </div>
          </div>

          {(heroSubtitle || shop.address) && (
            <p className="text-white/70 text-sm mb-6 max-w-xl">{heroSubtitle || shop.address}</p>
          )}

          <div className="flex items-center gap-3 flex-wrap mb-8">
            {shop.district && (
              <span className="flex items-center gap-1 text-white/60 text-xs"><MapPin className="w-3 h-3" /> {shop.district}</span>
            )}
            {shop.phone && (
              <span className="flex items-center gap-1 text-white/60 text-xs"><Phone className="w-3 h-3" /> {shop.phone}</span>
            )}
            <span className="flex items-center gap-1 text-white/60 text-xs"><ShoppingBag className="w-3 h-3" /> {products.length} бараа</span>
          </div>

          <div className="flex gap-3 flex-wrap">
            <a href="#products" className="bg-[var(--esl-bg-card)] px-7 py-3.5 rounded-xl font-bold text-sm no-underline hover:bg-white/90 transition shadow-lg" style={{ color: primaryColor }}>
              {ctaText}
            </a>
            {shop.phone && (
              <a href={`tel:${shop.phone}`} className="bg-white/10 border border-white/30 text-white px-6 py-3.5 rounded-xl font-semibold text-sm no-underline hover:bg-white/20 transition backdrop-blur-sm">
                Холбоо барих
              </a>
            )}
            <button onClick={() => setShareOpen(true)} className="flex items-center gap-2 bg-white/10 border border-white/30 text-white px-5 py-3.5 rounded-xl font-semibold text-sm cursor-pointer hover:bg-white/20 transition backdrop-blur-sm">
              <Share2 className="w-4 h-4" /> Хуваалцах
            </button>
          </div>

          {shop.allowSellers && (
            <div className="mt-6 inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 backdrop-blur-sm">
              <Users className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-white/90">Борлуулагч болох боломжтой — <strong className="text-amber-400">{shop.sellerCommission || 10}% комисс</strong></span>
            </div>
          )}
        </div>
      </section>
      )}

      {/* ═══ MENU NAV ═══ */}
      {menuItems.length > 0 && (
        <nav className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-6 overflow-x-auto" style={{ borderBottom: '1px solid var(--esl-border)' }}>
          {menuItems.map((item, i) => (
            <a key={i} href={item.href || '#'} className="text-sm font-semibold no-underline whitespace-nowrap hover:opacity-80 transition" style={{ color: 'var(--esl-text-primary)' }}>
              {item.label}
            </a>
          ))}
        </nav>
      )}

      {/* ═══ BANNER SLIDER ═══ */}
      {banners.length > 0 && <BannerSlider banners={banners} primaryColor={primaryColor} />}

      {/* ═══ PRODUCTS ═══ */}
      {show('products') && (
      <section id="products" className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-xl font-black mb-6" style={{ color: 'var(--esl-text-primary)' }}>
          Бүтээгдэхүүн
        </h2>

        {products.length === 0 ? (
          <div className="text-center py-16 px-6 rounded-2xl" style={{ background: 'var(--esl-bg-card)', border: '1px solid var(--esl-border)' }}>
            <span className="text-5xl block mb-4">📦</span>
            <p className="font-bold text-lg" style={{ color: 'var(--esl-text-primary)' }}>Энэ дэлгүүрт бараа хараахан байхгүй</p>
            <p className="text-sm mt-2 mb-6 max-w-sm mx-auto" style={{ color: 'var(--esl-text-muted)' }}>
              Өөр олон дэлгүүр, шинэ бараа таныг хүлээж байна
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Link href="/store" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#E8242C] text-white text-sm font-semibold no-underline hover:bg-[#c91f26] transition">
                Marketplace харах →
              </Link>
              <Link href="/shops" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold no-underline hover:bg-[var(--esl-bg-section)] transition" style={{ color: 'var(--esl-text-primary)', border: '1px solid var(--esl-border)' }}>
                Бусад дэлгүүр
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => {
              const disc = discountPct(p.price, p.salePrice);
              const px = p.salePrice || p.price;
              const img = p.images?.[0];
              return (
                <Link key={p._id || p.id} href={`/product/${p._id || p.id}`} className="group no-underline block">
                  <div className="rounded-xl overflow-hidden border transition-all hover:-translate-y-1 hover:shadow-lg" style={{ background: 'var(--esl-bg-card)', borderColor: 'var(--esl-border)' }}>
                    <div className="relative aspect-square" style={{ background: 'var(--esl-bg-section)' }}>
                      {img ? (
                        <SafeImage src={img} alt={p.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">{p.emoji || '📦'}</div>
                      )}
                      {disc > 0 && (
                        <span className="absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: primaryColor }}>-{disc}%</span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs line-clamp-2 font-medium mb-1.5 leading-snug" style={{ color: 'var(--esl-text-primary)' }}>{p.name}</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-bold" style={{ color: primaryColor }}>{formatPrice(px)}</span>
                        {disc > 0 && <span className="text-[10px] line-through" style={{ color: 'var(--esl-text-muted)' }}>{formatPrice(p.price)}</span>}
                      </div>
                      {p.rating != null && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span className="text-[10px]" style={{ color: 'var(--esl-text-muted)' }}>{p.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
      )}

      {/* ═══ ABOUT ═══ */}
      {show('about') && shop.address && (
        <section className="max-w-6xl mx-auto px-6 py-12 border-t" style={{ borderColor: 'var(--esl-border)' }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--esl-text-primary)' }}>Тухай</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="rounded-xl p-5 border" style={{ background: 'var(--esl-bg-card)', borderColor: 'var(--esl-border)' }}>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--esl-text-secondary)' }}>{shop.address}</p>
              {shop.district && (
                <p className="text-xs mt-3 flex items-center gap-1" style={{ color: 'var(--esl-text-muted)' }}>
                  <MapPin className="w-3 h-3" /> {shop.district} дүүрэг
                </p>
              )}
            </div>
            {shop.phone && (
              <div className="rounded-xl p-5 border" style={{ background: 'var(--esl-bg-card)', borderColor: 'var(--esl-border)' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--esl-text-primary)' }}>Холбоо барих</p>
                <a href={`tel:${shop.phone}`} className="text-sm no-underline flex items-center gap-1" style={{ color: primaryColor }}>
                  <Phone className="w-3.5 h-3.5" /> {shop.phone}
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t" style={{ borderColor: 'var(--esl-border)', background: 'var(--esl-bg-section)' }}>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

            {/* Col 1: Shop info */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                {logoUrl ? (
                  <SafeImage src={logoUrl} alt={shop.name} className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white" style={{ background: primaryColor }}>{shop.name.charAt(0)}</div>
                )}
                <span className="text-sm font-bold" style={{ color: 'var(--esl-text-primary)' }}>{shop.name}</span>
              </div>
              {shop.address && <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--esl-text-muted)' }}>{shop.address}</p>}
              {/* Social icons */}
              <div className="flex gap-2 mt-3">
                {socialLinks.facebook && (
                  <a href={socialLinks.facebook} target="_blank" rel="noopener" className="w-9 h-9 rounded-lg flex items-center justify-center no-underline transition-opacity hover:opacity-80" style={{ background: '#1877F2' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                )}
                {socialLinks.instagram && (
                  <a href={socialLinks.instagram} target="_blank" rel="noopener" className="w-9 h-9 rounded-lg flex items-center justify-center no-underline transition-opacity hover:opacity-80" style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </a>
                )}
                {socialLinks.tiktok && (
                  <a href={socialLinks.tiktok} target="_blank" rel="noopener" className="w-9 h-9 rounded-lg flex items-center justify-center no-underline transition-opacity hover:opacity-80" style={{ background: '#000' }}>
                    <svg width="16" height="18" viewBox="0 0 448 512" fill="#fff"><path d="M448 209.91a210.06 210.06 0 01-122.77-39.25v178.72A162.55 162.55 0 11185 188.31v89.89a74.62 74.62 0 1052.23 71.18V0h88a121 121 0 00122.77 121.33z"/></svg>
                  </a>
                )}
                {socialLinks.youtube && (
                  <a href={socialLinks.youtube} target="_blank" rel="noopener" className="w-9 h-9 rounded-lg flex items-center justify-center no-underline transition-opacity hover:opacity-80" style={{ background: '#FF0000' }}>
                    <svg width="18" height="13" viewBox="0 0 576 512" fill="#fff"><path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/></svg>
                  </a>
                )}
                {socialLinks.whatsapp && (
                  <a href={`https://wa.me/${socialLinks.whatsapp}`} target="_blank" rel="noopener" className="w-9 h-9 rounded-lg flex items-center justify-center no-underline transition-opacity hover:opacity-80" style={{ background: '#25D366' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </a>
                )}
              </div>
            </div>

            {/* Col 2: Contact */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--esl-text-primary)' }}>Холбоо барих</p>
              {(contactInfo.phone || shop.phone) && (
                <a href={`tel:${contactInfo.phone || shop.phone}`} className="flex items-center gap-2 text-xs mb-2 no-underline" style={{ color: 'var(--esl-text-muted)' }}>
                  <Phone className="w-3.5 h-3.5" /> {contactInfo.phone || shop.phone}
                </a>
              )}
              {contactInfo.email && <p className="flex items-center gap-2 text-xs mb-2" style={{ color: 'var(--esl-text-muted)' }}><Mail className="w-3.5 h-3.5" /> {contactInfo.email}</p>}
              {(contactInfo.address || shop.address) && <p className="flex items-center gap-2 text-xs mb-2" style={{ color: 'var(--esl-text-muted)' }}><MapPin className="w-3.5 h-3.5" /> {contactInfo.address || shop.address}</p>}
              {contactInfo.workingHours && <p className="flex items-center gap-2 text-xs mb-2" style={{ color: 'var(--esl-text-muted)' }}><Clock className="w-3.5 h-3.5" /> {contactInfo.workingHours}</p>}
            </div>

            {/* Col 3: Policies */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--esl-text-primary)' }}>Мэдээлэл</p>
              <div className="space-y-2">
                <Link href="/terms" className="block text-xs no-underline hover:underline" style={{ color: 'var(--esl-text-muted)' }}>Үйлчилгээний нөхцөл</Link>
                <p className="text-xs" style={{ color: 'var(--esl-text-muted)' }}>🚚 Хүргэлт: Улаанбаатар хотод 24 цагийн дотор</p>
                <p className="text-xs" style={{ color: 'var(--esl-text-muted)' }}>↩️ Буцаалт: 7 хоногийн дотор</p>
                <p className="text-xs" style={{ color: 'var(--esl-text-muted)' }}>💳 Төлбөр: QPay, банк шилжүүлэг</p>
                <p className="text-xs" style={{ color: 'var(--esl-text-muted)' }}>🧾 еБаримт олгоно</p>
              </div>
            </div>

            {/* Col 4: Facebook embed */}
            {socialLinks.facebook && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--esl-text-primary)' }}>Facebook</p>
                <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--esl-border)' }}>
                  <iframe
                    src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(socialLinks.facebook)}&tabs=timeline&width=280&height=300&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true`}
                    width="100%" height="300" style={{ border: 'none', overflow: 'hidden' }}
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: 'var(--esl-border)' }}>
            <p className="text-[11px]" style={{ color: 'var(--esl-text-muted)' }}>
              © {new Date().getFullYear()} {shop.name}. Бүх эрх хуулиар хамгаалагдсан.
            </p>
            <a href="https://eseller.mn" target="_blank" rel="noopener" className="text-[11px] no-underline flex items-center gap-1" style={{ color: 'var(--esl-text-muted)' }}>
              Powered by <span className="font-bold" style={{ color: '#E8242C' }}>eseller.mn</span>
            </a>
          </div>
        </div>
      </footer>

      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} url={shareUrl} title={shop.name} description={`${shop.name} — eseller.mn дэлгүүр`} />

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}

/* ═══ Banner Slider ═══ */
function BannerSlider({ banners, primaryColor }: { banners: StorefrontBannerData[]; primaryColor: string }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setActive(i => (i + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const b = banners[active];
  if (!b) return null;

  return (
    <section className="relative overflow-hidden" style={{ height: 320 }}>
      {b.imageUrl && (
        <SafeImage src={b.imageUrl} alt={b.title || ''} className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-8 max-w-6xl mx-auto">
        {b.title && <h2 className="text-2xl md:text-4xl font-black text-white mb-2">{b.title}</h2>}
        {b.subtitle && <p className="text-white/80 text-sm mb-4 max-w-lg">{b.subtitle}</p>}
        {b.ctaText && (
          <a href={b.ctaHref || '#products'} className="inline-block px-6 py-3 rounded-xl text-sm font-bold text-white no-underline" style={{ background: primaryColor }}>
            {b.ctaText}
          </a>
        )}
      </div>
      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 right-6 flex gap-1.5">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              className="w-2 h-2 rounded-full border-none cursor-pointer transition-all"
              style={{ background: i === active ? '#fff' : 'rgba(255,255,255,0.4)' }} />
          ))}
        </div>
      )}
    </section>
  );
}
