/** Detect corrupted UTF-8 / placeholder text unsuitable for public marketplace surfaces. */

export function looksLikeMojibake(text: string | null | undefined): boolean {
  if (!text) return false;
  if (text.includes('\uFFFD')) return true;
  // UTF-8 misread as Latin-1 / Windows-1252
  if (/[ÐÑÃÂ][\u0080-\u00ff]/.test(text)) return true;
  // Live feed artifacts like "D?D_D3" / "O\"D�D'"
  if (/D[?�_]{1,4}/.test(text)) return true;
  if (/(?:Ã.|Â.|Ð.|Ñ.){2,}/.test(text)) return true;
  const compact = text.replace(/\s/g, '');
  if (compact.length < 4) return false;
  const weird = (text.match(/[^\p{L}\p{N}\s\d₮.,%+\-–—/()'":&!?]/gu) || []).length;
  return weird / text.length > 0.4;
}

export function looksLikePlaceholderName(text: string | null | undefined): boolean {
  const name = (text || '').trim().toLowerCase();
  if (!name || name.length < 2) return true;
  return ['test', 'demo', 'asdf', 'qwer', 'xxx', 'hhh', 'aaa'].includes(name);
}

/** Initials avatar when shop/entity has no logo. */
export function avatarFallbackUrl(name: string, background = 'E8242C'): string {
  const label = (name || 'S').trim().slice(0, 40) || 'S';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=${background}&color=fff&size=128&bold=true`;
}
