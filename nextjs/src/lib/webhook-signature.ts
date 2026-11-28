import crypto from 'crypto';

const TOLERANCE_SEC = 5 * 60;

/**
 * Resend (Svix) webhook-ийн гарын үсгийг шалгана.
 * Гарын үсэг = base64(HMAC-SHA256(base64decode(secret), `${svix-id}.${svix-timestamp}.${body}`)), толгой нь "v1,<sig> v1,<sig2>".
 */
export function verifySvixSignature(secret: string, headers: Headers, body: string, nowSec = Math.floor(Date.now() / 1000)): boolean {
  const id = headers.get('svix-id');
  const timestamp = headers.get('svix-timestamp');
  const signatureHeader = headers.get('svix-signature');
  if (!id || !timestamp || !signatureHeader) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSec - ts) > TOLERANCE_SEC) return false;

  const key = Buffer.from(secret.startsWith('whsec_') ? secret.slice(6) : secret, 'base64');
  const expected = crypto.createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest();

  return signatureHeader.split(' ').some((part) => {
    const [version, sig] = part.split(',');
    if (version !== 'v1' || !sig) return false;
    const given = Buffer.from(sig, 'base64');
    return given.length === expected.length && crypto.timingSafeEqual(given, expected);
  });
}
