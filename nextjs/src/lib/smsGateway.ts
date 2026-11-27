/**
 * SMS илгээх ерөнхий адаптер.
 *
 * Vercel env:
 *   SMS_API_URL    — {to}, {text} орлуулагчтай URL загвар. Жишээ:
 *                    https://api.provider.mn/send?key=XXX&from=7XXXXXXX&to={to}&text={text}
 *   SMS_API_METHOD — GET (анхдагч) эсвэл POST
 *   SMS_API_BODY   — POST үед JSON загвар, жишээ: {"to":"{to}","text":"{text}"}
 *   SMS_API_AUTH   — (заавал биш) Authorization толгойн утга, жишээ: "Bearer xxx"
 * Эсвэл одоо байгаа Unitel/MobiCom адаптер (UNITEL_SMS_KEY / MOBICOM_SMS_KEY, lib/marketing/SMSService).
 * Аль нь ч тохируулаагүй бол SMS илгээгдэхгүй (isSmsConfigured() === false).
 */
import { sendSMS as sendViaOperator } from '@/lib/marketing/SMSService';

export function isSmsConfigured(): boolean {
  return Boolean(process.env.SMS_API_URL || process.env.UNITEL_SMS_KEY || process.env.MOBICOM_SMS_KEY);
}

export async function sendSms(to: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const tpl = process.env.SMS_API_URL;
  if (!tpl) {
    if (!isSmsConfigured()) return { ok: false, error: 'not_configured' };
    const r = await sendViaOperator(to, text);
    return r.success && r.provider !== 'demo' ? { ok: true } : { ok: false, error: r.error || 'send_failed' };
  }
  const method = (process.env.SMS_API_METHOD || 'GET').toUpperCase();
  const fill = (s: string, encode: boolean) =>
    s.replace(/\{to\}/g, encode ? encodeURIComponent(to) : to).replace(/\{text\}/g, encode ? encodeURIComponent(text) : text);

  const headers: Record<string, string> = {};
  if (process.env.SMS_API_AUTH) headers.Authorization = process.env.SMS_API_AUTH;
  let body: string | undefined;
  if (method === 'POST') {
    headers['Content-Type'] = 'application/json';
    const bodyTpl = process.env.SMS_API_BODY || '{"to":"{to}","text":"{text}"}';
    body = fill(bodyTpl, false).replace(/\n/g, '\\n');
  }

  try {
    const res = await fetch(fill(tpl, true), { method, headers, body, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'send_failed' };
  }
}
