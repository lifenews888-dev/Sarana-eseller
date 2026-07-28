'use client';

export default function ProductCardSkeleton() {
  return (
    <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] overflow-hidden">
      <div className="h-48 bg-[var(--esl-bg-section)] animate-pulse" />
      <div className="p-4 space-y-2.5">
        <div className="h-3 bg-[var(--esl-bg-section)] rounded-full w-1/3 animate-pulse" />
        <div className="h-4 bg-[var(--esl-bg-section)] rounded-full w-4/5 animate-pulse" />
        <div className="h-3 bg-[var(--esl-bg-section)] rounded-full w-1/2 animate-pulse" />
        <div className="h-5 bg-[var(--esl-bg-section)] rounded-full w-2/5 animate-pulse" />
      </div>
    </div>
  );
}

export function ModalSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-64 bg-[var(--esl-bg-section)] rounded-t-2xl" />
      <div className="p-6 space-y-3">
        <div className="h-3 bg-[var(--esl-bg-section)] rounded-full w-1/4" />
        <div className="h-6 bg-[var(--esl-bg-section)] rounded-full w-3/4" />
        <div className="h-4 bg-[var(--esl-bg-section)] rounded-full w-1/3" />
        <div className="h-8 bg-[var(--esl-bg-section)] rounded-full w-1/2" />
        <div className="space-y-2 pt-4">
          <div className="h-3 bg-[var(--esl-bg-section)] rounded-full w-full" />
          <div className="h-3 bg-[var(--esl-bg-section)] rounded-full w-5/6" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-[var(--esl-bg-section)] rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-[var(--esl-bg-section)] rounded-2xl" />
      <div className="h-48 bg-[var(--esl-bg-section)] rounded-2xl" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] overflow-hidden animate-pulse">
      <div className="h-10 bg-[var(--esl-bg-section)] border-b border-[var(--esl-border)]" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-gray-50">
          <div className="w-8 h-8 bg-[var(--esl-bg-section)] rounded-lg shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-[var(--esl-bg-section)] rounded-full w-1/3" />
            <div className="h-2 bg-[var(--esl-bg-section)] rounded-full w-1/5" />
          </div>
          <div className="h-3 bg-[var(--esl-bg-section)] rounded-full w-16" />
        </div>
      ))}
    </div>
  );
}
