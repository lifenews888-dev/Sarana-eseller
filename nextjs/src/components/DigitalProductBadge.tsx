'use client';

import { Download, FileText, Archive, Video, FileSpreadsheet, File } from 'lucide-react';

const FILE_TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  pdf:  { icon: FileText,        label: 'PDF',  color: 'text-red-500' },
  zip:  { icon: Archive,         label: 'ZIP',  color: 'text-yellow-600' },
  mp4:  { icon: Video,           label: 'MP4',  color: 'text-purple-500' },
  xlsx: { icon: FileSpreadsheet, label: 'XLSX', color: 'text-green-600' },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

interface DigitalProductBadgeProps {
  fileType: string;
  fileSize: number;
}

export default function DigitalProductBadge({ fileType, fileSize }: DigitalProductBadgeProps) {
  const config = FILE_TYPE_CONFIG[fileType.toLowerCase()] || {
    icon: File,
    label: fileType.toUpperCase(),
    color: 'text-[var(--esl-text-secondary)]',
  };
  const Icon = config.icon;

  return (
    <div className="inline-flex flex-col gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">
      <div className="flex items-center gap-2">
        <Download className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-700">Дижитал бараа</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-[var(--esl-text-secondary)]">
        <Icon className={`h-3.5 w-3.5 ${config.color}`} />
        <span>{config.label}</span>
        <span className="text-[var(--esl-text-muted)]">|</span>
        <span>{formatFileSize(fileSize)}</span>
      </div>
      <p className="text-[11px] text-[var(--esl-text-secondary)]">
        Худалдан авсны дараа шууд татна
      </p>
    </div>
  );
}
