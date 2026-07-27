'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Search, MapPin, Check, ChevronLeft, ChevronRight,
  Download, Save, AlertTriangle,
} from 'lucide-react';
import { validateCoords, getCoordStats } from '@/lib/location/validateCoords';

/* ═══ Types ═══ */
interface LocationRow {
  id: string;
  name: string;
  entityId: string;
  district: string;
  khoroo: string;
  address: string;
  lat: number | null;
  lng: number | null;
  coordStatus: string | null;
  coordNeedsUpdate: boolean;
  coordCheckedAt: string | null;
  phone: string;
  isPrimary: boolean;
}

/* ═══ Coord Status Badge ═══ */
const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  valid_ub:       { label: 'УБ ✓',           bg: 'bg-green-500/12', color: 'text-green-400' },
  valid_mongolia: { label: 'Монгол ✓',       bg: 'bg-green-500/12', color: 'text-green-400' },
  outside:        { label: 'Монголоос гадна', bg: 'bg-red-500/12',   color: 'text-red-400' },
  zero:           { label: '0,0 буруу',       bg: 'bg-amber-500/12', color: 'text-amber-400' },
  missing:        { label: 'Байхгүй',         bg: 'bg-red-500/12',   color: 'text-red-400' },
};

function CoordStatusBadge({ status }: { status: string }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.missing;
  return (
    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', c.bg, c.color)}>
      {c.label}
    </span>
  );
}

/* ═══ Page ═══ */
export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<LocationRow | null>(null);
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Edit state
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editKhoroo, setEditKhoroo] = useState('');

  const DISTRICTS = ['СБД', 'ЧД', 'БЗД', 'ХУД', 'СХД', 'БГД', 'НД', 'Хан-Уул', 'Налайх', 'Багануур'];
  const PER_PAGE = 10;

  // Fetch locations
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/admin/locations', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data) => setLocations(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Compute stats from real data
  const stats = getCoordStats(locations);

  // Select
  const selectLoc = (loc: LocationRow) => {
    setSelected(loc);
    setEditLat(loc.lat?.toString() || '');
    setEditLng(loc.lng?.toString() || '');
    setEditDistrict(loc.district || '');
    setEditKhoroo(loc.khoroo || '');
  };

  // Filter
  const filtered = locations.filter((loc) => {
    if (statusFilter === 'needs_update' && !loc.coordNeedsUpdate) return false;
    if (statusFilter === 'valid' && loc.coordNeedsUpdate) return false;
    if (statusFilter === 'missing') {
      const check = validateCoords(loc.lat, loc.lng);
      if (check.status !== 'missing') return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return loc.name.toLowerCase().includes(q)
        || loc.district.toLowerCase().includes(q)
        || loc.address.toLowerCase().includes(q);
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Save
  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const body = {
        lat: editLat ? parseFloat(editLat) : null,
        lng: editLng ? parseFloat(editLng) : null,
        district: editDistrict || selected.district,
        khoroo: editKhoroo || selected.khoroo,
      };
      await fetch(`/api/admin/locations/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      const coordCheck = validateCoords(body.lat, body.lng);
      setLocations((prev) => prev.map((l) => l.id === selected.id ? {
        ...l, lat: body.lat, lng: body.lng, district: body.district, khoroo: body.khoroo,
        coordStatus: coordCheck.status, coordNeedsUpdate: coordCheck.needsUpdate,
      } : l));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    finally { setSaving(false); }
  };

  const verifiedPct = stats.total > 0 ? Math.round((stats.valid / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--esl-text-primary)]">Байршлын координат шалгалт</h1>
          <p className="text-sm text-[var(--esl-text-secondary)] mt-0.5">Админ · Нийт {stats.total} байршил · {stats.needsUpdate} шинэчлэх шаардлагатай</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl text-xs font-semibold text-[var(--esl-text-secondary)] hover:bg-[var(--esl-bg-section)] cursor-pointer transition">
          <Download className="w-3.5 h-3.5" /> CSV экспорт
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Нийт байршил', value: stats.total, color: 'text-white' },
          { label: 'Зөв координаттай', value: stats.valid, color: 'text-green-400' },
          { label: 'Координат байхгүй', value: stats.missing + stats.zero, color: 'text-red-400' },
          { label: 'Шинэчлэх шаардлагатай', value: stats.needsUpdate, color: 'text-amber-400' },
        ].map((s) => (
          <div key={s.label} className="bg-[#1A1A2E] rounded-xl p-4 text-white">
            <div className="text-xs text-white/50 mb-1">{s.label}</div>
            <div className={cn('text-2xl font-black', s.color)}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl p-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-[var(--esl-text-secondary)]">Координатын бүрэн байдал</span>
          <span className="font-bold text-[var(--esl-text-primary)]">{verifiedPct}%</span>
        </div>
        <div className="h-2.5 bg-[var(--esl-bg-section)] rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', verifiedPct >= 80 ? 'bg-green-500' : verifiedPct >= 50 ? 'bg-amber-500' : 'bg-red-500')}
            style={{ width: `${verifiedPct}%` }} />
        </div>
      </div>

      {/* Warning banner */}
      {stats.needsUpdate > 0 && (
        <div className="bg-amber-500/8 border border-amber-500/25 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-300">{stats.needsUpdate} дэлгүүрт координат дутуу / буруу байна</p>
              <p className="text-xs text-[var(--esl-text-muted)] mt-0.5">Дэлгүүр эзэдэд мэдэгдэл явуулах эсвэл автомат geocode хийж болно</p>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search + filter */}
          <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl p-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--esl-text-muted)]" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Байршил хайх..."
                  className="w-full pl-10 pr-4 py-2 border border-[var(--esl-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
              </div>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm bg-[var(--esl-bg-card)] cursor-pointer focus:outline-none">
                <option value="all">Бүгд</option>
                <option value="valid">Зөв координаттай</option>
                <option value="needs_update">Шинэчлэх шаардлагатай</option>
                <option value="missing">Координатгүй</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl overflow-hidden">
            {loading ? (
              <p className="text-center py-12 text-[var(--esl-text-muted)]">Ачааллаж байна...</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] text-[var(--esl-text-secondary)] uppercase tracking-wider border-b border-[var(--esl-border)] bg-[var(--esl-bg-section)]/50">
                    <th className="px-4 py-2.5 font-medium">Байршил</th>
                    <th className="px-4 py-2.5 font-medium">Хаяг</th>
                    <th className="px-4 py-2.5 font-medium">Координат</th>
                    <th className="px-4 py-2.5 font-medium">Статус</th>
                    <th className="px-4 py-2.5 font-medium">Шалгасан</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((loc) => {
                    const check = validateCoords(loc.lat, loc.lng);
                    const isActive = selected?.id === loc.id;
                    return (
                      <tr key={loc.id} onClick={() => selectLoc(loc)}
                        className={cn('cursor-pointer transition', isActive ? 'bg-indigo-50' : 'hover:bg-[var(--esl-bg-section)]/50')}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[var(--esl-text-primary)]">{loc.name}</div>
                          {loc.isPrimary && <span className="text-[9px] text-indigo-500 font-bold">ҮНДСЭН</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-[var(--esl-text-primary)]">{loc.district}</div>
                          <div className="text-[10px] text-[var(--esl-text-muted)]">{loc.address?.slice(0, 30)}{loc.address?.length > 30 ? '...' : ''}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {loc.lat != null && loc.lng != null ? (
                            <span className="text-[var(--esl-text-primary)]">{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</span>
                          ) : (
                            <span className="text-red-400 font-medium">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <CoordStatusBadge status={check.status} />
                        </td>
                        <td className="px-4 py-3 text-[10px] text-[var(--esl-text-muted)]">
                          {loc.coordCheckedAt
                            ? new Date(loc.coordCheckedAt).toLocaleDateString('mn-MN')
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  {paginated.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-[var(--esl-text-muted)]">Байршил олдсонгүй</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--esl-border)] text-xs text-[var(--esl-text-secondary)]">
                <span>{filtered.length}-с {((page - 1) * PER_PAGE) + 1}–{Math.min(page * PER_PAGE, filtered.length)} харагдаж байна</span>
                <div className="flex gap-1">
                  <button onClick={() => setPage(Math.max(1, page - 1))} className="w-7 h-7 rounded border border-[var(--esl-border)] flex items-center justify-center cursor-pointer hover:bg-[var(--esl-bg-section)] bg-[var(--esl-bg-card)]">
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setPage(p)}
                      className={cn('w-7 h-7 rounded border flex items-center justify-center cursor-pointer text-xs font-medium',
                        page === p ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]' : 'border-[var(--esl-border)] hover:bg-[var(--esl-bg-section)] bg-[var(--esl-bg-card)]')}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage(Math.min(totalPages, page + 1))} className="w-7 h-7 rounded border border-[var(--esl-border)] flex items-center justify-center cursor-pointer hover:bg-[var(--esl-bg-section)] bg-[var(--esl-bg-card)]">
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick filters */}
          <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-[var(--esl-text-primary)]">Хурдан шүүлтүүр</h4>
            {[
              { label: `Координатгүй (${stats.missing + stats.zero})`, color: 'text-red-500', dot: 'bg-red-500', filter: 'missing' },
              { label: `Шинэчлэх шаардлагатай (${stats.needsUpdate})`, color: 'text-amber-500', dot: 'bg-amber-500', filter: 'needs_update' },
              { label: `Монголоос гадна (${stats.outside})`, color: 'text-orange-500', dot: 'bg-orange-500', filter: 'needs_update' },
            ].map((f) => (
              <button key={f.label} onClick={() => { setStatusFilter(f.filter); setPage(1); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--esl-bg-section)] text-left cursor-pointer bg-transparent border-none transition">
                <span className={cn('w-2 h-2 rounded-full', f.dot)} />
                <span className={cn('text-xs font-medium', f.color)}>{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {selected ? (
            <>
              {/* Map */}
              <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl overflow-hidden">
                <div className="h-48 bg-[var(--esl-bg-section)] flex items-center justify-center relative">
                  {selected.lat && selected.lng ? (
                    <iframe
                      src={`https://maps.google.com/maps?q=${selected.lat},${selected.lng}&z=15&output=embed`}
                      className="w-full h-full border-none"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-center">
                      <MapPin className="w-8 h-8 text-[var(--esl-text-muted)] mx-auto mb-2" />
                      <p className="text-xs text-[var(--esl-text-muted)]">Координат оруулаагүй</p>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[var(--esl-text-primary)] text-sm">{selected.name}</h3>
                    <CoordStatusBadge status={validateCoords(selected.lat, selected.lng).status} />
                  </div>

                  {/* Validation message */}
                  {(() => {
                    const check = validateCoords(
                      editLat ? parseFloat(editLat) : null,
                      editLng ? parseFloat(editLng) : null
                    );
                    return (
                      <div className={cn('text-xs px-3 py-2 rounded-lg', check.valid
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200')}>
                        {check.valid ? '✓' : '⚠'} {check.message}
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[var(--esl-text-muted)] block mb-1">Өргөрөг (lat)</label>
                      <input type="text" value={editLat} onChange={(e) => setEditLat(e.target.value)} placeholder="47.9077..."
                        className="w-full px-2.5 py-2 border border-[var(--esl-border)] rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--esl-text-muted)] block mb-1">Уртраг (lng)</label>
                      <input type="text" value={editLng} onChange={(e) => setEditLng(e.target.value)} placeholder="106.8832..."
                        className="w-full px-2.5 py-2 border border-[var(--esl-border)] rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-[var(--esl-text-muted)] block mb-1">Дүүрэг</label>
                    <select value={editDistrict} onChange={(e) => setEditDistrict(e.target.value)}
                      className="w-full px-2.5 py-2 border border-[var(--esl-border)] rounded-lg text-sm bg-[var(--esl-bg-card)] cursor-pointer focus:outline-none">
                      <option value="">—</option>
                      {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[var(--esl-text-muted)] block mb-1">Хороо</label>
                    <input type="text" value={editKhoroo} onChange={(e) => setEditKhoroo(e.target.value)} placeholder="1-р хороо"
                      className="w-full px-2.5 py-2 border border-[var(--esl-border)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>

                  <button onClick={handleSave} disabled={saving}
                    className={cn('w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold border-none cursor-pointer transition',
                      saved ? 'bg-green-600 text-white' : 'bg-[#1A1A2E] text-white hover:bg-[#2D2B55]')}>
                    {saved ? <><Check className="w-3.5 h-3.5" /> Хадгалсан</> : <><Save className="w-3.5 h-3.5" /> Хадгалах</>}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl p-8 text-center">
              <MapPin className="w-10 h-10 text-[var(--esl-text-muted)] mx-auto mb-3" />
              <p className="text-sm font-semibold text-[var(--esl-text-muted)]">Байршил сонгоно уу</p>
              <p className="text-xs text-[var(--esl-text-muted)] mt-1">Зүүн талын хүснэгтээс байршил сонговол координатын мэдээлэл харагдана</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
