// ══════════════════════════════════════════════════════════════
// eseller.mn — Storefront Configuration Types
// AI-driven unique storefront for every seller
// ══════════════════════════════════════════════════════════════

import { REALISTIC_BANNER_IMAGES } from '@/lib/realistic-banner-assets';

export type FontFamily =
  | 'Cormorant Garamond'
  | 'Space Grotesk'
  | 'Playfair Display'
  | 'DM Sans'
  | 'Unbounded'
  | 'Lora'
  | 'Syne';

export type Mood = 'elegant' | 'bold' | 'minimal' | 'playful' | 'earthy' | 'industrial' | 'luxury';

export type SectionType =
  | 'hero_fullscreen'
  | 'hero_split'
  | 'hero_centered'
  | 'featured_products'
  | 'about_story'
  | 'instagram_grid'
  | 'testimonials'
  | 'video_banner'
  | 'category_showcase'
  | 'cta_banner'
  | 'contact_map';

export interface Section {
  id: string;
  type: SectionType;
  order: number;
  visible: boolean;
  content: Record<string, unknown>;
}

export interface StorefrontTheme {
  mood: Mood;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontDisplay: FontFamily;
  fontBody: FontFamily;
  borderRadius: 'sharp' | 'soft' | 'round';
  spacing: 'compact' | 'comfortable' | 'airy';
}

export interface StorefrontHero {
  layout: 'fullscreen' | 'split_left' | 'split_right' | 'centered' | 'minimal';
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaUrl: string;
  backgroundType: 'image' | 'video' | 'solid_color' | 'gradient';
  backgroundValue: string;
  overlayOpacity: number;
}

export interface StorefrontSeo {
  title: string;
  description: string;
  keywords: string[];
  ogImage: string;
}

export interface StorefrontCustom {
  customCss?: string;
  customDomain?: string;
  analytics?: string;
}

export interface StorefrontConfig {
  sellerId: string;
  version: number;
  aiGenerated: boolean;
  lastEditedAt: string;
  theme: StorefrontTheme;
  hero: StorefrontHero;
  sections: Section[];
  seo: StorefrontSeo;
  custom: StorefrontCustom;
}

// ═══ AI Generation Input ═══

export interface GenerateStorefrontInput {
  sellerName: string;
  description: string;
  category: string;
  productImages: string[];
  logoUrl?: string;
  targetAudience?: string;
  priceRange: 'budget' | 'mid' | 'premium' | 'luxury';
  tone?: string;
}

// ═══ Defaults / Presets ═══

export const MOOD_FONTS: Record<Mood, { display: FontFamily; body: FontFamily }> = {
  elegant: { display: 'Cormorant Garamond', body: 'DM Sans' },
  bold: { display: 'Space Grotesk', body: 'DM Sans' },
  minimal: { display: 'DM Sans', body: 'DM Sans' },
  playful: { display: 'Unbounded', body: 'DM Sans' },
  earthy: { display: 'Lora', body: 'DM Sans' },
  industrial: { display: 'Space Grotesk', body: 'Space Grotesk' },
  luxury: { display: 'Playfair Display', body: 'Cormorant Garamond' },
};

export const MOOD_COLORS: Record<Mood, { primary: string; accent: string; bg: string; text: string }> = {
  elegant: { primary: '#1A1A2E', accent: '#C9A96E', bg: '#FAFAF8', text: '#2D2D2D' },
  bold: { primary: '#E31E24', accent: '#FF6B35', bg: '#FFFFFF', text: '#1A1A1A' },
  minimal: { primary: '#111111', accent: '#555555', bg: '#FFFFFF', text: '#333333' },
  playful: { primary: '#6C5CE7', accent: '#FD79A8', bg: '#FEFEFE', text: '#2D3436' },
  earthy: { primary: '#5C4033', accent: '#8B6914', bg: '#FAF5EF', text: '#3E2723' },
  industrial: { primary: '#37474F', accent: '#FF6F00', bg: '#ECEFF1', text: '#263238' },
  luxury: { primary: '#0D0D0D', accent: '#D4AF37', bg: '#FFFDF7', text: '#1A1A1A' },
};

export const RADIUS_MAP = { sharp: '0px', soft: '8px', round: '16px' };
export const SPACING_MAP = { compact: '16px', comfortable: '24px', airy: '40px' };

export function createDefaultConfig(sellerId: string): StorefrontConfig {
  return {
    sellerId,
    version: 1,
    aiGenerated: false,
    lastEditedAt: new Date().toISOString(),
    theme: {
      mood: 'minimal',
      ...MOOD_COLORS.minimal,
      primaryColor: MOOD_COLORS.minimal.primary,
      accentColor: MOOD_COLORS.minimal.accent,
      backgroundColor: MOOD_COLORS.minimal.bg,
      textColor: MOOD_COLORS.minimal.text,
      fontDisplay: 'DM Sans',
      fontBody: 'DM Sans',
      borderRadius: 'soft',
      spacing: 'comfortable',
    },
    hero: {
      layout: 'centered',
      headline: 'Манай дэлгүүрт тавтай морил',
      subheadline: 'Чанартай бараа, хурдан хүргэлт',
      ctaText: 'Дэлгүүр үзэх',
      ctaUrl: '#products',
      backgroundType: 'image',
      backgroundValue: REALISTIC_BANNER_IMAGES.storefronts,
      overlayOpacity: 0.55,
    },
    sections: [
      { id: 's1', type: 'hero_centered', order: 0, visible: true, content: {} },
      { id: 's2', type: 'featured_products', order: 1, visible: true, content: { title: 'Онцлох бараа', count: 6 } },
      { id: 's3', type: 'about_story', order: 2, visible: true, content: { title: 'Бидний тухай', text: '' } },
      { id: 's4', type: 'cta_banner', order: 3, visible: true, content: { headline: 'Бүртгүүлээрэй', text: 'Шинэ бараа, хямдралын мэдээлэл авах', buttonText: 'Бүртгүүлэх' } },
    ],
    seo: { title: '', description: '', keywords: [], ogImage: '' },
    custom: {},
  };
}
