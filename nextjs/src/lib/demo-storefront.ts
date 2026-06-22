import { DEMO_PRODUCTS } from '@/lib/utils';

const DEMO_STOREFRONT_SLUGS = new Set(['sarana-fashion', 'fashionmn']);

export function getDemoStorefrontBySlug(slug: string) {
  if (!DEMO_STOREFRONT_SLUGS.has(slug)) return null;

  const shop = {
    id: 'demo-sarana-fashion',
    name: 'Sarana Fashion',
    slug: 'sarana-fashion',
    storefrontSlug: 'sarana-fashion',
    logo: null,
    phone: '80801677',
    address: 'Ulaanbaatar',
    district: 'Ulaanbaatar',
    industry: 'store',
    allowSellers: true,
    sellerCommission: 10,
    storefrontConfig: null,
    user: { name: 'Sarana Fashion', avatar: null },
  };

  const products = DEMO_PRODUCTS
    .filter((product) => product.category === 'fashion')
    .map((product) => ({
      ...product,
      id: product._id,
      stock: 10,
    }));

  return { shop, products };
}

export function getDemoStorefrontMetadata(slug: string) {
  const demo = getDemoStorefrontBySlug(slug);
  if (!demo) return null;

  return {
    title: `${demo.shop.name} - eseller.mn`,
    description: demo.shop.address || demo.shop.name,
    openGraph: { title: demo.shop.name, images: [] },
  };
}
