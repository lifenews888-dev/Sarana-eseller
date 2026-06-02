import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';

export const metadata = { title: 'Нууцлалын бодлого — Eseller.mn' };

const sections = [
  {
    title: '1. Цуглуулдаг мэдээлэл',
    content: `Бид дараах мэдээллийг цуглуулна:
- Бүртгэлийн мэдээлэл: Нэр, имэйл, утасны дугаар
- Гүйлгээний мэдээлэл: Захиалга, төлбөр, хүргэлтийн хаяг
- Ашиглалтын мэдээлэл: Үзсэн хуудас, хайлт, дарсан товч
- Байршлын мэдээлэл: Хүргэлтийн зорилгоор (зөвшөөрөлтэйгөөр)`,
  },
  {
    title: '2. Мэдээллийг хэрхэн ашигладаг вэ',
    content: `Цуглуулсан мэдээллийг дараах зорилгоор ашиглана:
- Захиалга боловсруулах, хүргэлт зохион байгуулах
- Хэрэглэгчийн туслалцаа үзүүлэх
- Платформын аюулгүй байдлыг хангах
- Хямдрал, мэдэгдэл илгээх (зөвшөөрөлтэйгөөр)
- Платформыг сайжруулах`,
  },
  {
    title: '3. Мэдээллийн хамгаалалт',
    content: `Таны мэдээллийг хамгаалахын тулд:
- SSL/TLS шифрлэлт ашигладаг
- Нууц үгийг bcrypt-ээр хадгалдаг
- Гуравдагч этгээдэд дамжуулахгүй
- Зөвхөн зайлшгүй шаардлагатай ажилтнууд л хандах эрхтэй`,
  },
  {
    title: '4. Гуравдагч этгээдийн үйлчилгээ',
    content: `Бид дараах гуравдагч үйлчилгээ ашигладаг:
- QPay — төлбөрийн систем
- Cloudinary — зураг хадгалах
- Vercel — вэб хостинг
- Google Analytics — статистик`,
  },
  {
    title: '5. Хэрэглэгчийн эрх',
    content: `Та дараах эрхтэй:
- Өөрийн мэдээллийг харах, засах
- Мэдээллийг устгахыг хүсэх
- Мэдэгдэл хүлээн авахаас татгалзах
- Дансаа хаах
Эрхээ эдлэхийн тулд: privacy@eseller.mn`,
  },
  {
    title: '6. Cookies',
    content: `Бид cookies ашигладаг:
- Шаардлагатай cookies: Нэвтрэлт, сагс
- Аналитик cookies: Хэрэглэлтийн статистик (GA4)
- Маркетингийн cookies: Facebook Pixel
Тохиргоог хөтчийн тохиргооноос өөрчилж болно.`,
  },
  {
    title: '7. Холбоо барих',
    content: `Нууцлалтай холбоотой асуудлаар:
📧 privacy@eseller.mn
📧 info@eseller.mn
🏠 Улаанбаатар хот, Чингэлтэй дүүрэг`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--esl-bg-page)]">
      <Navbar />
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 16px 80px' }}>
        <h1 style={{ color: 'var(--esl-text)', fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
          Нууцлалын бодлого
        </h1>
        <p style={{ color: 'var(--esl-text-muted)', marginBottom: 40, fontSize: 14 }}>
          Сүүлд шинэчилсэн: 2026 оны 4-р сарын 11
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {sections.map((s, i) => (
            <div key={i} style={{ background: 'var(--esl-bg-card)', borderRadius: 16, padding: '20px 24px', border: '1px solid var(--esl-border)' }}>
              <h2 style={{ color: 'var(--esl-text)', fontSize: 17, fontWeight: 700, marginBottom: 12 }}>{s.title}</h2>
              <div style={{ color: 'var(--esl-text-muted)', fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{s.content}</div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
