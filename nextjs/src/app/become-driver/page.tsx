'use client';

import { useState } from 'react';
import { Car, IdCard, Smartphone, CheckCircle, Lock } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';

const STATS = [
  { value: '3,000₮', label: 'Хүргэлт бүрт' },
  { value: '10+', label: 'Хүргэлт/өдөр' },
  { value: '900,000₮', label: 'Сарын боломжит орлого' },
];

const REQUIREMENTS = [
  { icon: IdCard, text: 'Монгол иргэний үнэмлэх' },
  { icon: Car, text: 'Тээврийн хэрэгсэл (машин, мото, дугуй)' },
  { icon: Smartphone, text: 'Ухаалаг утас' },
  { icon: CheckCircle, text: '18 нас хүрсэн' },
  { icon: Lock, text: 'Цагдаагийн тодорхойлолт' },
];

export default function BecomeDriverPage() {
  return (
    <div className="min-h-screen bg-[var(--esl-bg-page)]">
      <Navbar />
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 16px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><Car size={72} color="#C62828" /></div>
          <h1 style={{ color: 'var(--esl-text)', fontSize: 36, fontWeight: 900, marginBottom: 8 }}>
            Жолооч болж <span style={{ color: '#C62828' }}>орлого ол</span>
          </h1>
          <p style={{ color: 'var(--esl-text-muted)', fontSize: 16, maxWidth: 440, margin: '0 auto' }}>
            Чөлөөт цагтаа хүргэлт хийж нэмэлт орлого олоорой
          </p>
        </div>

        {/* Орлогын жишээ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 40 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ background: 'var(--esl-bg-card)', borderRadius: 16, padding: '16px 12px', textAlign: 'center', border: '1px solid var(--esl-border)' }}>
              <p style={{ color: '#C62828', fontWeight: 900, fontSize: 22 }}>{s.value}</p>
              <p style={{ color: 'var(--esl-text-muted)', fontSize: 12 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Шаардлага */}
        <div style={{ background: 'var(--esl-bg-card)', borderRadius: 20, padding: 28, marginBottom: 32, border: '1px solid var(--esl-border)' }}>
          <h2 style={{ color: 'var(--esl-text)', fontWeight: 800, marginBottom: 16 }}>Шаардлага</h2>
          {REQUIREMENTS.map((r, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: i < REQUIREMENTS.length - 1 ? '1px solid var(--esl-border)' : 'none', color: 'var(--esl-text)', fontSize: 15, display: 'flex', alignItems: 'center', gap: 10 }}>
              <r.icon size={18} style={{ flexShrink: 0 }} />
              <span>{r.text}</span>
            </div>
          ))}
        </div>

        <DriverSignupForm />
      </main>
      <Footer />
    </div>
  );
}

function DriverSignupForm() {
  const [form, setForm] = useState({ name: '', phone: '', vehicle: 'CAR', plateNumber: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/driver/apply', {
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
    <div style={{ background: 'rgba(52,168,83,0.08)', borderRadius: 20, padding: 32, textAlign: 'center', border: '1px solid rgba(52,168,83,0.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}><CheckCircle size={48} color="#34A853" /></div>
      <h3 style={{ color: 'var(--esl-text)', marginTop: 12 }}>Хүсэлт илгээгдлээ!</h3>
      <p style={{ color: 'var(--esl-text-muted)' }}>2-3 хоногийн дотор холбогдох болно</p>
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
      <h2 style={{ color: 'var(--esl-text)', fontWeight: 800, marginBottom: 24 }}>Жолооч болох хүсэлт</h2>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { key: 'name', label: 'Нэр', ph: 'Бүтэн нэр', type: 'text' },
          { key: 'phone', label: 'Утас', ph: '99XXXXXX', type: 'tel' },
          { key: 'email', label: 'Имэйл', ph: 'name@gmail.com', type: 'email' },
          { key: 'plateNumber', label: 'Улсын дугаар', ph: 'УБ1234АА', type: 'text' },
        ].map(f => (
          <div key={f.key}>
            <label style={labelStyle}>{f.label}</label>
            <input
              type={f.type}
              value={form[f.key as keyof typeof form]}
              onChange={e => setForm({ ...form, [f.key]: e.target.value })}
              placeholder={f.ph}
              required
              style={inputStyle}
            />
          </div>
        ))}

        <div>
          <label style={labelStyle}>Тээврийн хэрэгсэл</label>
          <select value={form.vehicle} onChange={e => setForm({ ...form, vehicle: e.target.value })} style={inputStyle}>
            <option value="CAR">🚗 Машин</option>
            <option value="MOTORCYCLE">🏍 Мото</option>
            <option value="BICYCLE">🚲 Дугуй</option>
          </select>
        </div>

        <button type="submit" disabled={loading} style={{
          background: loading ? '#333' : '#C62828', color: '#fff', border: 'none', borderRadius: 12,
          padding: 14, fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8,
        }}>
          {loading ? 'Илгээж байна...' : 'Хүсэлт илгээх →'}
        </button>
      </form>
    </div>
  );
}
