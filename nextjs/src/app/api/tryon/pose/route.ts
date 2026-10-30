import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

// POST /api/tryon/pose — find body landmarks in a shopper's full-body photo.
// The photo is only sent to the model for this request and is never stored.

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
type MediaType = (typeof TYPES)[number];
const KEYS = ['l_ear', 'r_ear', 'l_shoulder', 'r_shoulder', 'l_hip', 'r_hip', 'l_ankle', 'r_ankle'] as const;

const PROMPT =
  'The image is a photo of a person for a virtual clothing try-on. Locate their body landmarks. ' +
  'Reply with ONLY a JSON object: {"found":true|false,"l_ear":[x,y],"r_ear":[x,y],"l_shoulder":[x,y],"r_shoulder":[x,y],"l_hip":[x,y],"r_hip":[x,y],"l_ankle":[x,y],"r_ankle":[x,y]}. ' +
  'Coordinates are fractions 0..1 of the image width and height, origin top-left. Every l_ point is the one that appears on the LEFT side of the image, every r_ point the one on the RIGHT. ' +
  'Shoulder points sit on the outer top edge of each shoulder; hip points on the hip joints; ankle points on the ankle bones. If a point is hidden or out of frame, estimate it from body proportions. ' +
  'If no person is visible, reply {"found":false}.';

function fail(error: string, status: number) {
  return NextResponse.json({ success: false, data: null, error }, { status });
}

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req);
  if (rl.limited) return fail('Хэт олон хүсэлт ирлээ. Түр хүлээгээд дахин оролдоно уу.', 429);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fail('Автомат тааруулалт одоогоор идэвхгүй байна', 503);

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get('image');
    file = f instanceof File ? f : null;
  } catch {
    return fail('Зураг илгээнэ үү', 400);
  }
  if (!file) return fail('Зураг илгээнэ үү', 400);
  if (!TYPES.includes(file.type as MediaType)) return fail('JPG, PNG эсвэл WebP зураг оруулна уу', 400);
  if (file.size > MAX_BYTES) return fail('Зураг 5MB-аас бага байх ёстой', 400);

  try {
    const data = Buffer.from(await file.arrayBuffer()).toString('base64');
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: file.type as MediaType, data } },
          { type: 'text', text: PROMPT },
        ],
      }],
    });
    const text = msg.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
    const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    if (!parsed.found) return NextResponse.json({ success: true, data: { found: false } });

    const out: Record<string, [number, number]> = {};
    for (const k of KEYS) {
      const v = parsed[k];
      if (Array.isArray(v) && v.length === 2 && v.every((n) => Number.isFinite(Number(n)))) {
        out[k] = [Math.max(-0.2, Math.min(1.2, Number(v[0]))), Math.max(-0.2, Math.min(1.2, Number(v[1])))];
      }
    }
    if (!out.l_shoulder || !out.r_shoulder) return NextResponse.json({ success: true, data: { found: false } });
    return NextResponse.json({ success: true, data: { found: true, ...out } });
  } catch (e) {
    console.error('[tryon/pose]', (e as Error).message);
    return fail('Биеийн байрлалыг тодорхойлж чадсангүй', 502);
  }
}
