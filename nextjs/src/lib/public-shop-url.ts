export function publicShopHref(slug?: string | null) {
  const value = (slug || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/^s\//, '');
  return value ? `/s/${value}` : '/shops';
}

export function publicShopUrl(baseUrl: string, slug?: string | null) {
  return `${baseUrl.replace(/\/+$/, '')}${publicShopHref(slug)}`;
}
