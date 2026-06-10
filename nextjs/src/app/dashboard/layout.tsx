'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useShopTypeStore, type ShopType } from '@/lib/shop-type-store';
import Sidebar, { type SidebarSection } from '@/components/dashboard/Sidebar';

type SellerStoreOption = {
  id: string;
  name: string;
  slug: string;
  entityType: string;
  storeType: ShopType;
  href: string;
  logo?: string | null;
};

// ═══════════════════════════════════════════════════════
// Shared sections (used by both product and service)
// ═══════════════════════════════════════════════════════

const SAMBAR_PRODUCT: SidebarSection = {
  title: 'Самбар',
  items: [
    { href: '/dashboard/store', icon: '📊', label: 'Самбар' },
    { href: '/dashboard/store/orders', icon: '📋', label: 'Захиалга' },
    { href: '/dashboard/store/chat', icon: '💬', label: 'Чат', isNew: true },
    { href: '/dashboard/store/chat-settings', icon: '⚙️', label: 'Чат тохиргоо' },
  ],
};

const SAMBAR_SERVICE: SidebarSection = {
  title: 'Самбар',
  items: [
    { href: '/dashboard/store', icon: '📊', label: 'Самбар' },
    { href: '/dashboard/store/orders', icon: '📋', label: 'Захиалга' },
    { href: '/dashboard/store/chat', icon: '💬', label: 'Чат', isNew: true },
    { href: '/dashboard/store/chat-settings', icon: '⚙️', label: 'Чат тохиргоо' },
  ],
};

const PRODUCT_MANAGEMENT: SidebarSection = {
  title: 'Бараа удирдлага',
  items: [
    { href: '/dashboard/store/products', icon: '📦', label: 'Бүтээгдэхүүн' },
    { href: '/dashboard/store/categories', icon: '📂', label: 'Ангилал' },
    { href: '/dashboard/store/brands', icon: '🏷️', label: 'Брэнд' },
    { href: '/dashboard/store/inventory', icon: '📊', label: 'Нөөцийн удирдлага' },
    { href: '/dashboard/store/products/bulk', icon: '📄', label: 'CSV бөөнөөр оруулах', isNew: true },
    { href: '/dashboard/store/dropship', icon: '🚚', label: 'Dropshipping', isNew: true },
  ],
};

const SERVICE_MANAGEMENT: SidebarSection = {
  title: 'Үйлчилгээ удирдлага',
  items: [
    { href: '/dashboard/store/services', icon: '🛎️', label: 'Үйлчилгээнүүд' },
    { href: '/dashboard/store/bookings', icon: '📅', label: 'Цаг захиалга' },
    { href: '/dashboard/store/working-hours', icon: '🕐', label: 'Цагийн хуваарь' },
    { href: '/dashboard/store/service-categories', icon: '📂', label: 'Ангилал' },
  ],
};

const CUSTOMER_SALES: SidebarSection = {
  title: 'Хэрэглэгч & Борлуулалт',
  items: [
    { href: '/dashboard/store/customers', icon: '👥', label: 'Хэрэглэгч' },
    { href: '/dashboard/store/sellers', icon: '📢', label: 'Борлуулагчид', isNew: true },
    { href: '/dashboard/store/commissions', icon: '💰', label: 'Комисс тайлан', isNew: true },
    { href: '/dashboard/store/promotions', icon: '🎁', label: 'Урамшуулал' },
    { href: '/dashboard/store/promo-codes', icon: '🏷️', label: 'Промо код' },
    { href: '/dashboard/store/giftcards', icon: '💳', label: 'Бэлгийн карт' },
    { href: '/dashboard/store/reviews', icon: '⭐', label: 'Сэтгэгдэл' },
  ],
};

const CONTENT: SidebarSection = {
  title: 'Контент',
  items: [
    { href: '/dashboard/store/blog', icon: '📝', label: 'Нийтлэл' },
    { href: '/dashboard/store/marketing', icon: '📢', label: 'Маркетинг' },
  ],
};

const AI_SECTION: SidebarSection = {
  title: 'AI Инноваци',
  items: [
    { href: '/dashboard/store/ai-poster', icon: '🎨', label: 'AI Постер үүсгэгч' },
    { href: '/dashboard/store/ai-logo', icon: '✨', label: 'AI Лого үүсгэгч' },
    { href: '/dashboard/store/ai-description', icon: '📝', label: 'AI Тайлбар бичигч' },
    { href: '/dashboard/store/ai-analytics', icon: '🤖', label: 'AI Зөвлөгч' },
  ],
};

const FINANCE: SidebarSection = {
  title: 'Санхүү & Тайлан',
  items: [
    { href: '/dashboard/store/revenue', icon: '💵', label: 'Орлого' },
    { href: '/dashboard/store/wallet', icon: '💰', label: 'Хэтэвч' },
    { href: '/dashboard/store/analytics', icon: '📈', label: 'Хандалт & Тайлан' },
    { href: '/dashboard/store/integrations', icon: '🔗', label: 'Интеграц', isNew: true },
  ],
};

const STORE_SETTINGS: SidebarSection = {
  title: 'Дэлгүүрийн тохиргоо',
  items: [
    { href: '/dashboard/store/store-settings', icon: '🎨', label: 'Нүүр хуудас & Дизайн' },
    { href: '/dashboard/store/settings/shop-type', icon: '🏪', label: 'Дэлгүүрийн төрөл' },
    { href: '/dashboard/store/branches', icon: '🏪', label: 'Салбар удирдах' },
    { href: '/dashboard/store/staff', icon: '👔', label: 'Ажилтан' },
    { href: '/dashboard/store/settings', icon: '⚙️', label: 'Ерөнхий тохиргоо' },
  ],
};

const ENTERPRISE: SidebarSection = {
  title: 'Enterprise',
  items: [
    { href: '/dashboard/seller/enterprise', icon: '🌐', label: 'Subdomain тохиргоо', isNew: true },
    { href: '/dashboard/seller/team', icon: '👥', label: 'Баг удирдлага', isNew: true },
  ],
};

const PACKAGE: SidebarSection = {
  title: 'Багц & Төлбөр',
  items: [
    { href: '/dashboard/store/package', icon: '👑', label: 'Миний багц' },
    { href: '/dashboard/store/logs', icon: '📋', label: 'Лог бүртгэл' },
  ],
};

// ═══════════════════════════════════════════════════════
// Entity-specific sidebar sections
// ═══════════════════════════════════════════════════════

const PRE_ORDER_MANAGEMENT: SidebarSection = {
  title: 'Захиалгын удирдлага',
  items: [
    { href: '/dashboard/store/catalog', icon: '📖', label: 'Бараа каталог' },
    { href: '/dashboard/store/queue', icon: '📋', label: 'Захиалгын дараалал', isNew: true },
    { href: '/dashboard/store/batches', icon: '📦', label: 'Багцын захиалга', isNew: true },
    { href: '/dashboard/store/tracking', icon: '📍', label: 'Ирааны мөрдөлт', isNew: true },
    { href: '/dashboard/store/deposits', icon: '💳', label: 'Урьдчилгаа', isNew: true },
    { href: '/dashboard/store/waitlist', icon: '👥', label: 'Хүлээлтийн жагсаалт' },
  ],
};

const AGENT_MANAGEMENT: SidebarSection = {
  title: 'Агентын удирдлага',
  items: [
    { href: '/dashboard/store/listings', icon: '🏠', label: 'Зарууд' },
    { href: '/dashboard/store/listings/new?entityType=agent', icon: '➕', label: 'Зар нэмэх' },
    { href: '/dashboard/store/map', icon: '🗺️', label: 'Байршлын зураг' },
    { href: '/dashboard/store/inquiries', icon: '📩', label: 'Хариу хүсэлт' },
    { href: '/dashboard/store/profile', icon: '👤', label: 'Профайл' },
  ],
};

const COMPANY_MANAGEMENT: SidebarSection = {
  title: 'Компанийн удирдлага',
  items: [
    { href: '/dashboard/store/projects', icon: '🏗️', label: 'Төслүүд' },
    { href: '/dashboard/store/listings/new?entityType=company', icon: '➕', label: 'Төсөл нэмэх' },
    { href: '/dashboard/store/gallery', icon: '🖼️', label: 'Бүтээгдэхүүний галерей' },
    { href: '/dashboard/store/documents', icon: '📄', label: 'Баримт бичиг' },
    { href: '/dashboard/store/inquiries', icon: '📩', label: 'Хүсэлт / Inquiry' },
    { href: '/dashboard/store/promote', icon: '⭐', label: 'VIP байршил' },
  ],
};

const AUTO_DEALER_MANAGEMENT: SidebarSection = {
  title: 'Авто удирдлага',
  items: [
    { href: '/dashboard/store/vehicles', icon: '🚗', label: 'Машины жагсаалт' },
    { href: '/dashboard/store/listings/new?entityType=auto_dealer', icon: '➕', label: 'Машин нэмэх' },
    { href: '/dashboard/store/test-drives', icon: '📅', label: 'Тест драйв захиалга' },
    { href: '/dashboard/store/specs', icon: '📄', label: 'Техник үзүүлэлт' },
    { href: '/dashboard/store/pricing', icon: '📊', label: 'Үнийн харьцуулалт' },
  ],
};

const DIGITAL_MANAGEMENT: SidebarSection = {
  title: 'Дижитал удирдлага',
  items: [
    { href: '/dashboard/store/files', icon: '📁', label: 'Файлууд' },
    { href: '/dashboard/store/downloads', icon: '⬇️', label: 'Татаж авалтууд' },
    { href: '/dashboard/store/licenses', icon: '🔑', label: 'Лицензүүд' },
  ],
};

// ═══════════════════════════════════════════════════════
// Build seller sidebar based on shopType + entityType
// ═══════════════════════════════════════════════════════

function getSellerSections(shopType: ShopType, entityType?: string): SidebarSection[] {
  // Entity-specific dashboards
  if (entityType === 'pre_order') {
    return [SAMBAR_PRODUCT, PRE_ORDER_MANAGEMENT, CUSTOMER_SALES, AI_SECTION, FINANCE, STORE_SETTINGS, PACKAGE];
  }
  if (entityType === 'agent') {
    return [SAMBAR_PRODUCT, AGENT_MANAGEMENT, AI_SECTION, FINANCE, STORE_SETTINGS, PACKAGE];
  }
  if (entityType === 'company') {
    return [SAMBAR_PRODUCT, COMPANY_MANAGEMENT, CUSTOMER_SALES, AI_SECTION, FINANCE, STORE_SETTINGS, PACKAGE];
  }
  if (entityType === 'auto_dealer') {
    return [SAMBAR_PRODUCT, AUTO_DEALER_MANAGEMENT, CUSTOMER_SALES, AI_SECTION, FINANCE, STORE_SETTINGS, PACKAGE];
  }
  if (entityType === 'digital') {
    return [SAMBAR_PRODUCT, DIGITAL_MANAGEMENT, CUSTOMER_SALES, AI_SECTION, FINANCE, STORE_SETTINGS, PACKAGE];
  }

  // ShopType-based (original logic)
  if (shopType === 'service') {
    return [SAMBAR_SERVICE, SERVICE_MANAGEMENT, CUSTOMER_SALES, CONTENT, AI_SECTION, FINANCE, STORE_SETTINGS, PACKAGE];
  }
  if (shopType === 'hybrid') {
    return [SAMBAR_PRODUCT, PRODUCT_MANAGEMENT, SERVICE_MANAGEMENT, CUSTOMER_SALES, CONTENT, AI_SECTION, FINANCE, STORE_SETTINGS, PACKAGE];
  }

  // product (default)
  return [SAMBAR_PRODUCT, PRODUCT_MANAGEMENT, CUSTOMER_SALES, CONTENT, AI_SECTION, FINANCE, STORE_SETTINGS, ENTERPRISE, PACKAGE];
}

// ═══════════════════════════════════════════════════════
// Other role sidebars
// ═══════════════════════════════════════════════════════

const ADMIN_SECTIONS: SidebarSection[] = [
  {
    title: 'Удирдлага',
    items: [
      { href: '/dashboard/admin', icon: '📊', label: 'Самбар' },
      { href: '/dashboard/admin/users', icon: '👥', label: 'Хэрэглэгчид' },
      { href: '/dashboard/admin/sellers', icon: '🏷️', label: 'Борлуулагчид', isNew: true },
      { href: '/dashboard/admin/shops', icon: '🏪', label: 'Дэлгүүрүүд' },
      { href: '/dashboard/admin/revenue', icon: '💵', label: 'Орлого' },
      { href: '/dashboard/admin/commission', icon: '💰', label: 'Комисс' },
      { href: '/dashboard/admin/banners', icon: '🖼️', label: 'Баннер' },
    ],
  },
  {
    title: 'Контент & Маркетинг',
    items: [
      { href: '/dashboard/admin/homepage', icon: '🏠', label: 'Нүүр хуудас' },
      { href: '/dashboard/admin/marketing', icon: '📢', label: 'Маркетинг' },
      { href: '/dashboard/admin/categories', icon: '📂', label: 'Ангилал', isNew: true },
      { href: '/dashboard/admin/locations', icon: '📍', label: 'Байршил' },
      { href: '/dashboard/admin/chat-monitor', icon: '💬', label: 'Чат хяналт' },
      { href: '/dashboard/admin/enterprise', icon: '🏢', label: 'Enterprise', isNew: true },
      { href: '/dashboard/admin/returns', icon: '🔄', label: 'Буцаалт' },
    ],
  },
  {
    title: 'Гэрээт байгууллага',
    items: [
      { href: '/dashboard/admin/partners', icon: '🤝', label: 'Компаниуд', isNew: true },
      { href: '/dashboard/admin/partners/agents', icon: '👔', label: 'Агентууд' },
      { href: '/dashboard/admin/partners/invoices', icon: '🧾', label: 'Нэхэмжлэл' },
    ],
  },
  {
    title: 'Удирдлага',
    items: [
      { href: '/dashboard/admin/commission-rules', icon: '⚙️', label: 'Commission дүрэм', isNew: true },
      { href: '/dashboard/admin/system-rules', icon: '🛡️', label: 'Системийн дүрэм', isNew: true },
      { href: '/dashboard/admin/influencers', icon: '⭐', label: 'Инфлюэнсер', isNew: true },
      { href: '/dashboard/admin/vat-monitor', icon: '🧾', label: 'НӨАТ хяналт' },
      { href: '/dashboard/admin/disputes', icon: '⚠️', label: 'Маргаан' },
    ],
  },
  {
    title: 'Систем',
    items: [
      { href: '/dashboard/admin/site-settings', icon: '🌐', label: 'Сайтын тохиргоо', isNew: true },
      { href: '/dashboard/admin/config', icon: '⚙️', label: 'Тохиргоо' },
      { href: '/dashboard/admin/ai', icon: '🧠', label: 'Claude AI' },
      { href: '/dashboard/admin/analytics-dashboard', icon: '📈', label: 'Аналитик' },
    ],
  },
];

const AFFILIATE_SECTIONS: SidebarSection[] = [
  {
    title: 'Борлуулагч',
    items: [
      { href: '/dashboard/affiliate', icon: '📊', label: 'Самбар' },
      { href: '/dashboard/affiliate/products', icon: '🛍️', label: 'Бараа сонгох' },
      { href: '/dashboard/affiliate/commissions', icon: '💰', label: 'Комиссын тайлан', isNew: true },
      { href: '/dashboard/affiliate/earnings', icon: '📈', label: 'Орлого' },
      { href: '/dashboard/affiliate/wallet', icon: '💳', label: 'Хэтэвч' },
    ],
  },
  {
    title: 'Хэрэгсэл',
    items: [
      { href: '/dashboard/affiliate/marketing', icon: '📢', label: 'Маркетинг' },
      { href: '/dashboard/chat', icon: '💬', label: 'Чат' },
      { href: '/dashboard/affiliate/influencer-apply', icon: '⭐', label: 'Инфлюэнсер', isNew: true },
    ],
  },
];

const DELIVERY_SECTIONS: SidebarSection[] = [
  {
    title: 'Жолооч',
    items: [
      { href: '/dashboard/delivery', icon: '🚚', label: 'Самбар' },
      { href: '/dashboard/delivery/active', icon: '📦', label: 'Идэвхтэй хүргэлт' },
      { href: '/dashboard/delivery/history', icon: '📋', label: 'Түүх' },
      { href: '/dashboard/delivery/earnings', icon: '💰', label: 'Орлого' },
    ],
  },
];

const BUYER_SECTIONS: SidebarSection[] = [
  {
    title: 'Миний данс',
    items: [
      { href: '/dashboard', icon: '📊', label: 'Самбар' },
      { href: '/store', icon: '🛒', label: 'Дэлгүүр' },
      { href: '/dashboard/orders', icon: '📦', label: 'Захиалгууд' },
      { href: '/dashboard/wishlist', icon: '❤️', label: 'Хүслийн жагсаалт' },
    ],
  },
  {
    title: 'Миний профайл',
    items: [
      { href: '/gold', icon: '👑', label: 'Loyalty & Gold' },
      { href: '/feed', icon: '📋', label: 'Зарын булан' },
      { href: '/dashboard/settings', icon: '⚙️', label: 'Тохиргоо' },
    ],
  },
];

const OTHER_ROLE_SECTIONS: Record<string, SidebarSection[]> = {
  admin: ADMIN_SECTIONS,
  superadmin: ADMIN_SECTIONS,
  affiliate: AFFILIATE_SECTIONS,
  delivery: DELIVERY_SECTIONS,
  buyer: BUYER_SECTIONS,
};

// ═══════════════════════════════════════════════════════
// Layout
// ═══════════════════════════════════════════════════════

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [ready] = useState(() => (typeof window !== 'undefined' ? !!localStorage.getItem('token') : false));
  const [stores, setStores] = useState<SellerStoreOption[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(() => (
    typeof window !== 'undefined' ? localStorage.getItem('eseller_active_store_id') : null
  ));

  const shopType = useShopTypeStore((s) => s.shopType);
  const loadShopType = useShopTypeStore((s) => s.load);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login');
      } else {
        loadShopType();
      }
    }
  }, [router, loadShopType]);

  const [mobileOpen, setMobileOpen] = useState(false);
  const role = user?.role || 'buyer';
  const isSellerRole = ['seller', 'agent', 'company', 'auto_dealer', 'service'].includes(role);

  useEffect(() => {
    if (!isSellerRole) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    let cancelled = false;

    fetch('/api/seller/my-stores', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.ok ? response.json() : { stores: [] })
      .then((data) => {
        if (cancelled) return;
        const nextStores = Array.isArray(data.stores) ? data.stores : [];
        setStores(nextStores);

        const savedId = localStorage.getItem('eseller_active_store_id');
        const savedStillExists = savedId && nextStores.some((store: SellerStoreOption) => store.id === savedId);
        const nextActiveId = savedStillExists ? savedId : nextStores[0]?.id || null;

        setActiveStoreId(nextActiveId);
        if (nextActiveId) {
          const active = nextStores.find((store: SellerStoreOption) => store.id === nextActiveId);
          localStorage.setItem('eseller_active_store_id', nextActiveId);
          localStorage.setItem('eseller_shop_id', nextActiveId);
          if (active) {
            localStorage.setItem('eseller_active_store_type', active.entityType);
            localStorage.setItem('eseller_active_store_business_type', active.storeType);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setStores([]);
      });

    return () => {
      cancelled = true;
    };
  }, [isSellerRole]);

  const handleStoreChange = (storeId: string) => {
    const active = stores.find((store) => store.id === storeId);
    setActiveStoreId(storeId);
    localStorage.setItem('eseller_active_store_id', storeId);
    localStorage.setItem('eseller_shop_id', storeId);
    if (active) {
      localStorage.setItem('eseller_active_store_type', active.entityType);
      localStorage.setItem('eseller_active_store_business_type', active.storeType);
      let config: Record<string, unknown> = {};
      try {
        const raw = localStorage.getItem('eseller_store_config');
        config = raw ? JSON.parse(raw) : {};
      } catch {}
      config.businessType = active.storeType;
      config.shopId = storeId;
      localStorage.setItem('eseller_store_config', JSON.stringify(config));
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-[var(--esl-bg-page)] flex items-center justify-center">
        <div className="text-[var(--esl-text-muted)] text-sm">Ачааллаж байна...</div>
      </div>
    );
  }

  const activeStore = stores.find((store) => store.id === activeStoreId) || stores[0] || null;
  const userEntityType = activeStore?.entityType || user?.entityType || undefined;
  const effectiveShopType = activeStore?.storeType || shopType;
  const sections = isSellerRole
    ? getSellerSections(effectiveShopType, userEntityType)
    : OTHER_ROLE_SECTIONS[role] || BUYER_SECTIONS;

  const storeInfo = isSellerRole
    ? {
        id: activeStore?.id,
        name: activeStore?.name || user?.store?.name || user?.name + 'ийн дэлгүүр',
        url: activeStore?.href ? `eseller.mn${activeStore.href}` : activeStore?.slug ? `eseller.mn/s/${activeStore.slug}` : (user?.store?.name || user?.name || 'store').toLowerCase().replace(/\s+/g, '-') + '.eseller.mn',
        href: activeStore?.href,
        entityType: userEntityType,
        plan: 'Үнэгүй',
        planBadge: 'Үнэгүй туршилт',
      }
    : undefined;

  return (
    <div className="min-h-screen bg-[var(--esl-bg-page)]">
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[var(--esl-bg-section)] border-b border-[var(--esl-border)] flex items-center px-4 z-50">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="w-9 h-9 rounded-lg bg-[var(--esl-bg-card)] border border-[var(--esl-border)] flex items-center justify-center text-[var(--esl-text-muted)] cursor-pointer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
        </button>
        <span className="ml-3 text-sm font-bold text-[var(--esl-text-primary)]">eseller<span className="text-[#E8242C]">.mn</span></span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — hidden on mobile, slide-in when open */}
      <div className={`md:block ${mobileOpen ? 'block' : 'hidden'}`}>
        <Sidebar
          sections={sections}
          storeInfo={storeInfo}
          stores={stores}
          activeStoreId={activeStoreId}
          onStoreChange={handleStoreChange}
        />
      </div>

      <main className="ml-0 md:ml-[260px] min-h-screen transition-all duration-300 p-4 pt-20 md:pt-6 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
