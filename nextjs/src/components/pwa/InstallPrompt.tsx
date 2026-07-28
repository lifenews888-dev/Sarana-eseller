'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setPrompt(e); setShow(true); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!show) return null;

  return (
    <div style={{
      // Above MobileNav, left side so it does not cover chat FABs on the right
      position: 'fixed',
      bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px) + 0.75rem)',
      left: 16,
      right: 88,
      zIndex: 200,
      background: 'var(--esl-bg-card)', border: '1px solid var(--esl-border)',
      borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#E8242C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🛒</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--esl-text-primary)', margin: 0 }}>Eseller.mn апп</p>
        <p style={{ fontSize: 11, color: 'var(--esl-text-muted)', margin: '2px 0 0' }}>Нүүр дэлгэцэнд нэмэх</p>
      </div>
      <button onClick={() => { prompt?.prompt(); setShow(false); }}
        style={{ background: '#E8242C', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
        Суулгах
      </button>
      <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--esl-text-muted)', padding: 4 }}>
        <X size={18} />
      </button>
    </div>
  );
}
