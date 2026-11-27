'use client';

import { useState, useEffect } from 'react';
import { MapPin, Truck, Clock, Crown, ChevronDown } from 'lucide-react';

interface ProvinceOption {
  code: string;
  name: string;
  fee: number;
  days: number;
  isFree?: boolean;
  isActive?: boolean;
}

interface ProvinceSelectorProps {
  onSelect: (province: { code: string; name: string; fee: number; days: number }) => void;
  selected?: string;
}

const PROVINCES: ProvinceOption[] = [
  { code: 'AKH', name: 'Архангай', fee: 15000, days: 7 },
  { code: 'BOL', name: 'Баян-Өлгий', fee: 20000, days: 10 },
  { code: 'BKH', name: 'Баянхонгор', fee: 15000, days: 7 },
  { code: 'BUL', name: 'Булган', fee: 12000, days: 5 },
  { code: 'GOA', name: 'Говь-Алтай', fee: 20000, days: 10 },
  { code: 'GOS', name: 'Говьсүмбэр', fee: 10000, days: 5 },
  { code: 'DAR', name: 'Дархан-Уул', fee: 8000, days: 3 },
  { code: 'DGO', name: 'Дорноговь', fee: 15000, days: 7 },
  { code: 'DOR', name: 'Дорнод', fee: 18000, days: 10 },
  { code: 'DUN', name: 'Дундговь', fee: 15000, days: 7 },
  { code: 'ZAV', name: 'Завхан', fee: 20000, days: 10 },
  { code: 'ORK', name: 'Орхон', fee: 8000, days: 3 },
  { code: 'OVR', name: 'Өвөрхангай', fee: 15000, days: 7 },
  { code: 'OMN', name: 'Өмнөговь', fee: 15000, days: 7 },
  { code: 'SUK', name: 'Сүхбаатар', fee: 15000, days: 7 },
  { code: 'SEL', name: 'Сэлэнгэ', fee: 10000, days: 5 },
  { code: 'TOV', name: 'Төв', fee: 8000, days: 3 },
  { code: 'UVS', name: 'Увс', fee: 20000, days: 10 },
  { code: 'KHO', name: 'Ховд', fee: 20000, days: 10 },
  { code: 'KHV', name: 'Хөвсгөл', fee: 18000, days: 10 },
  { code: 'KHE', name: 'Хэнтий', fee: 15000, days: 7 },
];

function formatFee(fee: number): string {
  return fee.toLocaleString('mn-MN') + '₮';
}

type RawProvince = { code: string; name: string; fee: number; deliveryDays?: string | number; isFree?: boolean; isActive?: boolean };

export function ProvinceSelector({ onSelect, selected }: ProvinceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [provinces, setProvinces] = useState<ProvinceOption[]>(PROVINCES);

  // Try to load live data from API, fall back to static list
  useEffect(() => {
    fetch('/api/provinces')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setProvinces(
            res.data
              .filter((p: RawProvince) => p.isActive !== false)
              .map((p: RawProvince) => ({
                code: p.code,
                name: p.name,
                fee: p.fee,
                days: p.deliveryDays,
                isFree: p.isFree,
              }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const selectedProvince = provinces.find((p) => p.code === selected);

  return (
    <div className="w-full">
      <h3 className="text-[var(--esl-text)] font-bold mb-3 text-base flex items-center gap-2">
        <MapPin className="w-5 h-5 text-blue-500" />
        Аймаг сонгох
      </h3>

      {/* Gold member badge */}
      <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
        <Crown className="w-4 h-4 text-amber-500 shrink-0" />
        <p className="text-xs text-amber-700 m-0">
          50,000₮+ захиалга → үнэгүй хүргэлт
        </p>
      </div>

      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all"
        style={{
          background: selected ? 'var(--esl-bg-section)' : 'var(--esl-bg-section)',
          borderColor: selected ? '#3B82F6' : 'var(--esl-border)',
        }}
      >
        <div className="flex items-center gap-3">
          <Truck className="w-5 h-5" style={{ color: selected ? '#3B82F6' : 'var(--esl-text-muted)' }} />
          <div className="text-left">
            {selectedProvince ? (
              <>
                <p className="text-[var(--esl-text)] font-bold text-[15px] m-0">
                  {selectedProvince.name}
                </p>
                <p className="text-[var(--esl-text-muted)] text-xs m-0">
                  {selectedProvince.isFree ? 'Үнэгүй' : formatFee(selectedProvince.fee)} · {selectedProvince.days} хоног
                </p>
              </>
            ) : (
              <p className="text-[var(--esl-text-muted)] text-sm m-0">Аймаг сонгоно уу</p>
            )}
          </div>
        </div>
        <ChevronDown
          className="w-5 h-5 text-[var(--esl-text-muted)] transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Dropdown list */}
      {open && (
        <div
          className="mt-2 rounded-xl border overflow-hidden max-h-72 overflow-y-auto"
          style={{
            background: 'var(--esl-bg-section)',
            borderColor: 'var(--esl-border)',
          }}
        >
          {provinces.map((p) => {
            const isSelected = p.code === selected;
            return (
              <button
                key={p.code}
                type="button"
                onClick={() => {
                  onSelect({ code: p.code, name: p.name, fee: p.fee, days: p.days });
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-colors border-b last:border-b-0"
                style={{
                  background: isSelected ? '#3B82F612' : 'transparent',
                  borderColor: 'var(--esl-border)',
                }}
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 shrink-0" style={{ color: isSelected ? '#3B82F6' : 'var(--esl-text-muted)' }} />
                  <span
                    className="text-sm font-medium"
                    style={{ color: isSelected ? '#3B82F6' : 'var(--esl-text)' }}
                  >
                    {p.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--esl-text-muted)]">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    {p.isFree ? 'Үнэгүй' : formatFee(p.fee)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {p.days} хоног
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
