import { NextRequest, NextResponse } from 'next/server';

const FALLBACKS: Record<string, string> = {
  sms: 'eseller.mn дээр өнөөдрийн онцгой санал эхэллээ. Шинэ бараа, хямдралтай бүтээгдэхүүнээ одоо үзээрэй.',
  email: 'Сайн байна уу. eseller.mn дээр таны сонирхолд тохирох шинэ санал, хямдрал нэмэгдлээ. Захиалга, хүргэлт, төлбөр бүгд нэг дор.',
  push: 'Онцгой санал нэмэгдлээ. eseller.mn дээр яг одоо үзээрэй.',
};

function fallbackText(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes('sms')) return FALLBACKS.sms;
  if (lower.includes('push')) return FALLBACKS.push;
  return FALLBACKS.email;
}

export async function POST(req: NextRequest) {
  try {
    const { message = '', history = [] } = await req.json() as {
      message?: string;
      history?: Array<{ role: string; content: string }>;
    };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      const reply = fallbackText(message);
      return NextResponse.json({ reply, message: reply, content: reply, fallback: true });
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 700,
        system: 'Чи eseller.mn админ маркетингийн туслах. Монгол хэлээр богино, тодорхой, худалдаанд ашиглахад бэлэн текст бич.',
        messages: [
          ...history.map((item) => ({ role: item.role === 'assistant' ? 'assistant' : 'user', content: item.content })),
          { role: 'user', content: message },
        ],
      }),
    });

    if (!res.ok) {
      const reply = fallbackText(message);
      return NextResponse.json({ reply, message: reply, content: reply, fallback: true });
    }

    const data = await res.json();
    const reply = data?.content?.[0]?.text || fallbackText(message);
    return NextResponse.json({ reply, message: reply, content: reply });
  } catch (error) {
    console.error('[chat/ai]', error);
    const reply = FALLBACKS.email;
    return NextResponse.json({ reply, message: reply, content: reply, fallback: true });
  }
}
