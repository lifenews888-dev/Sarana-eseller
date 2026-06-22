import { create } from 'zustand';

export type ShopType = 'product' | 'service' | 'hybrid';

interface ShopTypeState {
  shopType: ShopType;
  shopId: string | null;
  loaded: boolean;
  setShopType: (type: ShopType) => void;
  setActiveShop: (shopId: string, type: ShopType) => void;
  load: () => Promise<void>;
}

export const useShopTypeStore = create<ShopTypeState>((set, get) => ({
  shopType: 'product',
  shopId: null,
  loaded: false,

  setShopType: (type) => set({ shopType: type }),

  setActiveShop: (shopId, type) => {
    set({ shopType: type, shopId, loaded: true });
    try {
      const raw = localStorage.getItem('eseller_store_config');
      const config = raw ? JSON.parse(raw) : {};
      config.businessType = type;
      config.shopId = shopId;
      localStorage.setItem('eseller_store_config', JSON.stringify(config));
    } catch {}
  },

  load: async () => {
    if (get().loaded) return;

    // First try localStorage (fast, for offline/demo)
    try {
      const raw = localStorage.getItem('eseller_store_config');
      if (raw) {
        const config = JSON.parse(raw);
        if (config.businessType) {
          set({ shopType: config.businessType, shopId: config.shopId || null, loaded: true });
        }
      }
    } catch {}

    // Then try API (authoritative)
    try {
      const token = localStorage.getItem('token');
      if (!token) { set({ loaded: true }); return; }

      const shopId = get().shopId || localStorage.getItem('eseller_shop_id');
      if (!shopId) { set({ loaded: true }); return; }

      const res = await fetch(`/api/shop/${shopId}/type`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { data } = await res.json();
        if (data?.type) {
          set({ shopType: data.type, shopId, loaded: true });
          // Sync to localStorage for fast reload
          const raw = localStorage.getItem('eseller_store_config');
          const config = raw ? JSON.parse(raw) : {};
          config.businessType = data.type;
          config.shopId = shopId;
          localStorage.setItem('eseller_store_config', JSON.stringify(config));
        }
      }
    } catch {}

    set({ loaded: true });
  },
}));
