'use client';

import { useState } from 'react';
import { Handshake, Store, Truck, CreditCard, Smartphone, CheckCircle } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';

const TYPES = [
  { icon: Store, title: 'Агуулахын хамтрал', desc: 'Pick-up цэг болох, агуулах үйлчилгээ' },
  { icon: Truck, title: 'Логистик хамтрал', desc: 'Хүргэлтийн компаниудтай хамтрах' },
  { icon: CreditCard, title: 'Төлбөрийн хамтрал', desc: 'Банк, финтеч компаниудтай' },
  { icon: Smartphone, title: 'Технологийн хамтрал', desc: 'API интеграци, white-label' },
];

export default function PartnerPage() {
  return (
    <div className="min-h-screen bg-[var(--esl-bg-page)]">
      <Navbar />
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 16px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><Handshake size={64} color="#E8242C" /></div>
          <h1 style={{ color: 'var(--esl-text)', fontSize: 32, fontWeight: 900 }}>Eseller.mn-тэй хамтрах</h1>
          <p style={{ color: 'var(--esl-text-muted)', marginTop: 8 }}>Хамтын ажиллагааны боломжийг судлаарай</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 40 }}>
          {TYPES.map((p, i) => (
            <div key={i} style={{ background: 'var(--esl-bg-card)', borderRadius: 16, padding: 20, border: '1px solid var(--esl-border)' }}>
              <div style={{ marginBottom: 10 }}><p.icon size={32} color="var(--esl-text)" /></div>
              <h3 style={{ color: 'var(--esl-text)', fontWeight: 700, marginBottom: 6 }}>{p.title}</h3>
              <p style={{ color: 'var(--esl-text-muted)', fontSize: 13 }}>{p.desc}</p>
            </div>
          ))}
        </div>

        <PartnerForm />
      </main>
      <Footer />
    </div>
  );
}

function PartnerForm() {
  const [form, setForm] = useState({ company: '', name: '', email: '', phone: '', type: 'LOGISTICS', message: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          type: 'SUGGESTION',
          subject: `Хамтрал: ${form.type}`,
          message: `Компани: ${form.company}\n${form.message}`,
        }),
      });
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div style={{ background: 'rgba(52,168,83,0.08)', borderRadius: 20, padding: 32, textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}><CheckCircle size={48} color="#34A853" /></div>
      <h3 style={{ color: 'var(--esl-text)', marginTop: 12 }}>Баярлалаа! 2-3 ажлын өдрийн дотор холбогдоно.</h3>
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
      <h2 style={{ color: 'var(--esl-text)', fontWeight: 800, marginBottom: 24 }}>Хамтралын хүсэлт</h2>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { key: 'company', label: 'Компанийн нэр', ph: 'ХХК нэр' },
          { key: 'name', label: 'Холбоо барих хүн', ph: 'Таны нэр' },
          { key: 'email', label: 'Имэйл', ph: 'email@company.mn' },
          { key: 'phone', label: 'Утас', ph: '99XXXXXX' },
        ].map(f => (
          <div key={f.key}>
            <label style={labelStyle}>{f.label}</label>
            <input
              value={form[f.key as keyof typeof form]}
              onChange={e => setForm({ ...form, [f.key]: e.target.value })}
              placeholder={f.ph}
              required
              style={inputStyle}
            />
          </div>
        ))}

        <div>
          <label style={labelStyle}>Хамтралын төрөл</label>
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>
            <option value="LOGISTICS">🚚 Логистик</option>
            <option value="WAREHOUSE">🏪 Агуулах / Pick-up</option>
            <option value="PAYMENT">💳 Төлбөрийн систем</option>
            <option value="TECH">📱 Технологи / API</option>
            <option value="OTHER">🤝 Бусад</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Мессеж</label>
          <textarea
            value={form.message}
            onChange={e => setForm({ ...form, message: e.target.value })}
            placeholder="Хамтрах саналаа бичнэ үү..."
            required
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <button type="submit" disabled={loading} style={{
          background: loading ? '#333' : '#E8242C', color: '#fff', border: 'none', borderRadius: 12,
          padding: 14, fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8,
        }}>
          {loading ? 'Илгээж байна...' : 'Хүсэлт илгээх →'}
        </button>
      </form>
    </div>
  );
}
