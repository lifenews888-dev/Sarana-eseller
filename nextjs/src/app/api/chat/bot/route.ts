import { NextResponse } from 'next/server';

type ChatHistoryItem = {
  role: 'user' | 'assistant';
  content: string;
};

const SYSTEM_PROMPT = `Та eseller.mn Монголын нэгдсэн цахим худалдааны платформын дэмжлэгийн туслах юм.

Хэрэглэгч (худалдан авагч) болон дэлгүүрийн эзэнд тусалдаг:

ХУДАЛДАН АВАГЧ:
1. ЗАХИАЛГА: Захиалга хийх, хянах, цуцлах, буцаалт
2. ТӨЛБӨР: QPay QR, Дундын данс (Escrow)
3. ХҮРГЭЛТ: Хугацаа, tracking
4. GOLD: 19,900₮/сар — үнэгүй хүргэлт, 5% хямдрал

ДЭЛГҮҮРИЙН ЭЗЭН (борлуулагч):
5. ДЭЛГҮҮР НЭЭХ: /become-seller эсвэл Dashboard → Дэлгүүр нээх. Эхний 3 сар 0% комисс
6. БАРАА: Dashboard → Бүтээгдэхүүн → Шинэ бараа
7. ЗАХИАЛГА УДИРДАХ: Dashboard → Захиалга
8. ЧАТ: Dashboard → Чат (/dashboard/store/chat) — худалдан авагчтай шууд харилцах
9. ЧАТ ТОХИРГОО: Dashboard → Чат тохиргоо — өнгө, мэндчилгээ, AI хариу
10. ТӨЛБӨР АВАХ: QPay escrow — хүргэсний дараа мөнгө дэлгүүрт шилжинэ
11. AFFILIATE: Бараа share хийж 10-20% комисс

Хэрэв шийдвэрлэх боломжгүй бол "Энэ асуудлыг хүний агент руу шилжүүлье" гэж хэлж дуусга.
Монгол хэлээр товч, тодорхой хариулна. Emoji ашигла. Чухал холбоосыг тодорхой өг.`;

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
          model: 'claude-sonnet-4-6',
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

  if (lower.includes('захиалга') || lower.includes('хянах'))
    return '📦 Захиалгаа хянахын тулд Профайл → Захиалгын түүх хэсэгт очно уу. Мөн tracking код-оор eseller.mn/track хуудаснаас хянах боломжтой.';

  if (lower.includes('хүргэлт') || lower.includes('ирэх'))
    return '🚚 Хүргэлт ихэвчлэн 1-3 өдрийн дотор хийгдэнэ. УБ-д 24 цагийн дотор, хөдөөд 3-5 өдөр. Tracking код-оо ашиглан бодит цагийн мэдээлэл авна уу.';

  if (lower.includes('буцаалт') || lower.includes('буцаах'))
    return '🔄 Бараа хүлээж авснаас хойш 48 цагийн дотор буцаалт хийх боломжтой. Захиалгын хуудаснаас "Буцаалт хийх" товч дарна уу. Мөнгө дундын дансанд байгаа бол шууд буцаагдана.';

  if (lower.includes('төлбөр') || lower.includes('qpay'))
    return '💳 Одоогоор QPay QR төлбөр идэвхтэй. Төлбөр дундын дансанд хадгалагдаж, бараа хүлээж авсны дараа дэлгүүрт шилжинэ (Escrow систем).';

  if (lower.includes('gold') || lower.includes('гишүүн'))
    return '👑 Gold гишүүнчлэл — 19,900₮/сар. Давуу тал: Үнэгүй хүргэлт, 5% нэмэлт хямдрал, давхар оноо, VIP дэмжлэг, сарын бэлэг. eseller.mn/gold хуудаснаас бүртгүүлнэ үү.';

  if (lower.includes('дэлгүүр') || lower.includes('нээх') || lower.includes('become'))
    return '🏪 Дэлгүүр нээхэд: 1) Бүртгүүлэх/нэвтрэх 2) eseller.mn/become-seller 3) Мэдээлэл оруулах. Эхний 3 сар 0% комисс!\n\nНээсний дараа Dashboard → Чат-аас худалдан авагчтай шууд харилцана.';

  if (lower.includes('чат') || lower.includes('мессеж') || lower.includes('харилц'))
    return '💬 Дэлгүүрийн эзэн: Dashboard → Чат (/dashboard/store/chat) — захиалагчийн мессежүүд энд ирнэ.\n\nХудалдан авагч: Барааны хуудаснаас «Борлуулагчтай чатлах» → /dashboard/chat\n\nЧат тохиргоо: Dashboard → Чат тохиргоо';

  if (lower.includes('бараа нэм') || lower.includes('бүтээгдэхүүн'))
    return '📦 Бараа нэмэх: Dashboard → Бүтээгдэхүүн → Шинэ бараа. Зураг, үнэ, нөөц оруулна. CSV-ээр бөөнөөр нэмэх боломжтой.';

  if (lower.includes('борлуулагч') || lower.includes('affiliate') || lower.includes('комисс'))
    return '📢 Affiliate: Бараа share хийж 10-20% комисс. Барааны хуудаснаас «Борлуулж эхлэх».\n\nДэлгүүрийн комисс: Эхний 3 сар 0%, дараа нь төлөвлөгөөнөөс хамаарна.';

  return '😊 Баярлалаа! Тусламж хэрэгтэй бол:\n\n📦 Захиалга хянах\n💳 QPay төлбөр\n🔄 Буцаалт\n🏪 Дэлгүүр нээх\n💬 Дэлгүүрийн чат\n👑 Gold гишүүнчлэл';
}
