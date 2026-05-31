export function safeRelativeRedirect(target: string | null | undefined): string {
  if (!target) return '';

  const trimmed = target.trim();
  if (!trimmed.startsWith('/')) return '';
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) return '';
  if (trimmed.includes('\\') || trimmed.includes('://')) return '';
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) return '';

  return trimmed;
}
