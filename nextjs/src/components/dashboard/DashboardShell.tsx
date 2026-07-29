'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Page container — matches buyer hub max width / spacing */
export function DashboardPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('mx-auto max-w-6xl', className)}>{children}</div>;
}

export function DashboardHeader({
  badge,
  title,
  subtitle,
  actions,
}: {
  badge: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] sm:mb-6">
      <div className="relative px-4 py-5 sm:px-6 sm:py-6">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-40"
          style={{
            background: 'radial-gradient(ellipse at 100% 0%, rgba(232,36,44,0.12), transparent 60%)',
          }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--esl-text-muted)]">
              {badge}
            </p>
            <h1 className="text-xl font-black tracking-tight text-[var(--esl-text-primary)] sm:text-2xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-[var(--esl-text-secondary)]">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

export type StatTone = 'primary' | 'info' | 'warning' | 'success' | 'neutral';

const STAT_TONE: Record<StatTone, string> = {
  primary: 'bg-[rgba(232,36,44,0.12)] text-[#E8242C]',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  neutral: 'bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)]',
};

export function DashboardStatGrid({
  items,
  cols = 4,
}: {
  items: {
    icon: LucideIcon | React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    value: string | number;
    sub?: string;
    tone?: StatTone;
  }[];
  cols?: 2 | 3 | 4 | 6;
}) {
  const colClass =
    cols === 6
      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
      : cols === 3
        ? 'grid-cols-1 sm:grid-cols-3'
        : cols === 2
          ? 'grid-cols-1 sm:grid-cols-2'
          : 'grid-cols-2 lg:grid-cols-4';

  return (
    <div className={cn('mb-5 grid gap-3 sm:mb-6 sm:gap-4', colClass)}>
      {items.map((s) => {
        const Icon = s.icon;
        const tone = s.tone || 'primary';
        return (
          <div
            key={s.label}
            className="rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-4 sm:p-5"
          >
            <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl', STAT_TONE[tone])}>
              <Icon size={20} />
            </div>
            <p className="text-xl font-black text-[var(--esl-text-primary)] sm:text-2xl">
              {typeof s.value === 'number' ? s.value.toLocaleString('mn-MN') : s.value}
            </p>
            <p className="mt-0.5 text-xs font-medium text-[var(--esl-text-muted)] sm:text-sm">{s.label}</p>
            {s.sub && <p className="mt-0.5 text-[11px] text-[var(--esl-text-muted)]">{s.sub}</p>}
          </div>
        );
      })}
    </div>
  );
}

export function DashboardQuickLinks({
  items,
}: {
  items: {
    href: string;
    icon: LucideIcon | React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    desc?: string;
    color: string;
    onClick?: () => void;
  }[];
}) {
  const cols =
    items.length >= 6
      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
      : items.length === 5
        ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
        : 'grid-cols-2 sm:grid-cols-4';

  return (
    <div className={cn('mb-5 grid gap-2.5 sm:mb-6', cols)}>
      {items.map((item) => {
        const Icon = item.icon;
        const className =
          'group flex flex-col gap-2 rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-3.5 no-underline transition hover:-translate-y-0.5 hover:border-[#E8242C]/35 hover:shadow-md text-left cursor-pointer';
        const body = (
          <>
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
              style={{ background: item.color }}
            >
              <Icon size={18} />
            </span>
            <div>
              <p className="text-sm font-bold text-[var(--esl-text-primary)] group-hover:text-[#E8242C]">
                {item.label}
              </p>
              {item.desc && <p className="text-[11px] text-[var(--esl-text-muted)]">{item.desc}</p>}
            </div>
          </>
        );
        if (item.onClick) {
          return (
            <button key={item.label} type="button" onClick={item.onClick} className={className}>
              {body}
            </button>
          );
        }
        return (
          <Link key={item.href + item.label} href={item.href} className={className}>
            {body}
          </Link>
        );
      })}
    </div>
  );
}

export function DashboardPanel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)]', className)}>
      <div className="flex items-center justify-between border-b border-[var(--esl-border)] px-4 py-3.5 sm:px-5">
        <h2 className="text-sm font-bold text-[var(--esl-text-primary)]">{title}</h2>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

export function DashboardPrimaryButton({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#E8242C] px-4 text-sm font-bold text-white no-underline shadow-sm transition hover:bg-[#C41E25]',
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function DashboardSecondaryButton({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-section)] px-4 text-sm font-bold text-[var(--esl-text-primary)] no-underline transition hover:border-[#E8242C]/40',
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Өглөөний мэнд';
  if (h < 18) return 'Өдрийн мэнд';
  return 'Оройн мэнд';
}
