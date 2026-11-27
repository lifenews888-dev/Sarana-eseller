'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared/Toast';
import { canAddBranch, getCurrentPlan } from '@/lib/subscription';
import { Store, MapPin, Phone, User, Clock } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  workingHours: string;
  active: boolean;
}

const STORAGE_KEY = 'eseller_branches';

function loadBranches(): Branch[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBranches(branches: Branch[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(branches));
}

export default function BranchesPage() {
  const toast = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [manager, setManager] = useState('');
  const [workingHours, setWorkingHours] = useState('09:00-18:00');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const deferred = window.setTimeout(() => {
      setMounted(true);
      setBranches(loadBranches());
    }, 0);
    return () => window.clearTimeout(deferred);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--esl-bg-section)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#E8242C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const plan = getCurrentPlan();

  function openAddModal() {
    const check = canAddBranch();
    if (!check.allowed) {
      toast.show(check.message || 'Хязгаарт хүрлээ', 'error');
      return;
    }
    setEditingId(null);
    setName('');
    setAddress('');
    setPhone('');
    setManager('');
    setWorkingHours('09:00-18:00');
    setShowModal(true);
  }

  function openEditModal(branch: Branch) {
    setEditingId(branch.id);
    setName(branch.name);
    setAddress(branch.address);
    setPhone(branch.phone);
    setManager(branch.manager);
    setWorkingHours(branch.workingHours);
    setShowModal(true);
  }

  function handleSave() {
    if (!name.trim()) {
      toast.show('Салбарын нэр оруулна уу', 'warn');
      return;
    }
    if (!address.trim()) {
      toast.show('Хаяг оруулна уу', 'warn');
      return;
    }

    let updated: Branch[];
    if (editingId) {
      updated = branches.map((b) =>
        b.id === editingId ? { ...b, name, address, phone, manager, workingHours } : b
      );
      toast.show('Салбар шинэчлэгдлээ', 'ok');
    } else {
      const newBranch: Branch = {
        id: Date.now().toString(),
        name,
        address,
        phone,
        manager,
        workingHours,
        active: true,
      };
      updated = [...branches, newBranch];
      toast.show('Салбар нэмэгдлээ', 'ok');
    }

    setBranches(updated);
    saveBranches(updated);
    setShowModal(false);
  }

  function handleDelete(id: string) {
    const updated = branches.filter((b) => b.id !== id);
    setBranches(updated);
    saveBranches(updated);
    toast.show('Салбар устгагдлаа', 'ok');
  }

  function toggleActive(id: string) {
    const updated = branches.map((b) =>
      b.id === id ? { ...b, active: !b.active } : b
    );
    setBranches(updated);
    saveBranches(updated);
    const branch = updated.find((b) => b.id === id);
    toast.show(branch?.active ? 'Салбар идэвхжлээ' : 'Салбар идэвхгүй болсон', 'ok');
  }

  return (
    <div className="min-h-screen bg-[var(--esl-bg-section)] p-4 md:p-6">
      {/* Header */}
      <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Store className="w-7 h-7 text-[#E8242C]" />
            <div>
              <h1 className="text-2xl font-bold text-[var(--esl-text-primary)]">Салбар удирдлага</h1>
              <p className="text-[var(--esl-text-secondary)] text-sm">Дэлгүүрийн салбаруудыг удирдах ({branches.length}/{plan.limits.maxBranches === -1 ? '∞' : plan.limits.maxBranches})</p>
            </div>
          </div>
          <button
            onClick={openAddModal}
            className="bg-[#E8242C] text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#C41E25] transition flex items-center gap-2"
          >
            + Салбар нэмэх
          </button>
        </div>
      </div>

      {/* Branch List */}
      {branches.length === 0 ? (
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-12 text-center">
          <span className="text-5xl block mb-4">🏪</span>
          <h2 className="text-lg font-bold text-[var(--esl-text-primary)] mb-2">Салбар байхгүй</h2>
          <p className="text-[var(--esl-text-secondary)] text-sm mb-4">Эхний салбараа нэмнэ үү</p>
          <button
            onClick={openAddModal}
            className="bg-[#E8242C] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#C41E25] transition"
          >
            + Салбар нэмэх
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className={`bg-[var(--esl-bg-card)] rounded-xl border overflow-hidden transition ${
                branch.active ? 'border-[var(--esl-border)]' : 'border-[var(--esl-border)] opacity-60'
              }`}
            >
              <div className="flex flex-col lg:flex-row">
                {/* Map placeholder */}
                <div className="lg:w-64 h-40 lg:h-auto bg-[var(--esl-bg-section)] flex items-center justify-center flex-shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--esl-border)]">
                  <div className="text-center">
                    <span className="text-3xl block mb-1">📍</span>
                    <span className="text-xs text-[var(--esl-text-muted)]">Газрын зураг</span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-[var(--esl-text-primary)] text-lg">{branch.name}</h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            branch.active
                              ? 'bg-green-50 text-green-600'
                              : 'bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)]'
                          }`}
                        >
                          {branch.active ? 'Идэвхтэй' : 'Идэвхгүй'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleActive(branch.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          branch.active
                            ? 'bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)] hover:bg-[var(--esl-bg-card-hover)]'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {branch.active ? 'Идэвхгүй болгох' : 'Идэвхжүүлэх'}
                      </button>
                      <button
                        onClick={() => openEditModal(branch)}
                        className="text-[#E8242C] hover:bg-[var(--esl-brand-bg)] px-3 py-1.5 rounded-lg text-xs font-medium transition"
                      >
                        Засах
                      </button>
                      <button
                        onClick={() => handleDelete(branch.id)}
                        className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                      >
                        Устгах
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div className="flex items-center gap-2 text-sm text-[var(--esl-text-secondary)]">
                      <span className="text-[var(--esl-text-muted)]">📍</span>
                      <span>{branch.address || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--esl-text-secondary)]">
                      <span className="text-[var(--esl-text-muted)]">📞</span>
                      <span>{branch.phone || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--esl-text-secondary)]">
                      <span className="text-[var(--esl-text-muted)]">👤</span>
                      <span>{branch.manager || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--esl-text-secondary)]">
                      <span className="text-[var(--esl-text-muted)]">🕐</span>
                      <span>{branch.workingHours || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--esl-bg-card)] rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-[var(--esl-border)]">
              <h2 className="text-lg font-bold text-[var(--esl-text-primary)]">
                {editingId ? 'Салбар засах' : 'Шинэ салбар'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Нэр</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Салбарын нэр"
                  className="w-full border border-[var(--esl-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--esl-text-primary)] focus:ring-2 focus:ring-[#E8242C]/40 focus:border-[#E8242C] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Хаяг</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Дүүрэг, хороо, гудамж"
                  className="w-full border border-[var(--esl-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--esl-text-primary)] focus:ring-2 focus:ring-[#E8242C]/40 focus:border-[#E8242C] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Утас</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9911-2233"
                  className="w-full border border-[var(--esl-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--esl-text-primary)] focus:ring-2 focus:ring-[#E8242C]/40 focus:border-[#E8242C] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Менежер</label>
                <input
                  type="text"
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                  placeholder="Менежерийн нэр"
                  className="w-full border border-[var(--esl-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--esl-text-primary)] focus:ring-2 focus:ring-[#E8242C]/40 focus:border-[#E8242C] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Ажиллах цаг</label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  placeholder="09:00-18:00"
                  className="w-full border border-[var(--esl-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--esl-text-primary)] focus:ring-2 focus:ring-[#E8242C]/40 focus:border-[#E8242C] outline-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-[var(--esl-border)] flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-[var(--esl-border)] text-[var(--esl-text-primary)] py-2.5 rounded-xl font-semibold text-sm hover:bg-[var(--esl-bg-section)] transition"
              >
                Болих
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-[#E8242C] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[#C41E25] transition"
              >
                {editingId ? 'Хадгалах' : 'Нэмэх'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
