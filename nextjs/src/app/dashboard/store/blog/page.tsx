'use client';

import { useState } from 'react';
import { useToast } from '@/components/shared/Toast';
import { timeAgo } from '@/lib/utils';
import StatCard from '@/components/dashboard/StatCard';
import { FileText, CheckCircle, Eye, Pencil, Trash2 } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  published: boolean;
  createdAt: string;
  views: number;
}

const INITIAL_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'Зуны шинэ коллекц ирлээ!',
    content: 'Энэ зуны хамгийн шинэ загварлаг хувцаснуудыг манай дэлгүүрээс олоорой. Хөнгөн, тохилог, өдөр тутамд тохирсон сонголтууд таныг хүлээж байна.',
    imageUrl: '',
    published: true,
    createdAt: '2026-04-01T10:00:00Z',
    views: 156,
  },
  {
    id: '2',
    title: 'Арьс арчилгааны 5 алхам',
    content: 'Өдөр бүрийн арьс арчилгааны дэг журам: 1) Цэвэрлэх, 2) Тонер, 3) Серум, 4) Чийгшүүлэгч, 5) Нарнаас хамгаалах крем. Бүх бүтээгдэхүүнийг манай дэлгүүрээс аваарай.',
    imageUrl: '',
    published: true,
    createdAt: '2026-03-28T14:00:00Z',
    views: 89,
  },
  {
    id: '3',
    title: 'Хямдралын өдрүүд эхэллээ',
    content: 'Бүх бүтээгдэхүүнд 15% хөнгөлөлт! Промо код: SPRING15. 4-р сарын 15 хүртэл хүчинтэй.',
    imageUrl: '',
    published: false,
    createdAt: '2026-04-03T08:00:00Z',
    views: 0,
  },
];

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>(INITIAL_POSTS);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', imageUrl: '' });
  const toast = useToast();

  function openAdd() {
    setForm({ title: '', content: '', imageUrl: '' });
    setEditingId(null);
    setShowModal(true);
  }

  function openEdit(post: BlogPost) {
    setForm({ title: post.title, content: post.content, imageUrl: post.imageUrl });
    setEditingId(post.id);
    setShowModal(true);
  }

  function handleSave() {
    if (!form.title || !form.content) {
      toast.show('Гарчиг, агуулга заавал бөглөнө үү', 'warn');
      return;
    }
    if (editingId) {
      setPosts((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, title: form.title, content: form.content, imageUrl: form.imageUrl } : p))
      );
      toast.show('Нийтлэл шинэчлэгдлээ', 'ok');
    } else {
      const newPost: BlogPost = {
        id: Date.now().toString(),
        title: form.title,
        content: form.content,
        imageUrl: form.imageUrl,
        published: false,
        createdAt: new Date().toISOString(),
        views: 0,
      };
      setPosts((prev) => [newPost, ...prev]);
      toast.show('Нийтлэл нэмэгдлээ', 'ok');
    }
    setShowModal(false);
  }

  function togglePublish(id: string) {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, published: !p.published } : p)));
    toast.show('Нийтлэлийн төлөв шинэчлэгдлээ', 'ok');
  }

  function handleDelete(id: string) {
    if (!confirm('Устгахдаа итгэлтэй байна уу?')) return;
    setPosts((prev) => prev.filter((p) => p.id !== id));
    toast.show('Нийтлэл устгагдлаа', 'ok');
  }

  const totalViews = posts.reduce((s, p) => s + p.views, 0);
  const publishedCount = posts.filter((p) => p.published).length;

  return (
    <div className="min-h-screen bg-[var(--esl-bg-section)] p-6">
      <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--esl-text-primary)]">Блог</h1>
          <p className="text-[var(--esl-text-secondary)] mt-1">Нийтлэл бичих, засах, удирдах</p>
        </div>
        <button onClick={openAdd} className="px-5 py-2.5 bg-[#E8242C] text-white rounded-lg font-medium hover:bg-[#C41E25] transition-colors text-sm">
          + Шинэ нийтлэл
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<FileText className="w-6 h-6" />} label="Нийт нийтлэл" value={posts.length} gradient="indigo" />
        <StatCard icon={<CheckCircle className="w-6 h-6" />} label="Нийтлэгдсэн" value={publishedCount} gradient="green" />
        <StatCard icon={<Eye className="w-6 h-6" />} label="Нийт үзэлт" value={totalViews} gradient="pink" />
      </div>

      {posts.length === 0 ? (
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-12 text-center">
          <div className="mb-3"><FileText className="w-10 h-10 mx-auto text-[var(--esl-text-muted)]" /></div>
          <h3 className="text-lg font-semibold text-[var(--esl-text-primary)]">Нийтлэл байхгүй</h3>
          <p className="text-[var(--esl-text-muted)] mt-1">Эхний нийтлэлээ бичээрэй</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-[var(--esl-text-primary)] truncate">{post.title}</h3>
                    {post.published ? (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium flex-shrink-0">Нийтлэгдсэн</span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)] text-xs font-medium flex-shrink-0">Ноорог</span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--esl-text-secondary)] line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[var(--esl-text-muted)]">
                    <span>{timeAgo(post.createdAt)}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.views} үзэлт</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => togglePublish(post.id)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${post.published ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                    {post.published ? 'Нуух' : 'Нийтлэх'}
                  </button>
                  <button onClick={() => openEdit(post)} className="px-3 py-1.5 text-xs font-medium bg-[var(--esl-bg-section)] text-[var(--esl-text-primary)] rounded-lg hover:bg-[var(--esl-bg-card-hover)] transition-colors">
                    <Pencil className="w-3 h-3 inline" /> Засах
                  </button>
                  <button onClick={() => handleDelete(post.id)} className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[var(--esl-bg-card)] rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[var(--esl-border)] flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--esl-text-primary)]">{editingId ? 'Нийтлэл засах' : 'Шинэ нийтлэл'}</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--esl-text-muted)] hover:text-[var(--esl-text-secondary)] text-xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Гарчиг *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Агуулга *</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} className="w-full px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Зурагны URL</label>
                <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40" />
              </div>
              <button onClick={handleSave} className="w-full py-2.5 bg-[#E8242C] text-white rounded-lg font-medium hover:bg-[#C41E25] transition-colors">
                {editingId ? 'Шинэчлэх' : 'Нэмэх'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
