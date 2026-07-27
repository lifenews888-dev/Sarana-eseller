'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, ChevronLeft, ChevronRight, Plus, Pencil, Trash2,
  ToggleLeft, ToggleRight, TrendingUp, Eye, Clock, DollarSign,
  BarChart3, Image as ImageIcon, ChevronDown,
} from 'lucide-react';
import { REALISTIC_BANNER_IMAGES } from '@/lib/realistic-banner-assets';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

interface BannerStats {
  activeBanners: number;
  expiringToday: number;
  pending: number;
  revenueThisMonth: number;
  totalImpressions: number;
}

interface SlotInfo {
  slot: string;
  label: string;
  maxConcurrent: number;
  currentCount: number;
  priceRange: string;
}

type BannerStatus = 'active' | 'scheduled' | 'pending' | 'expired' | 'draft' | 'paused' | 'rejected';

interface Banner {
  id: string;
  title: string;
  refId: string;
  thumbnailUrl: string;
  slot: string;
  entityName: string;
  startDate: string;
  endDate: string;
  status: BannerStatus;
  ctr: number;
}

interface BannersResponse {
  banners: Banner[];
  total: number;
  page: number;
  pageSize: number;
}

/* ═══════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════ */

const SLOT_LABELS: Record<string, string> = {
  HERO: 'Hero баннер',
  ANNOUNCEMENT: 'Мэдэгдэл',
  MID_PAGE: 'Хуудас дунд',
  IN_FEED: 'Фийд дотор',
  SIDEBAR_RIGHT: 'Хажуу баруун',
  SECTION_SEPARATOR: 'Хэсэг салгагч',
  CATEGORY_TOP: 'Ангилал дээд',
  PRODUCT_BELOW: 'Бүтээгдэхүүн доод',
};

const STATUS_LABELS: Record<string, string> = {
  all: 'Бүгд',
  active: 'Идэвхтэй',
  scheduled: 'Төлөвлөсөн',
  pending: 'Хүлээгдэж буй',
  expired: 'Дууссан',
  draft: 'Ноорог',
  paused: 'Түр зогссон',
  rejected: 'Татгалзсан',
};

const STATUS_COLORS: Record<BannerStatus, { bg: string; text: string }> = {
  active: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  scheduled: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  pending: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  expired: { bg: 'bg-white/10', text: 'text-white/40' },
  draft: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  paused: { bg: 'bg-white/10', text: 'text-white/50' },
  rejected: { bg: 'bg-red-500/20', text: 'text-red-400' },
};

/* ═══════════════════════════════════════════════════════════
   Demo data (used as fallback when API unavailable)
   ═══════════════════════════════════════════════════════════ */

const DEMO_STATS: BannerStats = {
  activeBanners: 24,
  expiringToday: 3,
  pending: 7,
  revenueThisMonth: 4_850_000,
  totalImpressions: 1_320_000,
};

const DEMO_SLOTS: SlotInfo[] = [
  { slot: 'HERO', label: 'Hero баннер', maxConcurrent: 5, currentCount: 4, priceRange: '500,000₮ – 1,200,000₮' },
  { slot: 'ANNOUNCEMENT', label: 'Мэдэгдэл', maxConcurrent: 3, currentCount: 2, priceRange: '100,000₮ – 300,000₮' },
  { slot: 'MID_PAGE', label: 'Хуудас дунд', maxConcurrent: 4, currentCount: 3, priceRange: '300,000₮ – 800,000₮' },
  { slot: 'IN_FEED', label: 'Фийд дотор', maxConcurrent: 6, currentCount: 5, priceRange: '200,000₮ – 500,000₮' },
  { slot: 'SIDEBAR_RIGHT', label: 'Хажуу баруун', maxConcurrent: 4, currentCount: 1, priceRange: '150,000₮ – 400,000₮' },
  { slot: 'SECTION_SEPARATOR', label: 'Хэсэг салгагч', maxConcurrent: 3, currentCount: 3, priceRange: '250,000₮ – 600,000₮' },
  { slot: 'CATEGORY_TOP', label: 'Ангилал дээд', maxConcurrent: 4, currentCount: 2, priceRange: '200,000₮ – 450,000₮' },
  { slot: 'PRODUCT_BELOW', label: 'Бүтээгдэхүүн доод', maxConcurrent: 6, currentCount: 4, priceRange: '100,000₮ – 350,000₮' },
];

const DEMO_BANNERS: Banner[] = [
  { id: '1', title: 'Зуны хямдрал 50%', refId: 'BNR-001', thumbnailUrl: REALISTIC_BANNER_IMAGES.summerSale, slot: 'HERO', entityName: 'FashionMN', startDate: '2026-03-15', endDate: '2026-04-15', status: 'active', ctr: 4.2 },
  { id: '2', title: 'Шинэ брэнд нээлт', refId: 'BNR-002', thumbnailUrl: REALISTIC_BANNER_IMAGES.gold, slot: 'MID_PAGE', entityName: 'AutoCity Mongolia', startDate: '2026-04-01', endDate: '2026-04-30', status: 'active', ctr: 3.1 },
  { id: '3', title: 'Гар утасны хямдрал', refId: 'BNR-003', thumbnailUrl: REALISTIC_BANNER_IMAGES.summerSale, slot: 'IN_FEED', entityName: 'DigitalMN Studio', startDate: '2026-04-10', endDate: '2026-05-10', status: 'scheduled', ctr: 0 },
  { id: '4', title: 'Хүргэлт үнэгүй', refId: 'BNR-004', thumbnailUrl: REALISTIC_BANNER_IMAGES.delivery, slot: 'ANNOUNCEMENT', entityName: 'Sarana Salon', startDate: '2026-03-01', endDate: '2026-03-31', status: 'expired', ctr: 2.8 },
  { id: '5', title: 'VIP гишүүнчлэл', refId: 'BNR-005', thumbnailUrl: REALISTIC_BANNER_IMAGES.sellers, slot: 'SIDEBAR_RIGHT', entityName: 'Premium Auto', startDate: '2026-04-05', endDate: '2026-05-05', status: 'pending', ctr: 0 },
  { id: '6', title: 'Цахилгаан тоног төхөөрөмж', refId: 'BNR-006', thumbnailUrl: REALISTIC_BANNER_IMAGES.storefronts, slot: 'CATEGORY_TOP', entityName: 'ElectroniX', startDate: '2026-04-02', endDate: '2026-04-20', status: 'active', ctr: 5.7 },
  { id: '7', title: 'Хүүхдийн хувцас', refId: 'BNR-007', thumbnailUrl: REALISTIC_BANNER_IMAGES.gold, slot: 'PRODUCT_BELOW', entityName: 'KidsMN', startDate: '2026-03-20', endDate: '2026-04-04', status: 'expired', ctr: 1.9 },
  { id: '8', title: 'Тавилга хямдрал', refId: 'BNR-008', thumbnailUrl: REALISTIC_BANNER_IMAGES.delivery, slot: 'SECTION_SEPARATOR', entityName: 'HomePlus', startDate: '2026-04-08', endDate: '2026-05-08', status: 'draft', ctr: 0 },
  { id: '9', title: 'Гоо сайхан 30%', refId: 'BNR-009', thumbnailUrl: REALISTIC_BANNER_IMAGES.summerSale, slot: 'HERO', entityName: 'BeautyBox', startDate: '2026-04-01', endDate: '2026-04-30', status: 'active', ctr: 6.3 },
  { id: '10', title: 'Спорт хэрэгсэл', refId: 'BNR-010', thumbnailUrl: REALISTIC_BANNER_IMAGES.summerSale, slot: 'IN_FEED', entityName: 'SportZone', startDate: '2026-04-12', endDate: '2026-05-12', status: 'pending', ctr: 0 },
];

/* ═══════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════ */

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString();
}

function formatCurrency(n: number): string {
  return n.toLocaleString() + '₮';
}

function occupancyColor(ratio: number): string {
  if (ratio >= 0.9) return 'bg-red-500';
  if (ratio >= 0.6) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function occupancyBg(ratio: number): string {
  if (ratio >= 0.9) return 'bg-red-500/20';
  if (ratio >= 0.6) return 'bg-amber-500/20';
  return 'bg-emerald-500/20';
}

/* ═══════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════ */

export default function AdminBannersPage() {
  // --- State ---
  const [stats, setStats] = useState<BannerStats>(DEMO_STATS);
  const [slots] = useState<SlotInfo[]>(DEMO_SLOTS);
  const [banners, setBanners] = useState<Banner[]>(DEMO_BANNERS);
  const [total, setTotal] = useState(DEMO_BANNERS.length);
  const [loading, setLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState('all');
  const [slotFilter, setSlotFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // --- Fetch stats ---
  useEffect(() => {
    fetch('/api/admin/banners/stats')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setStats(data); })
      .catch(() => {/* use demo */});
  }, []);

  // --- Fetch banners ---
  const fetchBanners = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (slotFilter !== 'all') params.set('slot', slotFilter);
    if (search) params.set('q', search);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));

    fetch(`/api/admin/banners?${params}`)
      .then((r) => r.ok ? r.json() as Promise<BannersResponse> : null)
      .then((data) => {
        if (data) {
          setBanners(data.banners);
          setTotal(data.total);
        } else {
          // client-side filter on demo data
          let filtered = DEMO_BANNERS;
          if (statusFilter !== 'all') filtered = filtered.filter((b) => b.status === statusFilter);
          if (slotFilter !== 'all') filtered = filtered.filter((b) => b.slot === slotFilter);
          if (search) filtered = filtered.filter((b) =>
            b.title.toLowerCase().includes(search.toLowerCase()) ||
            b.refId.toLowerCase().includes(search.toLowerCase()) ||
            b.entityName.toLowerCase().includes(search.toLowerCase())
          );
          setTotal(filtered.length);
          const start = (page - 1) * pageSize;
          setBanners(filtered.slice(start, start + pageSize));
        }
      })
      .catch(() => {
        setBanners(DEMO_BANNERS.slice(0, pageSize));
        setTotal(DEMO_BANNERS.length);
      })
      .finally(() => setLoading(false));
  }, [statusFilter, slotFilter, search, page]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  // Reset page on filter change
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(1); }, [statusFilter, slotFilter, search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // --- Toggle banner active/inactive ---
  const toggleBanner = (id: string) => {
    setBanners((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, status: b.status === 'active' ? 'draft' as BannerStatus : 'active' as BannerStatus }
          : b
      )
    );
  };

  // --- Delete banner ---
  const deleteBanner = (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
    setTotal((t) => t - 1);
  };

  /* ═══════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-[var(--esl-bg-page)] text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Баннер удирдлага</h1>
          <p className="text-sm text-white/40 mt-0.5">Бүх баннерийн байршил, статус, гүйцэтгэлийг удирдах</p>
        </div>
        <Link
          href="/dashboard/admin/banners/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#E8242C] hover:bg-[#d01f26] text-white rounded-xl text-sm font-semibold transition-colors no-underline"
        >
          <Plus className="w-4 h-4" />
          Баннер нэмэх
        </Link>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-5 gap-4">
        {([
          { label: 'Идэвхтэй баннер', value: stats.activeBanners, icon: ImageIcon, color: 'text-emerald-400', iconBg: 'bg-emerald-500/15' },
          { label: 'Өнөөдөр дуусах', value: stats.expiringToday, icon: Clock, color: 'text-amber-400', iconBg: 'bg-amber-500/15' },
          { label: 'Хүлээгдэж буй', value: stats.pending, icon: Eye, color: 'text-blue-400', iconBg: 'bg-blue-500/15' },
          { label: 'Энэ сарын орлого', value: formatCurrency(stats.revenueThisMonth), icon: DollarSign, color: 'text-[#E8242C]', iconBg: 'bg-[#E8242C]/15' },
          { label: 'Нийт харагдалт', value: formatNumber(stats.totalImpressions), icon: BarChart3, color: 'text-purple-400', iconBg: 'bg-purple-500/15' },
        ] as const).map((s) => (
          <div key={s.label} className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl p-5 flex items-start gap-4">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', s.iconBg)}>
              <s.icon className={cn('w-5 h-5', s.color)} />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-white/40 mb-1">{s.label}</div>
              <div className={cn('text-xl font-black', s.color)}>
                {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Slot Availability Grid ── */}
      <div>
        <h2 className="text-base font-bold mb-3 text-white/70">Байршлын нөхцөл</h2>
        <div className="grid grid-cols-4 gap-3">
          {slots.map((s) => {
            const ratio = s.currentCount / s.maxConcurrent;
            return (
              <div key={s.slot} className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{s.label}</span>
                  <span className="text-[11px] text-white/40">макс {s.maxConcurrent}</span>
                </div>
                {/* Progress bar */}
                <div className={cn('h-2 rounded-full w-full', occupancyBg(ratio))}>
                  <div
                    className={cn('h-2 rounded-full transition-all', occupancyColor(ratio))}
                    style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">{s.currentCount}/{s.maxConcurrent} эзлэгдсэн</span>
                  <span className="text-[10px] text-white/30">{s.priceRange}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Banners Table Section ── */}
      <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-[var(--esl-border)] space-y-3">
          {/* Status pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer',
                  statusFilter === key
                    ? 'bg-[#E8242C] border-[#E8242C] text-white'
                    : 'bg-transparent border-[var(--esl-border)] text-white/50 hover:border-white/30 hover:text-white/80'
                )}
              >
                {label}
              </button>
            ))}

            {/* Slot filter dropdown */}
            <div className="relative ml-auto">
              <select
                value={slotFilter}
                onChange={(e) => setSlotFilter(e.target.value)}
                className="appearance-none bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-lg px-3 py-1.5 pr-8 text-xs text-white/70 cursor-pointer focus:outline-none focus:border-[#E8242C]"
              >
                <option value="all">Бүх байршил</option>
                {Object.entries(SLOT_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-white/40 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Баннер хайх..."
              className="w-full bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#E8242C] transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--esl-border)]">
                <th className="text-left text-[11px] uppercase tracking-wider text-white/30 font-medium px-4 py-3">Баннер</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-white/30 font-medium px-4 py-3">Байршил</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-white/30 font-medium px-4 py-3">Нэгж</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-white/30 font-medium px-4 py-3">Хугацаа</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-white/30 font-medium px-4 py-3">Статус</th>
                <th className="text-right text-[11px] uppercase tracking-wider text-white/30 font-medium px-4 py-3">CTR%</th>
                <th className="text-right text-[11px] uppercase tracking-wider text-white/30 font-medium px-4 py-3">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className={cn(loading && 'opacity-40 pointer-events-none')}>
              {banners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-white/30">
                    Баннер олдсонгүй
                  </td>
                </tr>
              ) : (
                banners.map((b) => {
                  const sc = STATUS_COLORS[b.status];
                  return (
                    <tr key={b.id} className="border-b border-[var(--esl-border)]/60 hover:bg-white/[0.02] transition-colors">
                      {/* Thumbnail + title + refId */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-8 rounded-md bg-[var(--esl-bg-elevated)] flex items-center justify-center shrink-0 overflow-hidden">
                            {b.thumbnailUrl ? (
                              <img loading="lazy" src={b.thumbnailUrl} alt={b.title} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon aria-hidden="true" className="w-4 h-4 text-white/20" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{b.title}</div>
                            <div className="text-[11px] text-white/30">{b.refId}</div>
                          </div>
                        </div>
                      </td>
                      {/* Slot badge */}
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-md bg-[var(--esl-bg-elevated)] text-[11px] font-medium text-white/60">
                          {SLOT_LABELS[b.slot] ?? b.slot}
                        </span>
                      </td>
                      {/* Entity */}
                      <td className="px-4 py-3 text-white/60">{b.entityName}</td>
                      {/* Date range */}
                      <td className="px-4 py-3 text-white/50 text-xs">
                        {b.startDate} — {b.endDate}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={cn('px-2.5 py-1 rounded-full text-[11px] font-semibold', sc.bg, sc.text)}>
                          {STATUS_LABELS[b.status]}
                        </span>
                      </td>
                      {/* CTR */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {b.ctr > 0 && <TrendingUp className="w-3 h-3 text-emerald-400" />}
                          <span className={cn(b.ctr > 3 ? 'text-emerald-400' : b.ctr > 0 ? 'text-white/60' : 'text-white/20')}>
                            {b.ctr > 0 ? `${b.ctr}%` : '—'}
                          </span>
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="Засах"
                            className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center border-none cursor-pointer bg-transparent text-white/40 hover:text-white transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleBanner(b.id)}
                            title="Идэвхжүүлэх/Идэвхгүйжүүлэх"
                            className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center border-none cursor-pointer bg-transparent transition"
                          >
                            {b.status === 'active' ? (
                              <ToggleRight className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-white/30" />
                            )}
                          </button>
                          <button
                            onClick={() => deleteBanner(b.id)}
                            title="Устгах"
                            className="w-7 h-7 rounded-lg hover:bg-red-500/20 flex items-center justify-center border-none cursor-pointer bg-transparent text-white/30 hover:text-red-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--esl-border)]">
          <span className="text-xs text-white/30">
            Нийт {total} баннер, хуудас {page}/{totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="w-8 h-8 rounded-lg border border-[var(--esl-border)] bg-transparent text-white/50 hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  'w-8 h-8 rounded-lg text-xs font-semibold border transition-colors cursor-pointer',
                  page === p
                    ? 'bg-[#E8242C] border-[#E8242C] text-white'
                    : 'bg-transparent border-[var(--esl-border)] text-white/40 hover:border-white/30'
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="w-8 h-8 rounded-lg border border-[var(--esl-border)] bg-transparent text-white/50 hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
