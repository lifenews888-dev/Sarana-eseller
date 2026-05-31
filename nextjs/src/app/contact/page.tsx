'use client';

import { useState } from 'react';
import { Mail, MessageCircle, MapPin, CheckCircle } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';

const CONTACTS = [
  { icon: Mail, title: 'Имэйл', value: 'info@eseller.mn', sub: '24 цагийн дотор хариулна', href: 'mailto:info@eseller.mn' },
  { icon: MessageCircle, title: 'Facebook', value: '@eseller.mn', sub: 'Мессеж илгээх', href: 'https://facebook.com/eseller.mn' },
  { icon: MapPin, title: 'Хаяг', value: 'Улаанбаатар хот', sub: 'Чингэлтэй дүүрэг', href: 'https://maps.google.com' },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[var(--esl-bg-page)]">
      <Navbar />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 16px 80px' }}>
        <h1 style={{ color: 'var(--esl-text)', fontSize: 32, fontWeight: 900, marginBottom: 8, letterSpacing: -1 }}>
          Холбоо барих
        </h1>
        <p style={{ color: 'var(--esl-text-muted)', marginBottom: 40 }}>
          Асуулт, санал, гомдол байвал бидэнтэй холбоо барина уу
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 40 }}>
          {CONTACTS.map((c, i) => (
            <a
              key={i}
              href={c.href}
              target={c.href.startsWith('http') ? '_blank' : undefined}
              rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              style={{
                background: 'var(--esl-bg-card)', borderRadius: 16, padding: 20,
                border: '1px solid var(--esl-border)', textDecoration: 'none', display: 'block',
              }}
            >
              <div style={{ marginBottom: 10 }}><c.icon size={32} color="var(--esl-text)" /></div>
              <p style={{ color: 'var(--esl-text-muted)', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{c.title}</p>
              <p style={{ color: 'var(--esl-text)', fontWeight: 700, marginBottom: 4 }}>{c.value}</p>
              <p style={{ color: 'var(--esl-text-muted)', fontSize: 12 }}>{c.sub}</p>
            </a>
          ))}
        </div>

        <ContactForm />
      </main>
      <Footer />
    </div>
  );
}

function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', type: 'QUESTION', message: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div style={{ background: 'rgba(52,168,83,0.08)', borderRadius: 16, padding: 32, textAlign: 'center', border: '1px solid rgba(52,168,83,0.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}><CheckCircle size={48} color="#34a853" /></div>
      <h3 style={{ color: 'var(--esl-text)', marginTop: 12 }}>Санал хүсэлт илгээгдлээ!</h3>
      <p style={{ color: 'var(--esl-text-muted)' }}>24 цагийн дотор хариулна</p>
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--esl-bg-section)', border: '1px solid var(--esl-border)',
    borderRadius: 10, padding: '10px 14px', color: 'var(--esl-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    color: 'var(--esl-text-muted)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6,
  };

  return (
    <div style={{ background: 'var(--esl-bg-card)', borderRadius: 20, padding: 28, border: '1px solid var(--esl-border)' }}>
      <h2 style={{ color: 'var(--esl-text)', fontWeight: 800, marginBottom: 24 }}>Санал хүсэлт илгээх</h2>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Нэр</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Таны нэр" required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Имэйл</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="name@gmail.com" required style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Төрөл</label>
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>
            <option value="QUESTION">❓ Асуулт</option>
            <option value="BUG">🐛 Алдаа мэдээлэх</option>
            <option value="SUGGESTION">💡 Санал</option>
            <option value="COMPLAINT">😤 Гомдол</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Мессеж</label>
          <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Дэлгэрэнгүй бичнэ үү..." required rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        <button type="submit" disabled={loading} style={{
          background: loading ? '#333' : '#E8242C', color: '#fff', border: 'none', borderRadius: 12,
          padding: 14, fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Илгээж байна...' : 'Илгээх →'}
        </button>
      </form>
    </div>
  );
}
