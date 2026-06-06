// eseller.mn — Analytics Event Tracking (GA4 + Facebook Pixel)

declare global {
  interface Window { dataLayer: Record<string, unknown>[]; fbq: (...args: unknown[]) => void }
}

interface PurchaseItem {
  product?: {
    id?: string;
    name?: string;
  };
  productId?: string;
  name?: string;
  price?: number;
  quantity?: number;
}

export function trackPurchase(order: { id: string; total: number; items: PurchaseItem[]; couponCode?: string }) {
  if (typeof window === 'undefined') return;
  if (window.dataLayer) {
    window.dataLayer.push({
      event: 'purchase',
      ecommerce: {
        transaction_id: order.id, value: order.total, currency: 'MNT', coupon: order.couponCode,
        items: order.items.map((i) => ({ item_id: i.product?.id || i.productId, item_name: i.product?.name || i.name, price: i.price, quantity: i.quantity })),
      },
    });
  }
  if (window.fbq) {
    window.fbq('track', 'Purchase', { value: order.total, currency: 'MNT', content_type: 'product', content_ids: order.items.map((i) => i.product?.id || i.productId) });
  }
}

export function trackViewProduct(product: { id: string; name: string; price: number; category?: string }) {
  if (typeof window === 'undefined') return;
  if (window.dataLayer) {
    window.dataLayer.push({ event: 'view_item', ecommerce: { items: [{ item_id: product.id, item_name: product.name, price: product.price, item_category: product.category }] } });
  }
  if (window.fbq) {
    window.fbq('track', 'ViewContent', { content_ids: [product.id], content_name: product.name, value: product.price, currency: 'MNT', content_type: 'product' });
  }
}

export function trackAddToCart(product: { id: string; name: string; price: number }, qty: number) {
  if (typeof window === 'undefined') return;
  if (window.dataLayer) {
    window.dataLayer.push({ event: 'add_to_cart', ecommerce: { items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: qty }] } });
  }
  if (window.fbq) {
    window.fbq('track', 'AddToCart', { content_ids: [product.id], content_name: product.name, value: product.price * qty, currency: 'MNT' });
  }
}

export function trackSearch(query: string) {
  if (typeof window === 'undefined') return;
  if (window.dataLayer) {
    window.dataLayer.push({ event: 'search', search_term: query });
  }
  if (window.fbq) {
    window.fbq('track', 'Search', { search_string: query });
  }
}

export function trackSignUp() {
  if (typeof window === 'undefined') return;
  if (window.dataLayer) { window.dataLayer.push({ event: 'sign_up' }); }
  if (window.fbq) { window.fbq('track', 'CompleteRegistration'); }
}
