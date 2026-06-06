// ══════════════════════════════════════════════════════════════
// eseller.mn — AI Storefront Config Generator
// Uses Claude API or falls back to rule-based generation
// ══════════════════════════════════════════════════════════════

import {
  type StorefrontConfig, type GenerateStorefrontInput, type Mood, type Section,
  MOOD_FONTS, MOOD_COLORS, createDefaultConfig,
} from '@/lib/types/storefront';

const SECTION_TYPES = new Set<Section['type']>([
  'hero_fullscreen',
  'hero_split',
  'hero_centered',
  'featured_products',
  'about_story',
  'instagram_grid',
  'testimonials',
  'video_banner',
  'category_showcase',
  'cta_banner',
  'contact_map',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSectionType(value: unknown): value is Section['type'] {
  return typeof value === 'string' && SECTION_TYPES.has(value as Section['type']);
}

function getAnthropicText(data: unknown): string | null {
  if (!isRecord(data) || !Array.isArray(data.content)) return null;
  const first = data.content[0];
  return isRecord(first) && typeof first.text === 'string' ? first.text : null;
}

/** Determine mood from category + price range */
function inferMood(category: string, priceRange: string): Mood {
  const cat = category.toLowerCase();
  if (priceRange === 'luxury') return 'luxury';
  if (priceRange === 'premium' && (cat.includes('fashion') || cat.includes('beauty') || cat.includes('jewelry'))) return 'elegant';
  if (cat.includes('organic') || cat.includes('food') || cat.includes('natural') || cat.includes('хоол')) return 'earthy';
  if (cat.includes('tech') || cat.includes('electronic') || cat.includes('auto')) return 'bold';
  if (cat.includes('kid') || cat.includes('toy') || cat.includes('хүүхэд')) return 'playful';
  if (cat.includes('repair') || cat.includes('factory') || cat.includes('засвар')) return 'industrial';
  if (cat.includes('salon') || cat.includes('spa') || cat.includes('beauty')) return 'elegant';
  if (priceRange === 'budget') return 'bold';
  return 'minimal';
}

/** Determine hero layout from mood */
function inferHeroLayout(mood: Mood): StorefrontConfig['hero']['layout'] {
  switch (mood) {
    case 'luxury': case 'elegant': return 'fullscreen';
    case 'bold': case 'industrial': return 'split_left';
    case 'playful': return 'split_right';
    case 'earthy': return 'centered';
    case 'minimal': default: return 'minimal';
  }
}

/** Suggest sections based on mood and category */
function inferSections(mood: Mood, category: string): Section[] {
  const cat = category.toLowerCase();
  const base: Section[] = [
    { id: 's1', type: mood === 'luxury' || mood === 'elegant' ? 'hero_fullscreen' : mood === 'bold' ? 'hero_split' : 'hero_centered', order: 0, visible: true, content: {} },
    { id: 's2', type: 'featured_products', order: 1, visible: true, content: { title: 'Онцлох бүтээгдэхүүн', count: 6 } },
  ];

  if (cat.includes('salon') || cat.includes('beauty') || cat.includes('fashion')) {
    base.push({ id: 's3', type: 'instagram_grid', order: 2, visible: true, content: { title: 'Галерей' } });
  }

  base.push({ id: 's4', type: 'about_story', order: base.length, visible: true, content: { title: 'Бидний тухай' } });

  if (mood === 'luxury' || mood === 'elegant') {
    base.push({ id: 's5', type: 'testimonials', order: base.length, visible: true, content: { title: 'Хэрэглэгчдийн сэтгэгдэл' } });
  }

  if (cat.includes('food') || cat.includes('хоол')) {
    base.push({ id: 's6', type: 'category_showcase', order: base.length, visible: true, content: { title: 'Ангилалууд' } });
  }

  base.push({ id: 's_cta', type: 'cta_banner', order: base.length, visible: true, content: { headline: 'Бидэнтэй нэгд', buttonText: 'Бүртгүүлэх' } });

  return base;
}

/** Try Claude API, fallback to rule-based */
export async function generateStorefrontConfig(input: GenerateStorefrontInput): Promise<StorefrontConfig> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Try AI generation
  if (apiKey) {
    try {
      const config = await generateWithClaude(input, apiKey);
      if (config) return config;
    } catch (e) {
      console.error('AI generation failed, falling back to rules:', e);
    }
  }

  // Fallback: rule-based generation
  return generateRuleBased(input);
}

/** Rule-based generation (no API needed) */
function generateRuleBased(input: GenerateStorefrontInput): StorefrontConfig {
  const mood = inferMood(input.category, input.priceRange);
  const colors = MOOD_COLORS[mood];
  const fonts = MOOD_FONTS[mood];
  const heroLayout = inferHeroLayout(mood);
  const sections = inferSections(mood, input.category);

  const config = createDefaultConfig('');
  config.sellerId = '';
  config.aiGenerated = true;
  config.theme = {
    mood,
    primaryColor: colors.primary,
    accentColor: colors.accent,
    backgroundColor: colors.bg,
    textColor: colors.text,
    fontDisplay: fonts.display,
    fontBody: fonts.body,
    borderRadius: mood === 'luxury' ? 'sharp' : mood === 'playful' ? 'round' : 'soft',
    spacing: mood === 'luxury' || mood === 'elegant' ? 'airy' : 'comfortable',
  };
  config.hero = {
    layout: heroLayout,
    headline: input.sellerName,
    subheadline: input.description.slice(0, 120),
    ctaText: 'Дэлгүүр үзэх',
    ctaUrl: '#products',
    backgroundType: input.productImages[0] ? 'image' : 'gradient',
    backgroundValue: input.productImages[0] || `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
    overlayOpacity: input.productImages[0] ? 0.4 : 0,
  };
  config.sections = sections;
  config.seo = {
    title: `${input.sellerName} — eseller.mn`,
    description: input.description,
    keywords: [input.category, input.sellerName, 'eseller.mn'],
    ogImage: input.logoUrl || input.productImages[0] || '',
  };

  return config;
}

/** Claude API generation */
async function generateWithClaude(input: GenerateStorefrontInput, apiKey: string): Promise<StorefrontConfig | null> {
  const prompt = `You are a world-class brand designer. Based on this seller's profile, generate a storefront config JSON.

Seller: ${input.sellerName}
Description: ${input.description}
Category: ${input.category}
Price range: ${input.priceRange}
Target audience: ${input.targetAudience || 'ерөнхий'}
Tone: ${input.tone || 'мэргэжлийн'}
Has product images: ${input.productImages.length > 0 ? 'yes' : 'no'}

Return a JSON object with these exact fields:
{
  "theme": { "mood": "elegant|bold|minimal|playful|earthy|industrial|luxury", "primaryColor": "#hex", "accentColor": "#hex", "backgroundColor": "#hex", "textColor": "#hex", "fontDisplay": "font name", "fontBody": "font name", "borderRadius": "sharp|soft|round", "spacing": "compact|comfortable|airy" },
  "hero": { "layout": "fullscreen|split_left|split_right|centered|minimal", "headline": "...", "subheadline": "...", "ctaText": "...", "backgroundType": "gradient", "overlayOpacity": 0.4 },
  "sections": [{ "type": "hero_fullscreen|hero_split|hero_centered|featured_products|about_story|instagram_grid|testimonials|cta_banner|category_showcase", "order": 0, "visible": true }]
}

Font options: Cormorant Garamond, Space Grotesk, Playfair Display, DM Sans, Unbounded, Lora, Syne
Rules: luxury→Cormorant Garamond, tech→Space Grotesk, organic→Lora, playful→Unbounded, minimal→DM Sans
Output ONLY valid JSON, no markdown.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) return null;

  const data: unknown = await res.json();
  const text = getAnthropicText(data);
  if (!text) return null;

  try {
    const parsed: unknown = JSON.parse(text);
    if (!isRecord(parsed)) return null;

    const config = createDefaultConfig('');
    config.aiGenerated = true;
    if (isRecord(parsed.theme)) {
      config.theme = { ...config.theme, ...parsed.theme } as StorefrontConfig['theme'];
    }
    if (isRecord(parsed.hero)) {
      config.hero = { ...config.hero, ...parsed.hero } as StorefrontConfig['hero'];
    }
    if (Array.isArray(parsed.sections)) {
      config.sections = parsed.sections
        .map((section, i): Section | null => {
          if (!isRecord(section) || !isSectionType(section.type)) return null;

          return {
            id: `s${i}`,
            type: section.type,
            order: typeof section.order === 'number' ? section.order : i,
            visible: section.visible !== false,
            content: isRecord(section.content) ? section.content : {},
          };
        })
        .filter((section): section is Section => section !== null);
    }
    return config;
  } catch {
    return null;
  }
}
