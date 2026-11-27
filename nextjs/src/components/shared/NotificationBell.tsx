'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  url?: string;
  read: boolean;
  createdAt: string;
}

interface Props {
  role?: 'buyer' | 'seller' | 'admin';
}

export function NotificationBell({ role = 'buyer' }: Props) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch notifications when opened
  useEffect(() => {
    const deferred = window.setTimeout(() => {
      if (!open) return;
      setLoading(true);
      const token = localStorage.getItem('token');
      fetch(`/api/notifications?role=${role}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setNotifications(data); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(deferred);
  }, [open, role]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: 34, height: 34, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', background: 'none', color: '#777', cursor: 'pointer',
        position: 'relative',
      }}>
        <Bell size={18} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            width: 16, height: 16, borderRadius: '50%',
            background: '#E8242C', color: '#FFF',
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 8,
          width: 320, maxHeight: 400, overflowY: 'auto',
          background: 'var(--esl-bg-card)', border: '0.5px solid #2A2A2A',
          borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          zIndex: 100,
        }}>
          <div style={{
            padding: '12px 14px', borderBottom: '0.5px solid #2A2A2A',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Мэдэгдэл</span>
            {unreadCount > 0 && (
              <span style={{ fontSize: 10, color: '#E8242C', fontWeight: 500 }}>
                {unreadCount} шинэ
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#555', fontSize: 12 }}>Ачааллаж байна...</div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <Bell size={24} color="#333" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: 12, color: '#555' }}>Мэдэгдэл байхгүй</p>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id}
                onClick={() => { if (n.url) window.location.href = n.url; }}
                style={{
                  padding: '10px 14px', borderBottom: '0.5px solid #222',
                  cursor: n.url ? 'pointer' : 'default',
                  background: n.read ? 'transparent' : 'rgba(232,36,44,0.04)',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: n.read ? 400 : 600, color: '#FFF' }}>{n.title}</span>
                  {!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8242C', flexShrink: 0, marginTop: 4 }} />}
                </div>
                <p style={{ fontSize: 11, color: '#777', lineHeight: 1.4 }}>{n.message}</p>
                <span style={{ fontSize: 10, color: '#444', marginTop: 2, display: 'block' }}>
                  {new Date(n.createdAt).toLocaleDateString('mn-MN')}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
