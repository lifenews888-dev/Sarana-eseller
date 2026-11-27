'use client';

import { useState } from 'react';
import { Users, QrCode, Phone, Hash } from 'lucide-react';

export interface AffiliateValue {
  allowAffiliate: boolean;
  affiliateCommission: number;
  verificationMethod: 'code' | 'phone' | 'qr';
}

interface AffiliateSettingsProps {
  value: AffiliateValue;
  onChange: (value: AffiliateValue) => void;
  entityType: 'STORE' | 'LISTING';
}

const LIMITS = {
  STORE: { min: 5, max: 30, default: 10 },
  LISTING: { min: 0, max: 15, default: 5 },
};

const METHODS = [
  { key: 'code' as const, label: 'Код', icon: Hash, desc: 'ESL-XXXXXX баталгаажуулах код' },
  { key: 'phone' as const, label: 'Утас', icon: Phone, desc: 'Утасны дугаараар баталгаажуулах' },
  { key: 'qr' as const, label: 'QR', icon: QrCode, desc: 'QR код уншуулж баталгаажуулах' },
];

export default function AffiliateSettings({ value, onChange, entityType }: AffiliateSettingsProps) {
  const limits = LIMITS[entityType];
  const [showPreview, setShowPreview] = useState(false);

  const update = (partial: Partial<AffiliateValue>) => {
    onChange({ ...value, ...partial });
  };

  const sampleAmount = 100_000;
  const platformFee = Math.round(sampleAmount * 0.02);
  const sellerAmount = Math.round(sampleAmount * value.affiliateCommission / 100);
  const ownerAmount = sampleAmount - platformFee - sellerAmount;

  return (
    <div className="bg-[var(--esl-bg-section)] rounded-xl p-4 border border-[var(--esl-border)] space-y-4">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-[var(--esl-text-secondary)]" />
          <div>
            <p className="text-sm font-medium text-[var(--esl-text)]">Борлуулагч/агентаар зарлуулах</p>
            <p className="text-xs text-[var(--esl-text-secondary)]">
              {entityType === 'STORE' ? 'Дэлгүүрийн бараа' : 'Зарын'} борлуулалтанд affiliate идэвхжүүлэх
            </p>
          </div>
        </div>
        <button
          onClick={() => update({
            allowAffiliate: !value.allowAffiliate,
            affiliateCommission: !value.allowAffiliate ? limits.default : 0,
          })}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            value.allowAffiliate ? 'bg-[#E8242C]' : 'bg-gray-300'
          }`}
        >
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            value.allowAffiliate ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`} />
        </button>
      </div>

      {value.allowAffiliate && (
        <>
          {/* Commission Slider */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-[var(--esl-text-secondary)]">Commission хувь</label>
              <span className="text-sm font-bold text-[#E8242C]">{value.affiliateCommission}%</span>
            </div>
            <input
              type="range"
              min={limits.min}
              max={limits.max}
              step={1}
              value={value.affiliateCommission}
              onChange={(e) => update({ affiliateCommission: +e.target.value })}
              className="w-full h-2 bg-[var(--esl-bg-elevated)] rounded-lg appearance-none cursor-pointer accent-[#E8242C]"
            />
            <div className="flex justify-between text-xs text-[var(--esl-text-disabled)]">
              <span>{limits.min}%</span>
              <span>{limits.max}%</span>
            </div>
          </div>

          {/* Preview */}
          <div
            className="bg-[var(--esl-bg-page)] rounded-lg p-3 cursor-pointer"
            onClick={() => setShowPreview(!showPreview)}
          >
            <p className="text-xs text-[var(--esl-text-secondary)] mb-2">
              Жишиг тооцоо: {sampleAmount.toLocaleString()}₮ борлуулалт
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-[var(--esl-text-secondary)]">Та авах</p>
                <p className="text-sm font-bold text-green-600">{ownerAmount.toLocaleString()}₮</p>
              </div>
              <div>
                <p className="text-xs text-[var(--esl-text-secondary)]">Борлуулагч</p>
                <p className="text-sm font-bold text-blue-600">{sellerAmount.toLocaleString()}₮</p>
              </div>
              <div>
                <p className="text-xs text-[var(--esl-text-secondary)]">Платформ</p>
                <p className="text-sm font-bold text-[var(--esl-text-secondary)]">{platformFee.toLocaleString()}₮</p>
              </div>
            </div>
          </div>

          {/* Verification Method */}
          <div>
            <label className="text-sm text-[var(--esl-text-secondary)] mb-2 block">Баталгаажуулалтын арга</label>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => update({ verificationMethod: m.key })}
                  className={`p-2 rounded-lg border text-center transition ${
                    value.verificationMethod === m.key
                      ? 'border-[#E8242C] bg-red-50 text-[#E8242C]'
                      : 'border-[var(--esl-border)] text-[var(--esl-text-secondary)]'
                  }`}
                >
                  <m.icon size={16} className="mx-auto mb-1" />
                  <p className="text-xs font-medium">{m.label}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
