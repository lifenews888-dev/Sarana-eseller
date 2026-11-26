import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import SafeImage from '@/components/ui/SafeImage';
import { getJwtSecret } from '@/lib/api-auth';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import MobileNav from '@/components/shared/MobileNav';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Хүлээгдэж байна', color: '#854F0B', bg: '#FAEEDA' },
  confirmed: { label: 'Баталгаажсан', color: '#185FA5', bg: '#E6F1FB' },
  preparing: { label: 'Бэлтгэж байна', color: '#534AB7', bg: '#EEEDFE' },
  ready: { label: 'Бэлэн', color: '#0F6E56', bg: '#E1F5EE' },
  handed_to_driver: { label: 'Жолоочид өгсөн', color: '#854F0B', bg: '#FAEEDA' },
  delivering: { label: 'Хүргэж байна', color: '#185FA5', bg: '#E6F1FB' },
  delivered: { label: 'Хүргэгдсэн', color: '#3B6D11', bg: '#EAF3DE' },
  cancelled: { label: 'Цуцлагдсан', color: '#A32D2D', bg: '#FCEBEB' },
};

async function getUserId(): Promise<string | null> {
  const c = await cookies();
  const token = c.get('token')?.value || c.get('auth-token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { id?: string; userId?: string };
    return decoded.id || decoded.userId || null;
  } catch {
    return null;
  }
}

export default async function OrdersPage() {
  const userId = await getUserId();
  if (!userId) redirect('/login');

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <>
    <Navbar />
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '88px 16px 48px', minHeight: '70vh' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--esl-text-primary)', marginBottom: 20 }}>
        Миний захиалгууд
      </h1>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p style={{ color: 'var(--esl-text-muted)' }}>Захиалга байхгүй байна</p>
          <Link
            href="/store"
            style={{
              display: 'inline-block', marginTop: 16,
              backgroundColor: '#E8242C', color: '#fff',
              padding: '10px 24px', borderRadius: 10,
              textDecoration: 'none', fontSize: 14,
            }}
          >
            Дэлгүүр харах
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.map((order) => {
            const st = STATUS_CONFIG[order.status] || { label: order.status, color: '#888', bg: '#f0f0f0' };
            const items = Array.isArray(order.items) ? (order.items as any[]) : [];
            const first = items[0] || {};
            return (
              <Link key={order.id} href={`/orders/${order.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  backgroundColor: 'var(--esl-bg-card)', borderRadius: 12, padding: '14px 16px',
                  border: '1px solid var(--esl-border)',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  {first.image ? (
                    <SafeImage
                      src={first.image}
                      alt={first.name || ''}
                      style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: 56, height: 56, borderRadius: 8, background: '#f0f0f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                    }}>📦</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--esl-text-primary)' }}>
                        #{order.id.slice(-6).toUpperCase()}
                      </span>
                      <span
                        style={{
                          fontSize: 10, fontWeight: 500,
                          color: st.color, backgroundColor: st.bg,
                          padding: '2px 8px', borderRadius: 99,
                        }}
                      >
                        {st.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--esl-text-secondary)', margin: 0 }}>
                      {first.name || 'Бараа'}
                      {items.length > 1 ? ` +${items.length - 1}` : ''}
                    </p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--esl-text-primary)', margin: '3px 0 0' }}>
                      {(order.total || 0).toLocaleString()}₮
                    </p>
                  </div>
                  <span style={{ color: 'var(--esl-text-muted)' }}>›</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
    <Footer />
    <MobileNav />
    </>
  );
}
