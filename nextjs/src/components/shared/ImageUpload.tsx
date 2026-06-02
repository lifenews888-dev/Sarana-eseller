'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { isValidPublicImageUrl } from '@/lib/image-url';

interface Props {
  value?: string;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  label?: string;
  hint?: string;
  maxSizeMB?: number;
  className?: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function ImageUpload({ value, onUpload, onRemove, label, hint, maxSizeMB = 5, className }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    setError('');

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Зөвхөн JPG, PNG, WEBP зураг оруулна уу');
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Файл ${maxSizeMB}MB-аас бага байх ёстой`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Upload амжилтгүй');
      if (!isValidPublicImageUrl(data.url)) throw new Error('Upload did not return a public URL');
      onUpload(data.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }, [maxSizeMB, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }, [upload]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = '';
  };

  // Has image — show preview
  if (value) {
    return (
      <div className={className}>
        {label && <p className="text-xs font-semibold text-[var(--esl-text-secondary)] mb-1.5">{label}</p>}
        <div className="relative inline-block rounded-xl overflow-hidden border border-[var(--esl-border)]">
          <img src={value} alt="" className="w-full max-w-[200px] h-auto object-cover" />
          {onRemove && (
            <button
              onClick={onRemove}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center border-none cursor-pointer hover:bg-black/80 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {label && <p className="text-xs font-semibold text-[var(--esl-text-secondary)] mb-1.5">{label}</p>}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-[#E8242C] bg-[rgba(232,36,44,0.04)]' : 'border-[var(--esl-border)] hover:border-[var(--esl-text-muted)]'
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-[#E8242C] animate-spin" />
            <p className="text-sm text-[var(--esl-text-muted)]">Байршуулж байна...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-[var(--esl-text-muted)]" />
            <p className="text-sm text-[var(--esl-text-secondary)]">Зураг чирж оруулах эсвэл сонгох</p>
            {hint && <p className="text-[10px] text-[var(--esl-text-muted)]">{hint}</p>}
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
      </div>
      {error && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </div>
      )}
    </div>
  );
}
