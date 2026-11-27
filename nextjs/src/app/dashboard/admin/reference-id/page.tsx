'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Hash, Settings, Search, RefreshCw, Check, ChevronRight,
  Clock, Tag, Package, ShoppingCart, Building2, Users,
} from 'lucide-react';

interface IdFormat {
  prefix: string;
  separator: string;
  pattern: string;
  seqStart: number;
  seqLength: number;
  seqStep: number;
  categoryCode: string;
  caseStyle: 'upper' | 'lower';
  active: boolean;
}

type ObjectType = 'product' | 'order' | 'shop' | 'user' | 'chat' | 'ad';

const OBJECT_TYPES: { key: ObjectType; label: string; icon: React.ElementType; active: boolean }[] = [
  { key: 'product', label: 'Бараа', icon: Package, active: true },
  { key: 'order', label: 'Захиалга', icon: ShoppingCart, active: true },
  { key: 'shop', label: 'Дэлгүүр', icon: Building2, active: true },
  { key: 'user', label: 'Хэрэглэгч', icon: Users, active: false },
  { key: 'chat', label: 'Чат', icon: Hash, active: false },
  { key: 'ad', label: 'Зар', icon: Tag, active: false },
];

const TOKENS = ['{CAT}', '{SEQ}', '{YR}', '{MO}', '{RND}'];
const SEPARATORS = [
  { value: '-', label: '— Зураас (-)' },
  { value: '_', label: '_ Доогуур зураас (_)' },
  { value: '.', label: '. Цэг (.)' },
  { value: '', label: 'Тусгаарлагчгүй' },
];
const CATEGORY_CODES: Record<string, string> = {
  electronics: 'ELC', fashion: 'FSH', food: 'FD', beauty: 'BTY', home: 'HM', sports: 'SPT', other: 'OTH',
};

const DEFAULT_FORMAT: IdFormat = {
  prefix: 'PRD', separator: '-', pattern: '{CAT}-{SEQ}', seqStart: 10000, seqLength: 6, seqStep: 1,
  categoryCode: 'ELC', caseStyle: 'upper', active: true,
};

export default function ReferenceIdPage() {
  const [selectedObj, setSelectedObj] = useState<ObjectType>('product');
  const [format, setFormat] = useState<IdFormat>(DEFAULT_FORMAT);
  const [checkId, setCheckId] = useState('PRD-ELC-010042');
  const [saved, setSaved] = useState(false);

  // Generate preview ID
  const generatePreview = () => {
    let id = format.prefix + format.separator;
    const parts = format.pattern.replace(/\{CAT\}/g, format.categoryCode)
      .replace(/\{SEQ\}/g, String(format.seqStart).padStart(format.seqLength, '0'))
      .replace(/\{YR\}/g, '26')
      .replace(/\{MO\}/g, '04')
      .replace(/\{RND\}/g, Math.random().toString(36).substring(2, 6).toUpperCase());
    id += parts;
    return format.caseStyle === 'upper' ? id.toUpperCase() : id.toLowerCase();
  };

  const previewId = generatePreview();
  const nextId = format.prefix + format.separator + format.categoryCode + format.separator + String(format.seqStart + format.seqStep).padStart(format.seqLength, '0');

  // Sample IDs
  const sampleIds = [
    { id: `${format.prefix}-ELC-${String(format.seqStart).padStart(format.seqLength, '0')}`, label: 'Электроник · жишээ' },
    { id: `${format.prefix}-FSH-${String(format.seqStart + 1).padStart(format.seqLength, '0')}`, label: 'Хувцас · жишээ' },
    { id: `${format.prefix}-FD-${String(format.seqStart + 2).padStart(format.seqLength, '0')}`, label: 'Хоол хүнс · жишээ' },
    { id: `${format.prefix}-BTY-${String(format.seqStart + 3).padStart(format.seqLength, '0')}`, label: 'Гоо сайхан · жишээ' },
  ];

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--esl-text-primary)]">Reference ID тохиргоо</h1>
          <p className="text-sm text-[var(--esl-text-secondary)]">Админ · Бараа болон захиалгын дугаарын формат</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl text-xs font-semibold text-[var(--esl-text-secondary)] hover:bg-[var(--esl-bg-section)] cursor-pointer transition">
            Анхны тохиргоо
          </button>
          <button className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-semibold hover:bg-amber-100 cursor-pointer transition">
            Дараалал дугаарлах
          </button>
          <button onClick={handleSave}
            className={cn('px-4 py-2 rounded-xl text-xs font-semibold border-none cursor-pointer transition',
              saved ? 'bg-green-600 text-white' : 'bg-[#E8242C] text-white hover:bg-[#C41E25]')}>
            {saved ? <><Check className="w-3 h-3 inline mr-1" /> Хадгалсан</> : 'Тохиргоо хадгалах'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Нийт ID олгогдсон', value: '48,231', sub: 'Нийт бүртгэлтэй', color: 'text-white' },
          { label: 'Өнөөдөр шинэ', value: '+142', sub: 'Нийт бараа/захиалга', color: 'text-green-400' },
          { label: 'Мөргөлдөөн', value: '0', sub: 'Давхардсан ID', color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="bg-[#1A1A2E] rounded-xl p-4 text-white">
            <div className="text-[10px] text-white/50 mb-1">{s.label}</div>
            <div className={cn('text-2xl font-black', s.color)}>{s.value}</div>
            <div className="text-[10px] text-white/40">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ═══ Left — Config ═══ */}
        <div className="space-y-4">
          {/* Object scope */}
          <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-[var(--esl-text-primary)]">ID хамрах хүрээ</h3>
              <span className="text-[10px] text-[var(--esl-text-muted)]">Ямар объектод ID олгох</span>
            </div>
            <div>
              <div className="text-xs text-[var(--esl-text-secondary)] mb-2">Хамрах объект</div>
              <div className="flex flex-wrap gap-2">
                {OBJECT_TYPES.map((obj) => (
                  <button key={obj.key} onClick={() => setSelectedObj(obj.key)}
                    className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition',
                      selectedObj === obj.key ? 'bg-[#E8242C] text-white border-[#E8242C]' : obj.active ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-[var(--esl-bg-section)] text-[var(--esl-text-muted)] border-[var(--esl-border)]')}>
                    {obj.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--esl-text-secondary)] mb-2">Тохиргоо засах объект</div>
              <div className="flex gap-2">
                {['Бараа', 'Захиалга', 'Дэлгүүр'].map((t) => (
                  <button key={t} className={cn('px-4 py-2 rounded-lg text-xs font-semibold border cursor-pointer transition',
                    t === 'Бараа' ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]' : 'bg-[var(--esl-bg-card)] text-[var(--esl-text-secondary)] border-[var(--esl-border)] hover:bg-[var(--esl-bg-section)]')}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Format config */}
          <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-[var(--esl-text-primary)]">Форматын тохиргоо</h3>
              <span className="text-xs font-semibold text-[#E8242C] bg-[var(--esl-brand-bg)] px-2 py-0.5 rounded">Бараа · {format.prefix}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[var(--esl-text-muted)] block mb-1">Угтвар (prefix)</label>
                <input type="text" value={format.prefix} onChange={(e) => setFormat({ ...format, prefix: e.target.value.toUpperCase().slice(0, 6) })}
                  className="w-full px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#E8242C]/40" />
                <span className="text-[10px] text-[var(--esl-text-muted)]">2–6 үсэг, том үсгээр</span>
              </div>
              <div>
                <label className="text-[10px] text-[var(--esl-text-muted)] block mb-1">Тусгаарлагч</label>
                <select value={format.separator} onChange={(e) => setFormat({ ...format, separator: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm bg-[var(--esl-bg-card)] cursor-pointer focus:outline-none">
                  {SEPARATORS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[var(--esl-text-muted)] block mb-1">Форматын загвар</label>
              <div className="flex gap-1.5 mb-2">
                {TOKENS.map((t) => (
                  <button key={t} onClick={() => setFormat({ ...format, pattern: format.pattern + t })}
                    className="px-2 py-1 bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)] rounded text-[10px] font-mono font-semibold border-none cursor-pointer hover:bg-[var(--esl-bg-card-hover)] transition">
                    {t}
                  </button>
                ))}
              </div>
              <input type="text" value={format.pattern} onChange={(e) => setFormat({ ...format, pattern: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm font-mono bg-[#1A1A2E] text-white focus:outline-none" />
              <span className="text-[10px] text-[var(--esl-text-muted)]">Токен дарж оруулна уу · Жишээ: {'{CAT}'}-{'{YR}'}-{'{SEQ}'}</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-[var(--esl-text-muted)] block mb-1">Дараалал эхлэх тоо</label>
                <input type="number" value={format.seqStart} onChange={(e) => setFormat({ ...format, seqStart: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#E8242C]/40" />
              </div>
              <div>
                <label className="text-[10px] text-[var(--esl-text-muted)] block mb-1">Дугаарын урт</label>
                <input type="number" value={format.seqLength} onChange={(e) => setFormat({ ...format, seqLength: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#E8242C]/40" />
              </div>
              <div>
                <label className="text-[10px] text-[var(--esl-text-muted)] block mb-1">Нэмэгдэх алхам</label>
                <input type="number" value={format.seqStep} onChange={(e) => setFormat({ ...format, seqStep: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#E8242C]/40" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[var(--esl-text-muted)] block mb-1">Ангилалын код</label>
                <select value={format.categoryCode} onChange={(e) => setFormat({ ...format, categoryCode: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm bg-[var(--esl-bg-card)] cursor-pointer focus:outline-none">
                  {Object.entries(CATEGORY_CODES).map(([k, v]) => <option key={k} value={v}>{v} — {k}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[var(--esl-text-muted)] block mb-1">Том/жижиг үсэг</label>
                <select value={format.caseStyle} onChange={(e) => setFormat({ ...format, caseStyle: e.target.value as 'upper' | 'lower' })}
                  className="w-full px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm bg-[var(--esl-bg-card)] cursor-pointer focus:outline-none">
                  <option value="upper">Том үсэг (UPPER)</option>
                  <option value="lower">Жижиг үсэг (lower)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Right — Preview ═══ */}
        <div className="space-y-4">
          {/* ID Preview */}
          <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-[var(--esl-text-primary)]">Урьдчилан харах</h3>
            <div className="bg-[#1A1A2E] rounded-xl p-5 text-center">
              <div className="text-[10px] text-white/40 mb-2">ҮҮСЭХ ID ЖИШЭЭ</div>
              <div className="text-2xl font-black text-white font-mono tracking-wider">{previewId}</div>
              <div className="flex items-center justify-center gap-1 mt-3">
                {previewId.split(format.separator).map((part, i) => (
                  <span key={i} className={cn('text-[10px] font-mono font-bold px-2 py-0.5 rounded',
                    i === 0 ? 'bg-[#E8242C]/30 text-[#E8242C]' : i === 1 ? 'bg-amber-500/30 text-amber-300' : 'bg-green-500/30 text-green-300')}>
                    {part}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-[var(--esl-text-secondary)] mb-2">Жишээ ID-ууд ({sampleIds.length})</div>
              <div className="grid grid-cols-2 gap-2">
                {sampleIds.map((s) => (
                  <div key={s.id} className="bg-[var(--esl-bg-section)] rounded-lg p-2.5">
                    <div className="text-xs font-mono font-bold text-[var(--esl-text-primary)]">{s.id}</div>
                    <div className="text-[10px] text-[var(--esl-text-muted)]">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 text-xs border-t border-[var(--esl-border)] pt-3">
              {[
                { label: 'Угтвар', value: format.prefix },
                { label: 'Тусгаарлагч', value: format.separator || '(байхгүй)' },
                { label: 'Загвар', value: format.pattern },
                { label: 'Нийт урт', value: `${previewId.length} тэмдэгт` },
              ].map((r) => (
                <div key={r.label} className="flex justify-between">
                  <span className="text-[var(--esl-text-muted)]">{r.label}</span>
                  <span className="font-mono font-semibold text-[var(--esl-text-primary)]">{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Search & Check */}
          <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-[var(--esl-text-primary)]">Хайлт & шалгалт</h3>
            <div>
              <label className="text-[10px] text-[var(--esl-text-muted)] block mb-1">ID шалгах</label>
              <input type="text" value={checkId} onChange={(e) => setCheckId(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm font-mono bg-[#1A1A2E] text-white focus:outline-none" />
              <span className="text-[10px] text-[var(--esl-text-muted)]">ID оруулж давхардал шалгана уу</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-[var(--esl-text-muted)] block mb-1">Дараагийн ID</label>
                <div className="px-3 py-2 bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-lg text-sm font-mono font-bold text-[var(--esl-text-primary)]">{nextId}</div>
              </div>
              <button className="mt-4 px-3 py-2 bg-[#1A1A2E] text-white rounded-lg text-xs font-semibold border-none cursor-pointer hover:bg-[#2D2B55] transition">
                Шинэчлэх
              </button>
            </div>
          </div>

          {/* Change history */}
          <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl p-5 space-y-2">
            <h3 className="text-sm font-bold text-[var(--esl-text-primary)]">Өөрчлөлтийн түүх</h3>
            {[
              { text: `${format.prefix}-${format.categoryCode}-{SEQ} формат идэвхжсэн`, date: '2026-04-01', dot: 'bg-red-500' },
              { text: 'Дараалал 10000-с эхлүүлсэн', date: '2026-03-20', dot: 'bg-amber-500' },
              { text: 'Угтвар ITEM → PRD болгон өөрчлөв', date: '2026-03-10', dot: 'bg-gray-400' },
              { text: 'Анхны тохиргоо үүссэн', date: '2026-02-15', dot: 'bg-gray-300' },
            ].map((h, i) => (
              <div key={i} className="flex items-start gap-2.5 py-1.5">
                <span className={cn('w-2 h-2 rounded-full mt-1 shrink-0', h.dot)} />
                <div className="flex-1">
                  <div className="text-xs text-[var(--esl-text-primary)]">{h.text}</div>
                </div>
                <span className="text-[10px] text-[var(--esl-text-muted)] shrink-0">{h.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
