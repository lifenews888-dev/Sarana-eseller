'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Upload, Download, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

const TEMPLATE = `name,price,saleprice,description,images,stock,category,active
iPhone 15 Pro,3200000,2900000,128GB Титан хар,https://example.com/img.jpg,10,electronics,true
Samsung S24,2800000,,256GB Phantom Black,,5,electronics,true
Nike Air Max,450000,380000,Хэмжээ 42,,3,fashion,true`

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'eseller-products-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const upload = async () => {
    if (!file) return
    setLoading(true)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/products/bulk-upload', { method: 'POST', body: fd })
      const d = await r.json()
      setResult(d)
    } catch {
      setResult({ success: 0, failed: 0, errors: ['Сүлжээний алдаа'] })
    }
    setLoading(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.name.endsWith('.csv')) setFile(f)
  }

  return (
    <div className="space-y-6 max-w-[700px]">
      {/* Header */}
      <div>
        <Link href="/dashboard/store/products" className="text-sm text-[var(--esl-text-muted)] no-underline hover:text-[var(--esl-text-secondary)]">
          ← Бараанууд руу буцах
        </Link>
        <h1 className="text-2xl font-extrabold text-[var(--esl-text-primary)] mt-2">CSV бөөнөөр оруулах</h1>
        <p className="text-sm text-[var(--esl-text-secondary)] mt-1">Excel/CSV файлаас олон бараа нэгэн зэрэг нэмэх</p>
      </div>

      {/* Template download */}
      <div className="flex items-center justify-between bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-4">
        <div>
          <p className="text-sm font-semibold text-[var(--esl-text-primary)]">CSV Template татах</p>
          <p className="text-xs text-[var(--esl-text-muted)] mt-0.5">name, price, saleprice, description, images, stock, category, active</p>
        </div>
        <button onClick={downloadTemplate}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#E8242C] text-white border-none cursor-pointer hover:bg-[#C41E25] transition">
          <Download size={14} /> Загвар татах
        </button>
      </div>

      {/* Drag & Drop area */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all',
          dragging ? 'border-[#E8242C] bg-red-50/30' : 'border-[var(--esl-border)] bg-[var(--esl-bg-section)]',
        )}
      >
        <input ref={inputRef} type="file" accept=".csv" className="hidden"
          onChange={e => setFile(e.target.files?.[0] || null)} />
        <Upload size={32} className={cn('mx-auto mb-3', file ? 'text-[#E8242C]' : 'text-[var(--esl-text-muted)]')} />
        {file ? (
          <>
            <p className="text-[var(--esl-text-primary)] font-bold">{file.name}</p>
            <p className="text-xs text-[var(--esl-text-muted)] mt-1">{(file.size / 1024).toFixed(1)} KB</p>
          </>
        ) : (
          <>
            <p className="text-[var(--esl-text-primary)] font-semibold">CSV файл чирж оруулах</p>
            <p className="text-xs text-[var(--esl-text-muted)] mt-1">эсвэл дарж сонгох &middot; Дээд тал нь 500 бараа</p>
          </>
        )}
      </div>

      {/* Upload button */}
      {file && (
        <button onClick={upload} disabled={loading}
          className={cn('w-full py-4 rounded-xl text-base font-extrabold text-white border-none cursor-pointer transition',
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#E8242C] hover:bg-[#c41e25]')}>
          {loading ? 'Байршуулж байна...' : 'Upload хийх'}
        </button>
      )}

      {/* Results */}
      {result && (
        <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-5 space-y-4">
          <h3 className="text-base font-bold text-[var(--esl-text-primary)]">Үр дүн</h3>

          <div className="grid grid-cols-2 gap-3">
            {[
              { Icon: CheckCircle, label: 'Амжилттай', value: result.success, color: 'text-green-600' },
              { Icon: XCircle, label: 'Алдаатай', value: result.failed, color: 'text-red-600' },
            ].map((s, i) => (
              <div key={i} className="bg-[var(--esl-bg-section)] rounded-xl border border-[var(--esl-border)] p-4 text-center">
                <s.Icon size={24} className={cn('mx-auto mb-2', s.color)} />
                <p className={cn('text-3xl font-black', s.color)}>{s.value}</p>
                <p className="text-xs text-[var(--esl-text-muted)] mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {result.errors?.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-1">
              <p className="text-sm font-semibold text-red-600 mb-1">Алдаанууд:</p>
              {result.errors.slice(0, 10).map((e: string, i: number) => (
                <p key={i} className="text-xs text-red-600">&bull; {e}</p>
              ))}
            </div>
          )}

          {result.success > 0 && (
            <Link href="/dashboard/store/products"
              className="block text-center bg-green-600 text-white rounded-xl py-3 font-bold text-sm no-underline hover:bg-green-700 transition">
              Барааны жагсаалт харах →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
