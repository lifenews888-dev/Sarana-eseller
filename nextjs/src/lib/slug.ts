/**
 * Public URL slug helpers for shops / entities.
 * Supports Mongolian Cyrillic via transliteration so names like "Сайхан Дэлгүүр"
 * do not collapse to an empty slug on the client.
 */

const CYRILLIC_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z',
  и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', ө: 'o', п: 'p',
  р: 'r', с: 's', т: 't', у: 'u', ү: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch',
  ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  // Mongolian-specific letters often used in shop names
  ґ: 'g', ғ: 'g', қ: 'k', ң: 'n', ұ: 'u', һ: 'h',
};

export function transliterateCyrillic(input: string): string {
  return [...input].map((ch) => {
    const lower = ch.toLowerCase();
    if (CYRILLIC_MAP[lower] !== undefined) {
      const mapped = CYRILLIC_MAP[lower];
      return ch === lower ? mapped : mapped.charAt(0).toUpperCase() + mapped.slice(1);
    }
    return ch;
  }).join('');
}

export function normalizeSlug(value: unknown, maxLength = 48): string {
  if (typeof value !== 'string') return '';
  const transliterated = transliterateCyrillic(value.trim());
  return transliterated
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength);
}

export function ensureSlug(value: unknown, fallbackSeed: string, maxLength = 48): string {
  const normalized = normalizeSlug(value, maxLength);
  if (normalized) return normalized;
  const seed = normalizeSlug(fallbackSeed, maxLength) || 'shop';
  return `${seed}-${Date.now().toString(36).slice(-6)}`.slice(0, maxLength);
}
