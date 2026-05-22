import { prisma } from '@/lib/prisma';
import { Truck, RefreshCw, Lock, Star } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import MobileNav from '@/components/shared/MobileNav';
import HeroSearch from '@/components/home/HeroSearch';
import HeroVideoSlider from '@/components/home/HeroVideoSlider';
import CategoryIcons from '@/components/home/CategoryIcons';
import FeedPreview from '@/components/home/FeedPreview';
import PromoSection from '@/components/home/PromoSection';
import FeaturedShops from '@/components/home/FeaturedShops';
import GoldPromoBanner from '@/components/home/GoldPromoBanner';
import SellerSection from '@/components/home/SellerSection';
import StatsBar from '@/components/home/StatsBar';
import LiveSection from '@/components/LiveSection';
import { SocialFeedSection } from '@/components/SocialFeedSection';
import { HerderSection } from '@/components/HerderSection';

const KNOWN_BAD_IMAGE_REPLACEMENTS: Record<string, string> = {
  'https://images.unsplash.com/photo-1696446702183-cbd29e23b9c0?w=800':
    'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800',
  'https://images.unsplash.com/photo-1695048133142-1a20484429be?w=800':
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
};

function publicImageUrl(url?: string | null) {
  if (!url) return null;
  const value = url.trim();
  const replacement = KNOWN_BAD_IMAGE_REPLACEMENTS[value];
  if (replacement) return replacement;
  if (value.startsWith('/')) return value;

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? value : null;
  } catch {
    return null;
  }
}

async function getHomeData() {
  try {
    const [
      feedPosts, shops, products,
      heroBanners, sections,
      featuredProductRows, featuredShopRows, configs,
    ] = await Promise.all([
      prisma.feedItem.findMany({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { media: true },
      }),
      prisma.shop.findMany({
        where: { isBlocked: false },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.product.findMany({
        where: { isActive: true, salePrice: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      prisma.heroBanner.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }),
      prisma.homepageSection.findMany({
        orderBy: { order: 'asc' },
      }),
      prisma.featuredProduct.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }),
      prisma.featuredShop.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }),
      prisma.homepageConfig.findMany(),
    ]);

    // Map feedItems
    const mappedPosts = feedPosts.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      district: p.district,
      media: p.media,
      category: p.category ? { name: p.category } : null,
    }));

    // Map shops
    const mappedShops = shops.map((s) => ({
      id: s.id,
      name: s.name,
      logoUrl: publicImageUrl(s.logo),
      storefrontSlug: s.storefrontSlug || s.slug,
      rating: null,
      _count: { products: 0 },
    }));

    // Map products
    const mappedProducts = products.map((p) => {
      const imageUrl = publicImageUrl(p.images?.[0]);
      return {
        id: p.id,
        name: p.name,
        price: p.salePrice || p.price,
        media: imageUrl ? [{ url: imageUrl }] : [],
        entity: null,
      };
    });

    // Resolve featured products
    const fpIds = featuredProductRows.map((f) => f.productId);
    const fpProducts = fpIds.length
      ? await prisma.product.findMany({
          where: { id: { in: fpIds }, isActive: true },
          select: { id: true, name: true, price: true, salePrice: true, images: true },
        })
      : [];
    const fpMap = new Map(fpProducts.map((p) => [p.id, p]));
    const featuredProducts = featuredProductRows
      .map((f) => {
        const p = fpMap.get(f.productId);
        if (!p) return null;
        const imageUrl = publicImageUrl(p.images?.[0]);
        return {
          id: p.id,
          name: p.name,
          price: p.salePrice || p.price,
          media: imageUrl ? [{ url: imageUrl }] : [],
          entity: null,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    // Resolve featured shops
    const fsIds = featuredShopRows.map((f) => f.shopId);
    const fsShops = fsIds.length
      ? await prisma.shop.findMany({
          where: { id: { in: fsIds }, isBlocked: false },
          select: { id: true, name: true, logo: true, slug: true, storefrontSlug: true },
        })
      : [];
    const fsMap = new Map(fsShops.map((s) => [s.id, s]));
    const featuredShopsMapped = featuredShopRows
      .map((f) => {
        const s = fsMap.get(f.shopId);
        if (!s) return null;
        return {
          id: s.id,
          name: s.name,
          logoUrl: publicImageUrl(s.logo),
          storefrontSlug: s.storefrontSlug || s.slug,
          rating: null,
          _count: { products: 0 },
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    // Stats config
    const configMap = new Map(configs.map((c) => [c.key, c.value]));
    const stats = {
      useRealData: configMap.get('stats_use_real') === 'true',
      products: configMap.get('stats_products') || '10,000+',
      shops: configMap.get('stats_shops') || '500+',
      users: configMap.get('stats_users') || '50,000+',
    };

    // If real data requested, count from DB
    if (stats.useRealData) {
      const [productCount, shopCount, userCount] = await Promise.all([
        prisma.product.count({ where: { isActive: true } }),
        prisma.shop.count({ where: { isBlocked: false } }),
        prisma.user.count(),
      ]);
      stats.products = productCount.toLocaleString() + '+';
      stats.shops = shopCount.toLocaleString() + '+';
      stats.users = userCount.toLocaleString() + '+';
    }

    // Build section map for active checks
    const sectionMap = new Map(sections.map((s) => [s.key, s]));

    return {
      feedPosts: mappedPosts,
      entities: mappedShops,
      products: mappedProducts,
      heroBanners,
      sections: sections.filter((s) => s.isActive).sort((a, b) => a.order - b.order),
      sectionMap,
      featuredProducts,
      featuredShopsMapped,
      stats,
    };
  } catch {
    return {
      feedPosts: [], entities: [], products: [],
      heroBanners: [], sections: [], sectionMap: new Map(),
      featuredProducts: [], featuredShopsMapped: [], stats: null,
    };
  }
}

export default async function HomePage() {
  const {
    feedPosts, entities, products,
    heroBanners, sections, sectionMap,
    featuredProducts, featuredShopsMapped, stats,
  } = await getHomeData();
  const hasDatabaseConfig = Boolean(process.env.DATABASE_URL);

  // Helper to check if section is active
  const isActive = (key: string) => {
    const s = sectionMap.get(key);
    return s ? s.isActive : true; // default active if not in DB yet
  };

  // Render sections in order from DB
  const renderSection = (key: string) => {
    if (!isActive(key)) return null;
    switch (key) {
      case 'hero':
        return <HeroVideoSlider key="hero" banners={heroBanners} />;
      case 'categories':
        return <CategoryIcons key="categories" />;
      case 'featured_products':
        return featuredProducts.length > 0
          ? <PromoSection key="featured_products" products={featuredProducts} title="Онцлох бараа" />
          : null;
      case 'promo':
        return <PromoSection key="promo" products={products} />;
      case 'featured_shops':
        return featuredShopsMapped.length > 0
          ? <FeaturedShops key="featured_shops" entities={featuredShopsMapped} />
          : <FeaturedShops key="featured_shops_default" entities={entities} />;
      case 'stats':
        return stats ? <StatsBar key="stats" stats={stats} /> : null;
      case 'gold':
        return <GoldPromoBanner key="gold" />;
      case 'seller':
        return <SellerSection key="seller" />;
      default:
        return null;
    }
  };

  return (
    <>
      <Navbar />
      <main className="pb-20 md:pb-0">
        {/* If sections exist in DB, render in DB order */}
        {sections.length > 0 ? (
          <>
            {sections.map((s) => renderSection(s.key))}
            {/* Always show search + trust after hero */}
            <HeroSearch />
            <TrustBadges />
            {/* Feed is always shown */}
            <FeedPreview posts={feedPosts} />
          </>
        ) : (
          <>
            {/* Fallback: original static order */}
            <HeroVideoSlider banners={heroBanners} />
            {hasDatabaseConfig ? <LiveSection /> : null}
            <HeroSearch />
            <TrustBadges />
            <CategoryIcons />
            <SocialFeedSection />
            <FeedPreview posts={feedPosts} />
            <HerderSection />
            <PromoSection products={products} />
            <FeaturedShops entities={entities} />
            <GoldPromoBanner />
            <SellerSection />
          </>
        )}
      </main>
      <Footer />
      <MobileNav />
    </>
  );
}

function TrustBadges() {
  const badges = [
    { icon: <Truck className="w-5 h-5 text-[var(--esl-accent)]" />, text: '50,000₮+ үнэгүй хүргэлт' },
    { icon: <RefreshCw className="w-5 h-5 text-[var(--esl-accent)]" />, text: '48 цагийн буцаалт' },
    { icon: <Lock className="w-5 h-5 text-[var(--esl-accent)]" />, text: 'QPay аюулгүй төлбөр' },
    { icon: <Star className="w-5 h-5 text-[var(--esl-accent)]" />, text: 'Баталгаат бараа' },
  ];
  return (
    <div className="bg-[var(--esl-bg-card)] border-y border-[var(--esl-border)]">
      <div className="max-w-[1200px] mx-auto px-4 py-3 flex justify-around flex-wrap gap-2">
        {badges.map((b, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-1.5">
            {b.icon}
            <span className="text-[var(--esl-text-muted)] text-[13px] font-medium">{b.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
