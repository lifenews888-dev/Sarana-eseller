'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  Search, Plus, RefreshCw, ExternalLink, TrendingUp, Package,
} from 'lucide-react'

const SOURCES = [
  { id: 'aliexpress', label: 'AliExpress', flag: '🇨🇳', color: '#E8242C' },
  { id: 'cj', label: 'CJ Dropship', flag: '📦', color: '#FF6B00' },
  { id: '1688', label: '1688.com', flag: '🏭', color: '#FF4B00' },
]

const USD_RATE = 3450

export default function DropshipPage() {
  const [tab, setTab] = useState<'search' | 'my'>('search')
  const [source, setSource] = useState('aliexpress')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [myProducts, setMyProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [importing, setImporting] = useState<string | null>(null)
  const [margin, setMargin] = useState(40)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (tab === 'my') fetchMyProducts()
  }, [tab])

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    setMsg('')
    try {
      const r = await fetch(`/api/dropship/search?q=${encodeURIComponent(query)}&source=${source}`)
      const d = await r.json()
      setResults(d.products || [])
      if (d.demo) setMsg('Demo горим — API key тохируулаагүй')
    } catch {
      setMsg('Сүлжээний алдаа')
    }
    setLoading(false)
  }

  const importProduct = async (p: any) => {
    setImporting(p.supplierId)
    try {
      const r = await fetch('/api/dropship/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...p, profitMargin: margin }),
      })
      const d = await r.json()
      if (d.success) {
        setMsg(`"${p.name.slice(0, 30)}..." нэмэгдлээ — ${d.sellPrice?.toLocaleString()}₮`)
      } else {
        setMsg(d.error || 'Алдаа')
      }
    } catch {
      setMsg('Сүлжээний алдаа')
    }
    setImporting(null)
  }

  const fetchMyProducts = async () => {
    try {
      const r = await fetch('/api/dropship/sync')
      const d = await r.json()
      setMyProducts(d.products || [])
    } catch {}
  }

  const syncAll = async () => {
    setSyncing(true)
    setMsg('')
    try {
      const r = await fetch('/api/dropship/sync', { method: 'POST' })
      const d = await r.json()
      setMsg(`${d.synced} бараа sync — $1 = ${d.usdRate?.toLocaleString()}₮`)
    } catch {
      setMsg('Sync алдаа')
    }
    setSyncing(false)
    fetchMyProducts()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--esl-text-primary)]">Dropshipping</h1>
        <p className="text-sm text-[var(--esl-text-secondary)]">AliExpress, CJ-с бараа хайж, автоматаар импортлох</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--esl-border)] pb-0">
        {([
          { key: 'search', label: 'Бараа хайх', icon: <Search className="w-4 h-4" /> },
          { key: 'my', label: `Миний бараа (${myProducts.length})`, icon: <Package className="w-4 h-4" /> },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition cursor-pointer bg-transparent border-x-0 border-t-0',
              tab === t.key
                ? 'border-b-[#E8242C] text-[#E8242C]'
                : 'border-b-transparent text-[var(--esl-text-muted)] hover:text-[var(--esl-text-secondary)]')}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── SEARCH ── */}
      {tab === 'search' && (
        <div className="space-y-4">
          {/* Source buttons */}
          <div className="flex gap-2">
            {SOURCES.map(s => (
              <button key={s.id} onClick={() => setSource(s.id)}
                className={cn('px-4 py-2 rounded-xl text-sm font-semibold border-2 cursor-pointer transition',
                  source === s.id ? 'text-white' : 'bg-[var(--esl-bg-section)] text-[var(--esl-text-muted)] border-[var(--esl-border)]')}
                style={source === s.id ? { background: s.color, borderColor: s.color } : undefined}>
                {s.flag} {s.label}
              </button>
            ))}
          </div>

          {/* Search bar + margin */}
          <div className="flex gap-2 flex-wrap">
            <input value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="iPhone, Nike, Samsung..."
              className="flex-1 min-w-[200px] bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-lg px-3.5 py-2.5 text-sm text-[var(--esl-text-primary)] outline-none" />
            <div className="flex items-center gap-2 bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-lg px-3 py-2">
              <TrendingUp size={14} className="text-green-600" />
              <span className="text-xs text-[var(--esl-text-muted)]">Ашиг:</span>
              <input type="number" value={margin} onChange={e => setMargin(+e.target.value)}
                className="w-12 bg-transparent border-none text-green-600 font-bold text-sm outline-none" />
              <span className="text-green-600 font-bold text-sm">%</span>
            </div>
            <button onClick={search} disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#E8242C] text-white border-none cursor-pointer hover:bg-[#c41e25] transition disabled:opacity-50">
              <Search size={15} /> {loading ? 'Хайж байна...' : 'Хайх'}
            </button>
          </div>

          {msg && (
            <p className={cn('text-sm', msg.includes('нэмэгдлээ') ? 'text-green-600' : msg.includes('Demo') ? 'text-amber-600' : 'text-red-600')}>
              {msg}
            </p>
          )}

          {/* Results grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map(p => {
              const costMnt = Math.round(p.supplierPrice * USD_RATE)
              const sellPrice = Math.round(costMnt * (1 + margin / 100))
              const profit = sellPrice - costMnt
              const src = SOURCES.find(s => s.id === p.supplierName)

              return (
                <div key={p.supplierId} className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl overflow-hidden hover:shadow-sm transition">
                  {/* Image */}
                  <div className="relative">
                    <img src={p.images?.[0]} alt={p.name}
                      className="w-full h-44 object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x180?text=No+Image' }} />
                    <span className="absolute top-2 left-2 text-[10px] font-bold text-white px-2 py-0.5 rounded"
                      style={{ background: src?.color || '#666' }}>
                      {src?.flag} {p.supplierName?.toUpperCase()}
                    </span>
                  </div>

                  <div className="p-3.5">
                    <p className="text-[13px] font-medium text-[var(--esl-text-primary)] leading-snug line-clamp-2 mb-2.5 min-h-[36px]">
                      {p.name}
                    </p>

                    {/* Price breakdown */}
                    <div className="bg-[var(--esl-bg-section)] rounded-lg p-2.5 mb-2.5 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[var(--esl-text-muted)]">Нийлүүлэгч:</span>
                        <span className="text-[var(--esl-text-primary)] font-semibold">${p.supplierPrice} ≈ {costMnt.toLocaleString()}₮</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--esl-text-muted)]">Зарах үнэ:</span>
                        <span className="text-[#E8242C] font-extrabold">{sellPrice.toLocaleString()}₮</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--esl-text-muted)]">Ашиг:</span>
                        <span className="text-green-600 font-bold">+{profit.toLocaleString()}₮</span>
                      </div>
                    </div>

                    <div className="flex gap-1.5 text-[11px] text-[var(--esl-text-muted)] mb-3">
                      <span>📦 {p.supplierStock}</span>
                      <span>&middot;</span>
                      <span>🚚 {p.shipping}</span>
                      {p.orders > 0 && <><span>&middot;</span><span>🛒 {p.orders}+</span></>}
                    </div>

                    <div className="flex gap-1.5">
                      <button onClick={() => importProduct(p)} disabled={importing === p.supplierId}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-[#E8242C] text-white border-none cursor-pointer hover:bg-[#c41e25] transition disabled:opacity-50">
                        <Plus size={13} /> {importing === p.supplierId ? 'Нэмж байна...' : 'Нэмэх'}
                      </button>
                      <a href={p.supplierUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center w-9 py-2 rounded-lg bg-[#E8242C] text-white hover:bg-[#C41E25] transition no-underline">
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {!loading && results.length === 0 && query && (
            <div className="text-center py-16 text-[var(--esl-text-muted)]">
              <p className="text-4xl mb-3">🔍</p>
              <p>Бараа олдсонгүй</p>
            </div>
          )}
        </div>
      )}

      {/* ── MY PRODUCTS ── */}
      {tab === 'my' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--esl-text-muted)]">{myProducts.length} dropship бараа</p>
            <button onClick={syncAll} disabled={syncing}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#E8242C] text-white border-none cursor-pointer hover:bg-[#C41E25] transition disabled:opacity-50">
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Sync хийж байна...' : 'Бүгдийг sync хийх'}
            </button>
          </div>

          {msg && <p className="text-sm text-green-600">{msg}</p>}

          {myProducts.length === 0 ? (
            <div className="text-center py-20 text-[var(--esl-text-muted)]">
              <p className="text-5xl mb-3">📦</p>
              <p className="text-base">Dropship бараа байхгүй байна</p>
              <p className="text-sm mt-1">Хайлт хийж бараа нэмээрэй</p>
              <button onClick={() => setTab('search')}
                className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#E8242C] text-white border-none cursor-pointer hover:bg-[#c41e25] transition">
                Бараа хайх →
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {myProducts.map((d: any) => {
                const costMnt = Math.round(d.supplierPrice * (d.supplierCurrency === 'USD' ? USD_RATE : 1))
                const profit = (d.product?.price || 0) - costMnt
                const pctMargin = costMnt > 0 ? Math.round((profit / costMnt) * 100) : 0

                return (
                  <div key={d.id} className="flex items-center gap-3 bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl p-3.5">
                    <img src={d.product?.images?.[0]} alt=""
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                      onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/64' }} />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--esl-text-primary)] truncate">{d.product?.name}</p>
                      <div className="flex gap-3 mt-1 flex-wrap text-xs">
                        <span className="text-[var(--esl-text-muted)]">Өртөг: {costMnt.toLocaleString()}₮</span>
                        <span className="text-[#E8242C] font-bold">Зарах: {d.product?.price?.toLocaleString()}₮</span>
                        <span className="text-green-600 font-bold">+{profit.toLocaleString()}₮ ({pctMargin}%)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-semibold',
                        d.syncStatus === 'success' ? 'bg-green-50 text-green-700' :
                        d.syncStatus === 'error' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600')}>
                        {d.syncStatus === 'success' ? 'Sync' : d.syncStatus === 'error' ? 'Алдаа' : 'Хүлээж байна'}
                      </span>
                      <a href={d.supplierUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[var(--esl-text-muted)] hover:text-[var(--esl-text-primary)] transition">
                        <ExternalLink size={15} />
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
