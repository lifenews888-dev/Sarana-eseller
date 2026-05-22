'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, Video, Globe, FileImage } from 'lucide-react';
import { ENTITY_CARD_CONFIG, type EntityType } from '@/lib/cards/entityCardConfig';

interface Props {
  context: 'product' | 'banner' | 'profile' | 'chat';
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  label?: string;
  entityType?: EntityType;
  videoUrl?: string;
  onVideoChange?: (url: string) => void;
  virtualTourUrl?: string;
  onVirtualTourChange?: (url: string) => void;
  floorPlanUrl?: string;
  onFloorPlanChange?: (url: string) => void;
}

export function MediaUploader({ context, value, onChange, maxFiles = 5, label, entityType, videoUrl, onVideoChange, virtualTourUrl, onVirtualTourChange, floorPlanUrl, onFloorPlanChange }: Props) {
  const config = entityType ? ENTITY_CARD_CONFIG[entityType] : null;
  const effectiveMax = config ? config.maxImages : maxFiles;
  const hasVideo = config ? config.mediaTypes.includes('VIDEO') : false;
  const hasVirtualTour = config ? config.mediaTypes.includes('VIRTUAL_TOUR') : false;
  const hasFloorPlan = config ? config.mediaTypes.includes('FLOOR_PLAN') : false;
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('context', context);

    const token = localStorage.getItem('token');
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    return data.url as string;
  }, [context]);

  const handleFiles = useCallback(async (files: FileList) => {
    const remaining = effectiveMax - value.length;
    if (remaining <= 0) return;

    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);

    try {
      const urls = await Promise.all(toUpload.map(uploadFile));
      onChange([...value, ...urls.filter(Boolean)]);
    } catch {}
    finally { setUploading(false); }
  }, [value, effectiveMax, onChange, uploadFile]);

  const removeFile = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  return (
    <div>
      {label && <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#A0A0A0', marginBottom: 6 }}>{label}</span>}

      {/* Preview grid */}
      {value.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {value.map((url, i) => (
            <div key={i} style={{
              width: 80, height: 80, borderRadius: 8, overflow: 'hidden',
              position: 'relative', border: '0.5px solid #2A2A2A',
            }}>
              <img loading="lazy" src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={() => removeFile(i)} style={{
                position: 'absolute', top: 2, right: 2,
                width: 20, height: 20, borderRadius: '50%',
                background: 'rgba(0,0,0,0.7)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#FFF',
              }}>
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {value.length < effectiveMax && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `1.5px dashed ${dragOver ? '#E8242C' : '#3D3D3D'}`,
            borderRadius: 10, padding: '20px 16px',
            textAlign: 'center', cursor: 'pointer',
            background: dragOver ? 'rgba(232,36,44,0.04)' : 'var(--esl-bg-card)',
            transition: 'all 0.15s',
          }}
        >
          {uploading ? (
            <Loader2 size={24} color="#E8242C" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 6px' }} />
          ) : (
            <Upload size={24} color="#555" style={{ margin: '0 auto 6px' }} />
          )}
          <p style={{ fontSize: 12, fontWeight: 500, color: uploading ? '#E8242C' : '#777' }}>
            {uploading ? 'Байршуулж байна...' : 'Зураг чирж оруулах эсвэл сонгох'}
          </p>
          <p style={{ fontSize: 10, color: '#555', marginTop: 2 }}>
            PNG, JPG, WebP · {value.length}/{maxFiles}
          </p>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" multiple hidden
        onChange={e => { if (e.target.files) handleFiles(e.target.files); }}
      />

      {/* Entity-specific media inputs */}
      {hasVideo && onVideoChange && (
        <div style={{ marginTop: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#A0A0A0', marginBottom: 4 }}>
            <Video size={14} /> Видео (хамгийн ихдээ 2 мин)
          </span>
          <input
            placeholder="Видео URL (Cloudinary/YouTube)"
            value={videoUrl || ''}
            onChange={(e) => onVideoChange(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              border: '0.5px solid #3D3D3D', background: 'var(--esl-bg-card)',
              fontSize: 12, color: 'var(--esl-text)',
            }}
          />
        </div>
      )}

      {hasVirtualTour && onVirtualTourChange && (
        <div style={{ marginTop: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#A0A0A0', marginBottom: 4 }}>
            <Globe size={14} /> 360° Виртуал тойрог
          </span>
          <input
            placeholder="YouTube/Matterport URL"
            value={virtualTourUrl || ''}
            onChange={(e) => onVirtualTourChange(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              border: '0.5px solid #3D3D3D', background: 'var(--esl-bg-card)',
              fontSize: 12, color: 'var(--esl-text)',
            }}
          />
        </div>
      )}

      {hasFloorPlan && onFloorPlanChange && (
        <div style={{ marginTop: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#A0A0A0', marginBottom: 4 }}>
            <FileImage size={14} /> Байрны зураглал (Floor plan)
          </span>
          <input
            placeholder="Байрны зураглалын URL"
            value={floorPlanUrl || ''}
            onChange={(e) => onFloorPlanChange(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              border: '0.5px solid #3D3D3D', background: 'var(--esl-bg-card)',
              fontSize: 12, color: 'var(--esl-text)',
            }}
          />
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
