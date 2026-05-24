'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Building2, Eye, Image as ImageIcon, Pencil, Plus } from 'lucide-react';

interface FeedProject {
  id: string;
  title: string;
  price: number | null;
  images: string[];
  metadata?: Record<string, string | number>;
  status: string;
  district?: string | null;
}

type FeedBuckets = {
  vip?: FeedProject[];
  featured?: FeedProject[];
  discounted?: FeedProject[];
  normal?: FeedProject[];
};

function flattenFeed(data: (FeedBuckets & { data?: FeedBuckets }) | null): FeedProject[] {
  const d = data?.data || data || {};
  return [
    ...(d.vip || []),
    ...(d.featured || []),
    ...(d.discounted || []),
    ...(d.normal || []),
  ];
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<FeedProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/feed?mine=1&entityType=company&limit=50', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((payload) => setProjects(flattenFeed(payload)))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--esl-text-primary)]">Төслүүд</h1>
          <p className="text-sm text-[var(--esl-text-secondary)]">{projects.length} төсөл</p>
        </div>
        <Link
          href="/dashboard/store/listings/new?entityType=company"
          className="inline-flex items-center gap-2 rounded-xl bg-[#E8242C] px-5 py-2.5 text-sm font-bold text-white no-underline transition hover:bg-red-700"
        >
          <Plus className="h-4 w-4" /> Төсөл нэмэх
        </Link>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-[var(--esl-bg-card)]" />
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] py-20 text-center">
          <Building2 className="mx-auto mb-4 h-12 w-12 text-[var(--esl-text-muted)] opacity-30" />
          <p className="text-sm text-[var(--esl-text-muted)]">Одоогоор төсөл байхгүй байна</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {projects.map((project) => {
            const meta = project.metadata || {};
            const total = Number(meta.totalUnits) || 0;
            const sold = Number(meta.soldUnits) || 0;
            const progress = total > 0 ? Math.min(100, Math.round((sold / total) * 100)) : 0;
            return (
              <div
                key={project.id}
                className="overflow-hidden rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] transition hover:border-[#E8242C]/40"
              >
                <div className="relative aspect-[16/9] bg-[var(--esl-bg-section)]">
                  {project.images?.[0] ? (
                    <Image src={project.images[0]} alt={project.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-[var(--esl-text-disabled)]" />
                    </div>
                  )}
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="line-clamp-2 text-sm font-bold text-[var(--esl-text-primary)]">{project.title}</h3>
                      <p className="mt-1 text-xs text-[var(--esl-text-muted)]">{project.district || meta.location || 'Байршил оруулаагүй'}</p>
                    </div>
                    {meta.projectStatus && (
                      <span className="shrink-0 rounded-full bg-[#E8242C]/10 px-2 py-1 text-[10px] font-bold text-[#E8242C]">
                        {String(meta.projectStatus)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-[var(--esl-text-muted)]">
                    {meta.pricePerSqm && <span className="rounded-lg bg-[var(--esl-bg-section)] px-2 py-1">{Number(meta.pricePerSqm).toLocaleString()}₮/м²</span>}
                    {meta.completionDate && <span className="rounded-lg bg-[var(--esl-bg-section)] px-2 py-1">{String(meta.completionDate)}</span>}
                    {total > 0 && <span className="rounded-lg bg-[var(--esl-bg-section)] px-2 py-1">{sold}/{total} айл</span>}
                  </div>
                  {total > 0 && (
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--esl-bg-section)]">
                      <div className="h-full rounded-full bg-[#E8242C]" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Link href={`/feed/${project.id}`} target="_blank" className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-section)] px-3 py-2 text-xs font-bold text-[var(--esl-text-secondary)] no-underline hover:text-white">
                      <Eye className="h-3.5 w-3.5" /> Харах
                    </Link>
                    <Link href={`/dashboard/store/listings/new?entityType=company&edit=${project.id}`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-section)] px-3 py-2 text-xs font-bold text-[var(--esl-text-secondary)] no-underline hover:text-white">
                      <Pencil className="h-3.5 w-3.5" /> Засах
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
