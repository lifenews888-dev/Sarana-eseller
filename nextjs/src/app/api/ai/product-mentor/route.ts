import { NextRequest } from 'next/server';
import { json, errorJson } from '@/lib/api-auth';
import { checkRateLimit } from '@/lib/rate-limit';

// POST /api/ai/product-mentor { product: {...}, message, history? }
// Борлуулагчид тухайн барааг хэрхэн санал болгох талаар зөвлөнө.
// Anthropic ажиллахгүй бол зөвхөн барааны бодит мэдээлэлд тулгуурласан энгийн зөвлөмж буцаана (ai: false).

type P = { name?: string; price?: number; salePrice?: number | null; category?: string; description?: string; commission?: number };
type H = { role: 'user' | 'assistant'; content: string };

const fmt = (n?: number | null) => (typeof n === 'number' ? `${Math.round(n).toLocaleString('en-US')}₮` : '—');

function productFacts(p: P) {
  return [
    `Нэр: ${p.name || '—'}`,
    `Үнэ: ${fmt(p.salePrice || p.price)}${p.salePrice && p.price && p.salePrice < p.price ? ` (хямдралаас өмнө ${fmt(p.price)})` : ''}`,
    p.category ? `Ангилал: ${p.category}` : null,
    typeof p.commission === 'number' ? `Борлуулагчийн шимтгэл: ${p.commission}%` : null,
    p.description ? `Тайлбар: ${String(p.description).slice(0, 1500)}` : null,
  ].filter(Boolean).join('\n');
}

function fallback(p: P, msg: string) {
  const q = msg.toLowerCase();
  const price = fmt(p.salePrice || p.price);
  if (/яаж|зар|борлуул|пост/.test(q)) {
    return `"${p.name}"-г санал болгох энгийн алхмууд:\n\n1. Барааны бодит зураг, үнэ (${price})-ийг тодорхой бичээрэй.\n2. Тайлбараас 2–3 гол онцлогийг товч сонгож бичээрэй.\n3. Өөрийн борлуулагчийн холбоосыг хавсаргаарай — захиалга тэр холбоосоор тоологдоно.\n4. Мэдэхгүй зүйлээ (хүргэлтийн хугацаа, баталгаа) дэлгүүрээс асууж байж амлаарай.`;
  }
  if (/асуулт|хариул|үнэтэй/.test(q)) {
    return `Хэрэглэгчийн асуултад хариулахдаа:\n\n• Үнэ, онцлогийг барааны хуудсанд байгаагаар нь хэлээрэй.\n• Хүргэлт, буцаалт, баталгааны нөхцөлийг дэлгүүрээс тодруулж байж хариулаарай.\n• Мэдэхгүй зүйлийг таамаглаж амлахгүй байх нь итгэл төрүүлнэ.`;
  }
  return `Барааны мэдээлэл:\n\n${productFacts(p)}\n\nAI зөвлөх одоогоор холбогдоогүй тул энэ мэдээлэлд тулгуурлан өөрөө тайлбар бичээрэй. "Яаж зарах вэ?" гэж асуувал ерөнхий алхмуудыг харуулна.`;
}

export async function POST(req: NextRequest) {
  if (checkRateLimit(req).limited) {
    return Response.json({ success: false, error: 'Хэт олон хүсэлт. Түр хүлээгээд дахин оролдоно уу.' }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const product = (body?.product || {}) as P;
  const message = String(body?.message || '').trim().slice(0, 1000);
  const history = (Array.isArray(body?.history) ? body.history : []).slice(-8) as H[];
  if (!message || !product.name) return errorJson('message, product шаардлагатай', 400);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
          max_tokens: 600,
          system:
            'Чи eseller.mn-ийн борлуулагчдад (affiliate) бараа санал болгоход тусалдаг зөвлөх. Монгол хэлээр товч, практик хариул. ' +
            'Зөвхөн доорх барааны мэдээлэлд тулгуурла. Үнэлгээ, борлуулалтын тоо, хүргэлтийн хугацаа, баталгаа, буцаалт, өрсөлдөгчийн үнэ зэрэг ' +
            'өгөгдөлд байхгүй зүйлийг бүү зохио — мэдэхгүй бол "дэлгүүрээс тодруулна уу" гэж хэл. Хуурамч сэтгэгдэл, худал амлалт санал болгохгүй.\n\n' +
            productFacts(product),
          messages: [
            ...history.filter((h) => h && (h.role === 'user' || h.role === 'assistant')).map((h) => ({ role: h.role, content: String(h.content).slice(0, 2000) })),
            { role: 'user', content: message },
          ],
        }),
      });
      const data = await res.json().catch(() => null);
      const text: string | undefined = data?.content?.[0]?.text;
      if (res.ok && text) return json({ reply: text, ai: true });
      console.error('[product-mentor] Anthropic error', res.status, data?.error?.type);
    } catch (e) {
      console.error('[product-mentor]', e);
    }
  }
  return json({ reply: fallback(product, message), ai: false });
}
