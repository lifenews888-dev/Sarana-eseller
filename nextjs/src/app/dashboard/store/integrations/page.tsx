'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  ExternalLink, Check, X, Settings, Link2, ToggleLeft, ToggleRight,
  RefreshCw, Shield, Crown, Clock, Smartphone, Camera, MessageCircle,
  Search, Music, Heart, BarChart3, Flame, Mail, ShoppingCart, MessageSquare,
  Megaphone, Copy, Upload, Rss, Zap, Link,
} from 'lucide-react'

// ═══════════════════════════════════════════════════════
// Platform Integrations (existing)
// ═══════════════════════════════════════════════════════

interface PlatformIntegration {
  id: string
  name: string
  desc: string
  icon: React.ReactNode
  category: 'sales' | 'chat' | 'analytics' | 'marketing'
  tier: 'free' | 'pro'
  connected: boolean
  lastSync?: string
  status?: 'active' | 'error' | 'pending'
  stats?: { synced?: number; failed?: number }
}

const PLATFORM_INTEGRATIONS: PlatformIntegration[] = [
  { id: 'facebook', name: 'Facebook Shop', desc: 'Барааг Facebook Marketplace-д автоматаар sync хийх', icon: <Smartphone className="w-6 h-6" />, category: 'sales', tier: 'free', connected: false },
  { id: 'instagram', name: 'Instagram Shopping', desc: 'Зураг дээр бараа tag хийж шууд зарах', icon: <Camera className="w-6 h-6" />, category: 'sales', tier: 'free', connected: false },
  { id: 'messenger', name: 'Facebook Messenger', desc: 'Messenger мессежийг нэг дор удирдах', icon: <MessageCircle className="w-6 h-6" />, category: 'chat', tier: 'free', connected: false },
  { id: 'google_merchant', name: 'Google Merchant Center', desc: 'Google Shopping-д бараа гаргах', icon: <Search className="w-6 h-6" />, category: 'sales', tier: 'pro', connected: false },
  { id: 'tiktok', name: 'TikTok Shop', desc: 'TikTok дээр бараа зарах', icon: <Music className="w-6 h-6" />, category: 'sales', tier: 'pro', connected: false },
  { id: 'viber', name: 'Viber Business', desc: 'Viber-ээр мессеж хүлээн авах', icon: <Heart className="w-6 h-6" />, category: 'chat', tier: 'free', connected: false },
  { id: 'ga4', name: 'Google Analytics 4', desc: 'Хандалт, борлуулалтын аналитик', icon: <BarChart3 className="w-6 h-6" />, category: 'analytics', tier: 'free', connected: true, status: 'active', lastSync: 'Автомат' },
  { id: 'hotjar', name: 'Hotjar Heatmaps', desc: 'Хэрэглэгчийн зан төлөв, heatmap', icon: <Flame className="w-6 h-6" />, category: 'analytics', tier: 'pro', connected: false },
  { id: 'mailchimp', name: 'Mailchimp Email', desc: 'Имэйл маркетинг автоматжуулалт', icon: <Mail className="w-6 h-6" />, category: 'marketing', tier: 'pro', connected: false },
]

const PLATFORM_CATEGORIES = [
  { key: 'all', label: 'Бүгд' },
  { key: 'sales', label: 'Борлуулалт', icon: <ShoppingCart className="w-3.5 h-3.5 inline" /> },
  { key: 'chat', label: 'Чат', icon: <MessageSquare className="w-3.5 h-3.5 inline" /> },
  { key: 'analytics', label: 'Аналитик', icon: <BarChart3 className="w-3.5 h-3.5 inline" /> },
  { key: 'marketing', label: 'Маркетинг', icon: <Megaphone className="w-3.5 h-3.5 inline" /> },
]

// ═══════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════

export default function IntegrationsPage() {
  const [mainTab, setMainTab] = useState<'import' | 'platforms'>('import')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--esl-text-primary)]">Интеграцууд</h1>
        <p className="text-sm text-[var(--esl-text-secondary)]">Гадаад платформуудтай холбогдож, бараа импортлох</p>
      </div>

      {/* Main tabs */}
      <div className="flex gap-2 border-b border-[var(--esl-border)] pb-0">
        {([
          { key: 'import', label: 'Бараа импорт', icon: <Upload className="w-4 h-4" /> },
          { key: 'platforms', label: 'Платформ холболт', icon: <Link2 className="w-4 h-4" /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setMainTab(t.key)}
            className={cn('flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition cursor-pointer bg-transparent border-x-0 border-t-0',
              mainTab === t.key
                ? 'border-b-[#E8242C] text-[#E8242C]'
                : 'border-b-transparent text-[var(--esl-text-muted)] hover:text-[var(--esl-text-secondary)]')}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {mainTab === 'import' ? <ImportSection /> : <PlatformsSection />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// Import Section (API / URL / Feed)
// ═══════════════════════════════════════════════════════

function ImportSection() {
  const [integration, setIntegration] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'api' | 'url' | 'feed'>('api')
  const [urlInput, setUrlInput] = useState('')
  const [feedUrl, setFeedUrl] = useState('')
  const [feedType, setFeedType] = useState('xml')
  const [feedInterval, setFeedInterval] = useState(60)
  const [scraped, setScraped] = useState<any>(null)
  const [importing, setImporting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [copied, setCopied] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => { fetchIntegration() }, [])

  const fetchIntegration = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/integrations')
      const d = await r.json()
      setIntegration(d.integration)
      if (d.integration?.feedUrl) {
        setFeedUrl(d.integration.feedUrl)
        setFeedType(d.integration.feedType || 'xml')
        setFeedInterval(d.integration.feedInterval || 60)
      }
    } catch {}
    setLoading(false)
  }

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  const regenerateKey = async () => {
    if (!confirm('API key шинэчлэх үү? Хуучин key ажиллахаа болно.')) return
    const r = await fetch('/api/integrations', { method: 'POST' })
    const d = await r.json()
    setIntegration(d.integration)
    setMsg('API key шинэчлэгдлээ')
  }

  const importUrl = async () => {
    if (!urlInput) return
    setImporting(true); setScraped(null); setMsg('')
    try {
      const r = await fetch('/api/integrations/import-url', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      })
      const d = await r.json()
      if (d.success) { setScraped(d.data); setMsg('') }
      else setMsg(d.error || 'Алдаа гарлаа')
    } catch { setMsg('Сүлжээний алдаа') }
    setImporting(false)
  }

  const saveFeed = async () => {
    const r = await fetch('/api/integrations/feed', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedUrl, feedType, feedInterval }),
    })
    if (r.ok) { setMsg('Feed хадгалагдлаа'); fetchIntegration() }
  }

  const syncFeed = async () => {
    setSyncing(true); setMsg('')
    try {
      const r = await fetch('/api/integrations/feed', { method: 'POST' })
      const d = await r.json()
      if (d.success) setMsg(`${d.synced} бараа sync хийгдлээ`)
      else setMsg(d.error || 'Sync алдаа')
    } catch { setMsg('Сүлжээний алдаа') }
    setSyncing(false); fetchIntegration()
  }

  if (loading) return <div className="py-10 text-[var(--esl-text-muted)] text-sm">Ачаалж байна...</div>

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {([
          { key: 'api', label: 'REST API', Icon: Zap },
          { key: 'url', label: 'URL Import', Icon: Link },
          { key: 'feed', label: 'Feed Sync', Icon: Rss },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer transition',
              tab === t.key ? 'bg-[#E8242C] text-white' : 'bg-[var(--esl-bg-card)] text-[var(--esl-text-muted)] hover:bg-[var(--esl-bg-section)]')}>
            <t.Icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── REST API ── */}
      {tab === 'api' && (
        <div className="space-y-4">
          <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-5">
            <h3 className="text-base font-bold text-[var(--esl-text-primary)] mb-4">API Түлхүүр</h3>

            <label className="text-[11px] font-semibold text-[var(--esl-text-muted)] uppercase tracking-wide block mb-1.5">API Key</label>
            <div className="flex gap-2 items-center mb-3">
              <input readOnly value={integration?.apiKey || ''}
                className="flex-1 bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-lg px-3 py-2.5 text-sm font-mono text-[var(--esl-text-primary)] outline-none" />
              <button onClick={() => copyText(integration?.apiKey, 'key')}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold bg-[#E8242C] text-white border-none cursor-pointer hover:bg-[#C41E25] transition">
                <Copy size={13} /> {copied === 'key' ? 'Хуулагдлаа!' : 'Хуулах'}
              </button>
              <button onClick={regenerateKey}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)] border border-[var(--esl-border)] cursor-pointer hover:bg-[var(--esl-bg-elevated)] transition">
                <RefreshCw size={13} /> Шинэчлэх
              </button>
            </div>

            <label className="text-[11px] font-semibold text-[var(--esl-text-muted)] uppercase tracking-wide block mb-1.5">API Secret</label>
            <div className="flex gap-2 items-center mb-4">
              <input readOnly value={integration?.apiSecret ? '••••••••' + integration.apiSecret.slice(-8) : ''}
                className="flex-1 bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-lg px-3 py-2.5 text-sm font-mono text-[var(--esl-text-primary)] outline-none" />
              <button onClick={() => copyText(integration?.apiSecret, 'secret')}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold bg-[#E8242C] text-white border-none cursor-pointer hover:bg-[#C41E25] transition">
                <Copy size={13} /> {copied === 'secret' ? 'Хуулагдлаа!' : 'Хуулах'}
              </button>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-green-700">
              Нийт импортлосон: <strong>{integration?.totalImported || 0}</strong> бараа
              &nbsp;&middot;&nbsp;
              Sync хийсэн: <strong>{integration?.totalSynced || 0}</strong> бараа
            </div>
          </div>

          <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-5">
            <h3 className="text-base font-bold text-[var(--esl-text-primary)] mb-4">API Ашиглалт</h3>

            <label className="text-[11px] font-semibold text-[var(--esl-text-muted)] uppercase tracking-wide block mb-1.5">Нэг бараа илгээх</label>
            <pre className="bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-xl px-4 py-3 text-xs font-mono text-[var(--esl-text-primary)] overflow-x-auto mb-4 whitespace-pre-wrap">
{`curl -X POST https://eseller.mn/api/integrations/external \\
  -H "x-api-key: ${integration?.apiKey || 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "iPhone 15 Pro",
    "price": 3200000,
    "description": "128GB, Титан хар",
    "images": ["https://example.com/img.jpg"],
    "stock": 5
  }'`}
            </pre>

            <label className="text-[11px] font-semibold text-[var(--esl-text-muted)] uppercase tracking-wide block mb-1.5">Олон бараа нэгэн зэрэг (array)</label>
            <pre className="bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-xl px-4 py-3 text-xs font-mono text-[var(--esl-text-primary)] overflow-x-auto whitespace-pre-wrap">
{`curl -X POST https://eseller.mn/api/integrations/external \\
  -H "x-api-key: ${integration?.apiKey || 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '[
    { "name": "Бараа 1", "price": 50000 },
    { "name": "Бараа 2", "price": 80000 }
  ]'`}
            </pre>
          </div>
        </div>
      )}

      {/* ── URL IMPORT ── */}
      {tab === 'url' && (
        <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-[var(--esl-text-primary)]">URL-с бараа импортлох</h3>
            <p className="text-xs text-[var(--esl-text-secondary)] mt-1">Ямар ч сайтын бараа URL-г оруулахад нэр, зураг, үнийг автоматаар татна</p>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[var(--esl-text-muted)] uppercase tracking-wide block mb-1.5">Бараа URL</label>
            <div className="flex gap-2">
              <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
                placeholder="https://example.mn/product/123"
                className="flex-1 bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--esl-text-primary)] outline-none" />
              <button onClick={importUrl} disabled={importing}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#E8242C] text-white border-none cursor-pointer hover:bg-[#c41e25] transition disabled:opacity-50">
                <Upload size={14} /> {importing ? 'Татаж байна...' : 'Импортлох'}
              </button>
            </div>
          </div>

          {msg && <p className="text-sm text-[#E8242C]">{msg}</p>}

          {/* Scraped result */}
          {scraped && (
            <div className="bg-[var(--esl-bg-section)] rounded-xl border border-[var(--esl-border)] p-4">
              <div className="flex items-start gap-3 mb-3">
                {scraped.images?.[0] && (
                  <img src={scraped.images[0]} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--esl-text-primary)] truncate">{scraped.name}</p>
                  <p className="text-lg font-extrabold text-[#E8242C] mt-1">
                    {scraped.price ? scraped.price.toLocaleString() + '₮' : 'Үнэ олдсонгүй'}
                  </p>
                  <p className="text-[11px] text-[var(--esl-text-muted)] mt-0.5">Эх сурвалж: {scraped.sourceType}</p>
                </div>
              </div>
              {scraped.description && (
                <p className="text-xs text-[var(--esl-text-secondary)] mb-3 line-clamp-3">{scraped.description}</p>
              )}
              <button onClick={() => window.location.href = `/dashboard/store/products/new?import=${encodeURIComponent(JSON.stringify(scraped))}`}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#E8242C] text-white border-none cursor-pointer hover:bg-[#c41e25] transition">
                <Check size={14} /> Бараа болгон нэмэх
              </button>
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-[var(--esl-text-muted)] uppercase tracking-wide block mb-2">Дэмжигдэх сайтууд</label>
            <div className="flex flex-wrap gap-1.5">
              {['Shopify', 'WooCommerce', 'AliExpress', 'Amazon', 'Unegui.mn', 'ub.mn', 'Ямар ч сайт'].map(site => (
                <span key={site} className="bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-full px-3 py-1 text-[11px] text-[var(--esl-text-muted)]">
                  {site}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FEED SYNC ── */}
      {tab === 'feed' && (
        <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-[var(--esl-text-primary)]">Feed автомат sync</h3>
            <p className="text-xs text-[var(--esl-text-secondary)] mt-1">Таны сайтын XML/CSV/JSON feed-с бараагаа автоматаар тогтмол татна</p>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[var(--esl-text-muted)] uppercase tracking-wide block mb-1.5">Feed URL</label>
            <input value={feedUrl} onChange={e => setFeedUrl(e.target.value)}
              placeholder="https://yourshop.mn/feed.xml"
              className="w-full bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--esl-text-primary)] outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[var(--esl-text-muted)] uppercase tracking-wide block mb-1.5">Feed төрөл</label>
              <select value={feedType} onChange={e => setFeedType(e.target.value)}
                className="w-full bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--esl-text-primary)] outline-none">
                <option value="xml">XML / RSS</option>
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--esl-text-muted)] uppercase tracking-wide block mb-1.5">Давтамж</label>
              <select value={feedInterval} onChange={e => setFeedInterval(+e.target.value)}
                className="w-full bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--esl-text-primary)] outline-none">
                <option value={15}>15 минут</option>
                <option value={30}>30 минут</option>
                <option value={60}>1 цаг</option>
                <option value={360}>6 цаг</option>
                <option value={1440}>Өдөр бүр</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={saveFeed}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#E8242C] text-white border-none cursor-pointer hover:bg-[#C41E25] transition">
              Хадгалах
            </button>
            <button onClick={syncFeed} disabled={syncing || !feedUrl}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#E8242C] text-white border-none cursor-pointer hover:bg-[#c41e25] transition disabled:opacity-50">
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Sync хийж байна...' : 'Одоо sync хийх'}
            </button>
          </div>

          {msg && <p className="text-sm text-green-600">{msg}</p>}

          {/* Sync status */}
          {integration?.lastSyncAt && (
            <div className={cn('rounded-xl px-4 py-3 text-sm',
              integration.syncStatus === 'error'
                ? 'bg-red-50 border border-red-100 text-red-700'
                : 'bg-green-50 border border-green-100 text-green-700')}>
              Сүүлийн sync: {new Date(integration.lastSyncAt).toLocaleString('mn-MN')}
              {integration.syncError && <span className="text-red-600"> — {integration.syncError}</span>}
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-[var(--esl-text-muted)] uppercase tracking-wide block mb-1.5">JSON Feed формат (жишээ)</label>
            <pre className="bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-xl px-4 py-3 text-xs font-mono text-[var(--esl-text-primary)] overflow-x-auto whitespace-pre-wrap">
{`[
  {
    "name": "iPhone 15 Pro",
    "price": 3200000,
    "description": "128GB Титан хар",
    "images": ["https://yourshop.mn/img/1.jpg"],
    "stock": 10
  }
]`}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// Platforms Section (existing UI preserved)
// ═══════════════════════════════════════════════════════

function PlatformsSection() {
  const [integrations, setIntegrations] = useState(PLATFORM_INTEGRATIONS)
  const [catFilter, setCatFilter] = useState('all')
  const [connectingId, setConnectingId] = useState<string | null>(null)

  const filtered = catFilter === 'all' ? integrations : integrations.filter(i => i.category === catFilter)
  const connectedCount = integrations.filter(i => i.connected).length

  const handleConnect = (id: string) => {
    setConnectingId(id)
    setTimeout(() => {
      setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: true, status: 'active' as const, lastSync: 'Дөнгөж сая' } : i))
      setConnectingId(null)
    }, 1500)
  }

  const handleDisconnect = (id: string) => {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: false, status: undefined, lastSync: undefined } : i))
  }

  return (
    <div className="space-y-5">
      {/* Stats + filter */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {PLATFORM_CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setCatFilter(c.key)}
              className={cn('px-3.5 py-2 rounded-xl text-xs font-semibold border-none cursor-pointer transition',
                catFilter === c.key ? 'bg-[#E8242C] text-white' : 'bg-[var(--esl-bg-card)] text-[var(--esl-text-secondary)] border border-[var(--esl-border)] hover:bg-[var(--esl-bg-section)]')}>
              {'icon' in c && c.icon} {c.label}
            </button>
          ))}
        </div>
        <div className="text-sm text-[var(--esl-text-secondary)] bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl px-4 py-2">
          <Link2 className="w-4 h-4 inline mr-1.5 text-[#E8242C]" />
          <span className="font-bold text-[var(--esl-text-primary)]">{connectedCount}</span>/{integrations.length} холбогдсон
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(intg => (
          <div key={intg.id} className={cn('bg-[var(--esl-bg-card)] rounded-2xl border p-5 transition-all hover:shadow-sm',
            intg.connected ? 'border-green-200' : 'border-[var(--esl-border)]')}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-[var(--esl-text-secondary)]">{intg.icon}</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-[var(--esl-text-primary)]">{intg.name}</h3>
                    {intg.tier === 'pro' && (
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5" /> PRO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--esl-text-secondary)] mt-0.5 leading-relaxed">{intg.desc}</p>
                </div>
              </div>
            </div>

            {intg.connected && (
              <div className="flex items-center gap-3 mb-3 px-3 py-2 bg-green-50 rounded-lg">
                <div className="flex items-center gap-1.5 text-xs text-green-700 font-semibold">
                  <Check className="w-3.5 h-3.5" /> Холбогдсон
                </div>
                {intg.lastSync && (
                  <div className="flex items-center gap-1 text-[10px] text-green-600">
                    <Clock className="w-3 h-3" /> {intg.lastSync}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              {intg.connected ? (
                <>
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-[var(--esl-bg-section)] text-[var(--esl-text-primary)] hover:bg-[var(--esl-bg-section)] cursor-pointer border-none transition">
                    <Settings className="w-3.5 h-3.5" /> Тохиргоо
                  </button>
                  <button onClick={() => handleDisconnect(intg.id)}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer border-none transition">
                    Салгах
                  </button>
                </>
              ) : (
                <button onClick={() => handleConnect(intg.id)} disabled={connectingId === intg.id}
                  className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold border-none cursor-pointer transition',
                    connectingId === intg.id ? 'bg-[var(--esl-bg-section)] text-[var(--esl-text-muted)]' :
                    intg.tier === 'pro' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' :
                    'bg-[#E8242C] text-white hover:bg-[#C41E25]')}>
                  {connectingId === intg.id
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Холбогдож байна...</>
                    : intg.tier === 'pro'
                    ? <><Crown className="w-3.5 h-3.5" /> Pro шаардлагатай</>
                    : <><Link2 className="w-3.5 h-3.5" /> Холбох</>}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[var(--esl-brand-bg)] border border-[var(--esl-brand-border)] rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-[#E8242C] shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-[var(--esl-text-primary)]">Аюулгүй холболт</h4>
          <p className="text-xs text-[var(--esl-text-secondary)] mt-0.5">Бүх холболт OAuth 2.0 стандартаар хийгдэнэ. Таны нууц үг хадгалагдахгүй.</p>
        </div>
      </div>
    </div>
  )
}
