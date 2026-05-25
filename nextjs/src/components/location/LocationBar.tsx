'use client';

import { useState } from 'react';
import { MapPin, ChevronDown, Navigation, X, Loader2, ArrowLeft } from 'lucide-react';
import { UB_DISTRICTS } from '@/lib/location/userLocation';
import { MONGOLIA_LOCATIONS } from '@/lib/location/mongolia';

interface LocationBarProps {
  district: { key: string; label: string } | null;
  loading: boolean;
  permissionDenied: boolean;
  nearbyCount?: number;
  onDistrictChange: (key: string) => void;
  onClearLocation?: () => void;
  onRefresh: () => void;
}

export default function LocationBar({
  district, loading, permissionDenied, nearbyCount, onDistrictChange, onClearLocation, onRefresh,
}: LocationBarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerLevel, setPickerLevel] = useState<'main' | 'ub'>('main');

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ background: 'var(--esl-bg-card)', borderColor: 'var(--esl-border)' }}>
        <div className="w-9 h-9 rounded-full bg-[rgba(232,36,44,0.1)] flex items-center justify-center shrink-0">
          <MapPin className="w-4 h-4 text-[#E8242C]" />
        </div>
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--esl-text-muted)' }} />
              <span className="text-sm" style={{ color: 'var(--esl-text-muted)' }}>Байршил тодорхойлж байна...</span>
            </div>
          ) : district ? (
            <>
              <p className="text-sm font-semibold" style={{ color: 'var(--esl-text-primary)' }}>{district.label} дүүрэг</p>
              {nearbyCount !== undefined && (
                <p className="text-xs" style={{ color: 'var(--esl-text-muted)' }}>Таны ойролцоо {nearbyCount} дэлгүүр, үйлчилгээ</p>
              )}
            </>
          ) : (
            <p className="text-sm" style={{ color: 'var(--esl-text-muted)' }}>
              {permissionDenied ? 'Дүүрэг сонгоно уу' : 'Байршил тодорхойлогдоогүй'}
            </p>
          )}
        </div>
        {onClearLocation && (
          <button
            type="button"
            onClick={onClearLocation}
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition"
            style={{ background: 'rgba(232,36,44,0.08)', borderColor: 'rgba(232,36,44,0.18)', color: '#E8242C' }}
          >
            Бүх байршил
          </button>
        )}
        <button type="button" onClick={() => setPickerOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer transition"
          style={{ background: 'var(--esl-bg-section)', color: 'var(--esl-text-secondary)' }}>
          Өөрчлөх <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* District Picker Modal */}
      {pickerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setPickerOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border p-5" onClick={e => e.stopPropagation()}
            style={{ background: 'var(--esl-bg-card)', borderColor: 'var(--esl-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: 'var(--esl-text-primary)' }}>Байршил сонгох</h3>
              <button type="button" onClick={() => setPickerOpen(false)} className="w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer" style={{ background: 'var(--esl-bg-section)', color: 'var(--esl-text-muted)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {onClearLocation && (
              <button
                type="button"
                onClick={() => {
                  onClearLocation();
                  setPickerOpen(false);
                  setPickerLevel('main');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl border mb-3 cursor-pointer transition hover:border-[var(--esl-border-strong)]"
                style={{ background: 'var(--esl-bg-section)', borderColor: 'var(--esl-border)', color: 'var(--esl-text-primary)' }}
              >
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-semibold">Бүх байршил харах</span>
              </button>
            )}

            {/* GPS button */}
            <button type="button" onClick={() => { onRefresh(); setPickerOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl border mb-3 cursor-pointer transition hover:border-[#E8242C]"
              style={{ background: 'rgba(232,36,44,0.05)', borderColor: 'rgba(232,36,44,0.2)', color: '#E8242C' }}>
              <Navigation className="w-4 h-4" />
              <span className="text-sm font-semibold">GPS-ээр тодорхойлох</span>
            </button>

            {/* Level: Main (UB + provinces) or UB districts */}
            {pickerLevel === 'main' ? (
              <>
                {/* UB button */}
                <button onClick={() => setPickerLevel('ub')}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border mb-2 cursor-pointer transition hover:border-[var(--esl-border-strong)]"
                  style={{ background: 'var(--esl-bg-section)', borderColor: 'var(--esl-border)', color: 'var(--esl-text-primary)' }}>
                  <span className="text-sm font-semibold">🏙️ Улаанбаатар (9 дүүрэг)</span>
                  <ChevronDown className="w-3.5 h-3.5 -rotate-90" style={{ color: 'var(--esl-text-muted)' }} />
                </button>

                {/* Provinces */}
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2 mt-3" style={{ color: 'var(--esl-text-muted)' }}>21 аймаг</p>
                <div className="grid grid-cols-2 gap-1.5 max-h-[240px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  {Object.entries(MONGOLIA_LOCATIONS.provinces).map(([key, p]) => (
                    <button key={key} onClick={() => { onDistrictChange(key); setPickerOpen(false); setPickerLevel('main'); }}
                      className={`px-2.5 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-all text-left ${
                        district?.key === key ? 'border-[#E8242C] bg-[rgba(232,36,44,0.05)] text-[#E8242C]' : ''
                      }`} style={district?.key !== key ? { background: 'var(--esl-bg-section)', borderColor: 'var(--esl-border)', color: 'var(--esl-text-primary)' } : undefined}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Back button */}
                <button onClick={() => setPickerLevel('main')}
                  className="flex items-center gap-1.5 text-xs font-semibold mb-3 cursor-pointer border-none bg-transparent"
                  style={{ color: 'var(--esl-text-muted)' }}>
                  <ArrowLeft className="w-3 h-3" /> Бүх байршил
                </button>

                {/* UB Districts */}
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--esl-text-muted)' }}>Улаанбаатар — 9 дүүрэг</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(UB_DISTRICTS).map(([key, d]) => (
                    <button key={key} onClick={() => { onDistrictChange(key); setPickerOpen(false); setPickerLevel('main'); }}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium border cursor-pointer transition-all text-left ${
                        district?.key === key ? 'border-[#E8242C] bg-[rgba(232,36,44,0.05)] text-[#E8242C]' : ''
                      }`} style={district?.key !== key ? { background: 'var(--esl-bg-section)', borderColor: 'var(--esl-border)', color: 'var(--esl-text-primary)' } : undefined}>
                      <MapPin className="w-3 h-3 inline mr-1" />{d.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
