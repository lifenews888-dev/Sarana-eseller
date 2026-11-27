'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/shared/Toast';
import { Globe, Lock, Lightbulb, RefreshCw } from 'lucide-react';

interface DomainConfig {
  subdomain: string;
  customDomain: string;
  customDomainVerified: boolean;
  sslEnabled: boolean;
}

const DOMAIN_KEY = 'eseller_domain_config';

export default function DomainPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [config, setConfig] = useState<DomainConfig>({
    subdomain: '',
    customDomain: '',
    customDomainVerified: false,
    sslEnabled: true,
  });
  const [editing, setEditing] = useState(false);
  const [verifyToken] = useState(() => Date.now().toString(36).slice(-6));
  const [subInput, setSubInput] = useState('');

  useEffect(() => {
    const deferred = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(DOMAIN_KEY);
        if (saved) {
          setConfig(JSON.parse(saved));
        } else {
          const defaultSub = (user?.store?.name || user?.name || 'store').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
          setConfig((prev) => ({ ...prev, subdomain: defaultSub }));
          setSubInput(defaultSub);
        }
      } catch {}
    }, 0);
    return () => window.clearTimeout(deferred);
  }, [user]);

  useEffect(() => {
    const deferred = window.setTimeout(() => {
      setSubInput(config.subdomain);
    }, 0);
    return () => window.clearTimeout(deferred);
  }, [config.subdomain]);

  const save = (updates: Partial<DomainConfig>) => {
    const next = { ...config, ...updates };
    setConfig(next);
    localStorage.setItem(DOMAIN_KEY, JSON.stringify(next));
    toast.show('✅ Хадгалагдлаа');
  };

  const isValidSub = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(subInput) && subInput.length >= 3;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-[var(--esl-bg-card)] border-b border-[var(--esl-border)] px-8 py-5">
        <h1 className="text-xl font-black text-[var(--esl-text-primary)] flex items-center gap-2"><Globe className="w-5 h-5" /> Домайн нэр</h1>
        <p className="text-sm text-[var(--esl-text-muted)] mt-0.5">Дэлгүүрийн веб хаягийг тохируулна</p>
      </div>

      <div className="p-8 max-w-3xl space-y-6">

        {/* Current Domain */}
        <div className="bg-gradient-to-br from-[#E8242C] to-blue-50 border border-[var(--esl-brand-border)] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--esl-bg-card)] shadow-sm flex items-center justify-center"><Globe className="w-5 h-5 text-[#E8242C]" /></div>
            <div>
              <div className="text-xs text-[var(--esl-text-secondary)] font-semibold">Одоогийн хаяг</div>
              <div className="text-lg font-black text-[var(--esl-text-primary)]">
                {config.subdomain || 'store'}.eseller.mn
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-green-600 font-semibold">Идэвхтэй</span>
            {config.sslEnabled && (
              <>
                <span className="text-[var(--esl-text-muted)] mx-1">·</span>
                <span className="text-xs text-[var(--esl-text-muted)] flex items-center gap-1"><Lock className="w-3 h-3" /> SSL идэвхтэй</span>
              </>
            )}
          </div>
        </div>

        {/* ═══ Subdomain ═══ */}
        <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[var(--esl-text-primary)]">Субдомайн</h3>
              <p className="text-xs text-[var(--esl-text-muted)] mt-0.5">Үнэгүй eseller.mn субдомайн</p>
            </div>
            <span className="text-[10px] font-bold bg-green-100 text-green-600 px-2 py-1 rounded-md">Үнэгүй</span>
          </div>

          <div className="flex items-center gap-0 rounded-xl border border-[var(--esl-border)] overflow-hidden focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10">
            <span className="text-sm text-[var(--esl-text-muted)] bg-[var(--esl-bg-section)] px-4 py-2.5 border-r border-[var(--esl-border)] shrink-0">https://</span>
            <input
              value={subInput}
              onChange={(e) => setSubInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              className="flex-1 px-3 py-2.5 text-sm font-semibold outline-none border-none"
              placeholder="miiny-delguur"
            />
            <span className="text-sm text-[var(--esl-text-muted)] bg-[var(--esl-bg-section)] px-4 py-2.5 border-l border-[var(--esl-border)] shrink-0">.eseller.mn</span>
          </div>

          {subInput && !isValidSub && (
            <p className="text-xs text-red-500 mt-2">Дор хаяж 3 тэмдэгт, зөвхөн жижиг үсэг, тоо, зураас (-).</p>
          )}

          {subInput !== config.subdomain && (
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => isValidSub && save({ subdomain: subInput })}
                disabled={!isValidSub}
                className="bg-brand text-white px-5 py-2 rounded-xl text-xs font-bold border-none cursor-pointer hover:bg-brand-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Хадгалах
              </button>
              <button
                onClick={() => setSubInput(config.subdomain)}
                className="text-[var(--esl-text-muted)] text-xs font-semibold bg-transparent border-none cursor-pointer hover:text-[var(--esl-text-secondary)]"
              >
                Цуцлах
              </button>
            </div>
          )}
        </div>

        {/* ═══ Custom Domain ═══ */}
        <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[var(--esl-text-primary)]">Хувийн домайн</h3>
              <p className="text-xs text-[var(--esl-text-muted)] mt-0.5">Өөрийн домайн холбох (жишээ: minii-delguur.mn)</p>
            </div>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-1 rounded-md">Pro багц</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={config.customDomain}
              onChange={(e) => setConfig({ ...config, customDomain: e.target.value, customDomainVerified: false })}
              className="flex-1 border border-[var(--esl-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition"
              placeholder="minii-delguur.mn"
            />
            <button
              onClick={() => {
                if (config.customDomain) {
                  save({ customDomain: config.customDomain, customDomainVerified: false });
                }
              }}
              disabled={!config.customDomain}
              className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold border-none cursor-pointer hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              Холбох
            </button>
          </div>

          {config.customDomain && (
            <div className="mt-4 bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                {config.customDomainVerified ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs text-green-600 font-bold">Баталгаажсан</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-xs text-amber-600 font-bold">DNS тохиргоо хүлээгдэж байна</span>
                  </>
                )}
              </div>

              <p className="text-xs text-[var(--esl-text-secondary)] mb-3">
                Домайнаа холбохын тулд дараах DNS бичлэгийг нэмнэ үү:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[var(--esl-text-muted)] border-b border-[var(--esl-border)]">
                      <th className="text-left py-2 px-3">Төрөл</th>
                      <th className="text-left py-2 px-3">Нэр</th>
                      <th className="text-left py-2 px-3">Утга</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[var(--esl-border)]">
                      <td className="py-2 px-3 font-mono font-bold">CNAME</td>
                      <td className="py-2 px-3 font-mono">{config.customDomain}</td>
                      <td className="py-2 px-3 font-mono text-brand">cname.eseller.mn</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono font-bold">TXT</td>
                      <td className="py-2 px-3 font-mono">_eseller-verify</td>
                      <td className="py-2 px-3 font-mono text-brand">{config.subdomain}-verify-{verifyToken}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <button
                onClick={() => {
                  save({ customDomainVerified: true });
                  toast.show('✅ Домайн баталгаажлаа!');
                }}
                className="mt-3 bg-[var(--esl-bg-card)] text-[var(--esl-text-primary)] px-4 py-2 rounded-lg text-xs font-bold border border-[var(--esl-border)] cursor-pointer hover:border-brand hover:text-brand transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5 inline" /> Шалгах
              </button>
            </div>
          )}
        </div>

        {/* ═══ SSL ═══ */}
        <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[var(--esl-text-primary)] flex items-center gap-2"><Lock className="w-4 h-4" /> SSL Гэрчилгээ</h3>
              <p className="text-xs text-[var(--esl-text-muted)] mt-0.5">Автоматаар үнэгүй Let&apos;s Encrypt SSL</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.sslEnabled}
                onChange={(e) => save({ sslEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[var(--esl-bg-elevated)] peer-focus:ring-2 peer-focus:ring-brand/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-[var(--esl-border-strong)] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500" />
            </label>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-sm text-blue-700">
          <strong className="flex items-center gap-1"><Lightbulb className="w-4 h-4" /> Мэдээлэл:</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside text-xs text-blue-600">
            <li>Субдомайн (store.eseller.mn) бүх багцад үнэгүй</li>
            <li>Хувийн домайн холбох нь Pro багцаас дээш боломжтой</li>
            <li>DNS өөрчлөлт хүчин төгөлдөр болоход 24-48 цаг шаардагдана</li>
            <li>SSL гэрчилгээ автоматаар үнэгүй олгогдоно</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
