import { NextResponse } from 'next/server';

type ChatHistoryItem = {
  role: 'user' | 'assistant';
  content: string;
};

const SYSTEM_PROMPT = `Та eseller.mn Монголын нэгдсэн цахим захын дэмжлэгийн туслах.
Монгол хэлээр товч, тодорхой хариулна. Emoji бага зэрэг ашиглаж болно. Холбоосыг замаар нь өг (жнь: /feed/post).

ЗӨВХӨН доорх бодит мэдээллээр хариул. Хүргэлтийн хугацаа, үнэгүй хүргэлт, буцаалтын хугацаа, хөнгөлөлт,
комиссын урамшуулал зэрэг энд байхгүй зүйлийг БҮҮ амла — "Энэ нь дэлгүүр/зарын эзнээс хамаарна, тэдэнтэй чатаар
тодруулна уу" гэж хэл.

ЗАРЫН БУЛАН (/feed):
- Зар нэмэх: /feed/post — үнэгүй, 30 хоног идэвхтэй. "Миний зарууд" (/dashboard/listings)-аас сунгана, засна, устгана.
- VIP зар: 5,000₮ / 7 хоног, QPay-ээр төлнө (зарын хуудас эсвэл "Миний зарууд" → 👑).
- Зарын эзэнтэй холбогдох: зарын хуудасны "Дугаар харах" эсвэл "Чатлах". Мессежүүд: /messages (цэсний 💬).
- Хадгалах: ♡ товч → /saved. Луйвар/буруу зар: "Гомдол" товч — админ шалгана.
- Машин, байр, утасны ангилалд "Дэлгэрэнгүй шүүлтүүр" (марк, он, гүйлт, өрөө, м² гэх мэт) бий.

ДЭЛГҮҮР:
- Бараа сагсанд хийж, QPay QR-ээр төлнө. Төлбөр QPay баталгаажмагц захиалга "баталгаажсан" болно.
- Захиалга хянах: /orders. Хүргэлт, буцаалтын нөхцөлийг тухайн дэлгүүр тогтооно — дэлгүүртэй тодруул.
- Дэлгүүр нээх: /become-seller.

БОРЛУУЛАГЧ (affiliate): /become-affiliate — барааны линкээ хуваалцаж, түүгээр зарагдсан захиалгаас комисс авна.

Шийдэж чадахгүй асуултад: "info@eseller.mn хаягаар холбогдоно уу" гэж хэл.`;

export async function POST(req: Request) {
  try {
    const { message = '', history = [] } = await req.json() as { message?: string; history?: ChatHistoryItem[] };

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (apiKey) {
      // Anthropic API ашиглах
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
          max_tokens: 500,
          system: SYSTEM_PROMPT,
          messages: [
            ...history.map((h) => ({ role: h.role, content: h.content })),
            { role: 'user', content: message },
          ],
        }),
      });

      const data = await res.json();
      const text = data.content?.[0]?.text || 'Алдаа гарлаа';
      const needsHuman = text.includes('хүний агент');

      return NextResponse.json({ reply: text, needsHuman });
    }

    // API key байхгүй бол rule-based fallback
    const reply = getFallbackReply(message);
    return NextResponse.json({ reply, needsHuman: false });
  } catch {
    return NextResponse.json({
      reply: 'Уучлаарай, түр алдаа гарлаа. Дахин оролдоно уу.',
      needsHuman: false,
    });
  }
}

function getFallbackReply(msg: string): string {
  const lower = msg.toLowerCase();

  if (lower.includes('зар') && (lower.includes('нэм') || lower.includes('оруул') || lower.includes('тавих')))
    return '📝 Зар нэмэх: /feed/post — үнэгүй. Зураг, үнэ, утсаа оруулаад нийтэлнэ. Зар 30 хоног идэвхтэй, "Миний зарууд"-аас сунгана.';

  if (lower.includes('vip') || lower.includes('вип') || lower.includes('онцлох'))
    return '👑 VIP зар: 5,000₮ / 7 хоног, QPay-ээр төлнө. Зар булангийн дээд хэсэгт харагдана. "Миний зарууд" → 👑 товч.';

  if (lower.includes('захиалга') || lower.includes('хянах'))
    return '📦 Захиалгаа /orders хуудаснаас хянана. Хүргэлтийн талаар тухайн дэлгүүрт чатаар хандана уу.';

  if (lower.includes('хүргэлт') || lower.includes('ирэх') || lower.includes('буцаалт') || lower.includes('буцаах'))
    return '🚚 Хүргэлт, буцаалтын нөхцөлийг дэлгүүр бүр өөрөө тогтоодог. Барааны хуудас эсвэл дэлгүүрийн чатаар тодруулна уу.';

  if (lower.includes('төлбөр') || lower.includes('qpay'))
    return '💳 Төлбөрийг QPay QR-ээр хийнэ. Банкны аппаараа QR уншуулахад QPay баталгаажмагц захиалга автоматаар "баталгаажсан" болно.';

  if (lower.includes('чат') || lower.includes('мессеж') || lower.includes('холбогд'))
    return '💬 Зарын эзэнтэй: зарын хуудасны "Чатлах" эсвэл "Дугаар харах". Таны бүх мессеж /messages (цэсний 💬 дүрс).';

  if (lower.includes('хадгал') || lower.includes('таалагд'))
    return '♡ Зарын хуудасны "Хадгалах" товчоор хадгалаад /saved хуудаснаас харна.';

  if (lower.includes('дэлгүүр') || lower.includes('нээх') || lower.includes('become'))
    return '🏪 Дэлгүүр нээх: нэвтэрсний дараа /become-seller хуудаснаас мэдээллээ оруулна. Дараа нь Dashboard-аас бараа нэмнэ.';

  if (lower.includes('борлуулагч') || lower.includes('affiliate') || lower.includes('комисс'))
    return '📢 Борлуулагч болох: /become-affiliate. Барааны линкээ хуваалцаж, түүгээр зарагдсан захиалгаас комисс авна.';

  if (lower.includes('гомдол') || lower.includes('луйвар'))
    return '🚩 Сэжигтэй зар байвал зарын хуудасны "Гомдол" товч дарна уу — админ шалгаж шийдвэрлэнэ.';

  return '😊 Би дараах зүйлст тусална:\n\n📝 Зар нэмэх\n👑 VIP зар\n💬 Зарын эзэнтэй чатлах\n💳 QPay төлбөр\n📦 Захиалга хянах\n🏪 Дэлгүүр нээх\n\nӨөр асуулт: info@eseller.mn';
}
