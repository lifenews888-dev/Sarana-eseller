// ══════════════════════════════════════════════════════════════
// eseller.mn — Image URL validation & sanitization
// Background: mobile clients were posting `file:///data/user/...`
// Android cache paths into Product.images, which web browsers
// cannot render. This module is the single gate for what we
// accept and what we hand back to clients.
// ══════════════════════════════════════════════════════════════

export const PLACEHOLDER_IMAGE = '/placeholder-product.svg';

// Schemes a public CDN URL can have. Anything else (file://,
// content://, data:, blob:, javascript:) is a local-device path
// or attack surface and must never reach the database.
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

export function isValidPublicImageUrl(url: unknown): url is string {
  if (typeof url !== 'string' || url.length === 0) return false;
  if (url.length > 2048) return false;
  try {
    const u = new URL(url);
    return ALLOWED_PROTOCOLS.includes(u.protocol);
  } catch {
    return false;
  }
}

// Filter a user-supplied image array down to only safe public URLs.
// Returns a brand-new array; never mutates the input.
export function sanitizeImageUrls(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of input) {
    if (!isValidPublicImageUrl(item)) continue;
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
    if (out.length >= 20) break;
  }
  return out;
}

// For read paths: replace bad URLs with placeholder so a stale row
// in the DB still renders something instead of a broken image.
export function getSafeImageUrl(url: unknown): string {
  return isValidPublicImageUrl(url) ? (url as string) : PLACEHOLDER_IMAGE;
}

export function getSafeImageList(urls: unknown): string[] {
  if (!Array.isArray(urls)) return [];
  return urls.map((u) => (isValidPublicImageUrl(u) ? (u as string) : PLACEHOLDER_IMAGE));
}
