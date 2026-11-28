import { lookup } from 'dns/promises';
import net from 'net';

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = ip.toLowerCase();
  if (v.startsWith('::ffff:')) return isPrivateIp(v.slice(7));
  return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80');
}

/** Гадаад URL-ийг серверээс татахын өмнө шалгана — дотоод сүлжээ, metadata хаяг руу хандуулахгүй (SSRF). */
export async function assertPublicHttpUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('URL буруу байна');
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Зөвхөн http(s) холбоос зөвшөөрнө');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (!host || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) throw new Error('Энэ хаягийг ашиглах боломжгүй');
  const addrs = net.isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);
  if (addrs.length === 0) throw new Error('Хаяг олдсонгүй');
  if (addrs.some((a) => isPrivateIp(a.address))) throw new Error('Энэ хаягийг ашиглах боломжгүй');
  return url;
}
