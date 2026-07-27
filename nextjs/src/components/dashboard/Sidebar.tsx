'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getInitials } from '@/lib/utils';
import {
  LayoutDashboard, ShoppingCart, Package, FolderTree, Tag,
  BarChart3, Users, Gift, CreditCard, Star, PenSquare,
  Megaphone, Palette, Sparkles, Brain, Bot, Wallet,
  Globe, Building2, UserCog, Settings, Bell, ScrollText,
  ChevronDown, ExternalLink, LogOut, Crown, Zap,
  CalendarDays, Clock, Shield, Link2, Layers,
  MapPin, BookOpen, PlusCircle, Map, MailOpen, User,
  Construction, Image, FileText, Folder, Download, KeyRound,
  Heart, Home, Car, MessageSquare, Truck, ClipboardList,
} from 'lucide-react';
import { ThemeSelector } from '@/components/ui/ThemeToggle';

// ═══ Icon Map ═══
const ICON_MAP: Record<string, React.ElementType> = {
  '📊': LayoutDashboard, '📋': ClipboardList, '📦': Package, '📂': FolderTree,
  '🏷️': Tag, '👥': Users, '🎁': Gift, '💳': CreditCard,
  '⭐': Star, '📝': PenSquare, '📢': Megaphone, '🎨': Palette,
  '✨': Sparkles, '🤖': Bot, '💰': Wallet, '💵': Wallet,
  '🌐': Globe, '🏪': Building2, '👔': UserCog, '⚙️': Settings,
  '🔔': Bell, '👑': Crown, '📈': BarChart3, '🤝': Users,
  '⚠️': Bell, '🧾': ScrollText, '💬': MessageSquare,
  '🛎️': Bell, '📅': CalendarDays, '🕐': Clock, '🛡️': Shield,
  '🛍️': ShoppingCart, '🔗': Link2, '🎭': Layers,
  '📍': MapPin, '📖': BookOpen, '➕': PlusCircle, '🗺️': Map,
  '📩': MailOpen, '👤': User, '🏗️': Construction, '🖼️': Image,
  '📄': FileText, '🧠': Brain, '🚗': Car, '📁': Folder,
  '⬇️': Download, '🔑': KeyRound, '❤️': Heart, '🛒': ShoppingCart,
  '🏠': Home, '🚚': Truck,
};

// ═══ Types ═══
export interface SidebarItem {
  href: string;
  icon: string;
  label: string;
  badge?: string | number;
  external?: boolean;
  isNew?: boolean;
}

export interface SidebarSection {
  title: string;
  collapsed?: boolean;
  items: SidebarItem[];
}

interface SidebarProps {
  sections: SidebarSection[];
  storeInfo?: {
    id?: string;
    name: string;
    url?: string;
    plan?: string;
    planBadge?: string;
    entityType?: string;
    href?: string;
  };
  stores?: {
    id: string;
    name: string;
    slug: string;
    entityType: string;
    storeType: string;
    href: string;
  }[];
  activeStoreId?: string | null;
  onStoreChange?: (storeId: string) => void;
}

export default function Sidebar({ sections, storeInfo, stores = [], activeStoreId, onStoreChange }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(() => (
    typeof window !== 'undefined' && localStorage.getItem('sb-collapsed') === 'true'
  ));
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sb-collapsed', String(next));
  };

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[var(--esl-bg-section)] flex flex-col transition-all duration-200 z-50 ${
        collapsed ? 'w-[68px]' : 'w-[260px]'
      }`}
      style={{ borderRight: '1px solid var(--esl-border)' }}
    >
      {/* ═══ Logo ═══ */}
      <div className={`flex items-center h-[56px] border-b border-[var(--esl-border)] shrink-0 ${collapsed ? 'justify-center px-3' : 'px-5'}`}>
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E8242C] to-[#C41E25] flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-[15px] font-bold text-white tracking-tight">
              eseller<span className="text-[#E8242C]">.mn</span>
            </span>
          )}
        </Link>
      </div>

      {/* ═══ Store Info ═══ */}
      {storeInfo && !collapsed && (
        <div className="px-4 py-3 border-b border-[var(--esl-border)]">
          <div className="mb-2">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--esl-text-disabled)]">
              Дэлгүүр сонгох
            </label>
            <select
              value={activeStoreId || storeInfo.id || ''}
              onChange={(event) => onStoreChange?.(event.target.value)}
              disabled={stores.length === 0}
              className="h-9 w-full rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-2 text-[12px] font-semibold text-[var(--esl-text-secondary)] outline-none disabled:opacity-70"
            >
              {stores.length > 0 ? stores.map((store) => (
                <option key={`${store.entityType}:${store.id}`} value={store.id}>
                  {store.name}
                </option>
              )) : (
                <option value={storeInfo.id || ''}>{storeInfo.name}</option>
              )}
            </select>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E8242C] to-[#FF4D53] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
              {getInitials(storeInfo.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-[var(--esl-text-secondary)] truncate leading-tight">{storeInfo.name}</div>
              {storeInfo.url && (
                <div className="text-[11px] text-[var(--esl-text-disabled)] truncate leading-tight mt-0.5">{storeInfo.url}</div>
              )}
            </div>
            <Link
              href={storeInfo.href || '/store'}
              target="_blank"
              className="w-6 h-6 rounded-md bg-[var(--esl-bg-card)] hover:bg-[rgba(232,36,44,0.12)] flex items-center justify-center text-[var(--esl-text-disabled)] hover:text-[#E8242C] transition-colors no-underline"
            >
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          {storeInfo.plan && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1 bg-[var(--esl-bg-elevated)] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: '100%' }} />
              </div>
              <span className="text-[10px] font-semibold text-[#E8242C] bg-[rgba(232,36,44,0.12)] px-1.5 py-0.5 rounded">
                {storeInfo.planBadge || storeInfo.plan}
              </span>
            </div>
          )}
          <Link
            href="/become-seller?intent=create-store"
            className="mt-2 flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-card)] text-[11px] font-semibold text-[var(--esl-text-muted)] no-underline hover:border-[#E8242C] hover:text-[#E8242C]"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Шинэ дэлгүүр нэмэх
          </Link>
        </div>
      )}

      {/* ═══ Menu ═══ */}
      <nav className="flex-1 overflow-y-auto py-2 px-2.5">
        {sections.map((section, si) => {
          const isCollapsed = collapsedSections[section.title];
          return (
            <div key={section.title} className={si > 0 ? 'mt-1' : ''}>
              {/* Section Header */}
              {!collapsed && (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 mt-1 mb-0.5 cursor-pointer bg-transparent border-none group"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--esl-text-disabled)] group-hover:text-[var(--esl-text-muted)] transition-colors">
                    {section.title}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-[var(--esl-border)] transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
                </button>
              )}

              {/* Items */}
              {!isCollapsed && section.items.map((item) => {
                const isActive = pathname === item.href;
                const IconComponent = ICON_MAP[item.icon] || Package;

                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    className={`group flex items-center gap-2.5 h-9 rounded-lg text-[13px] no-underline transition-all duration-150 mb-px ${
                      collapsed ? 'justify-center px-0 mx-0.5' : 'px-2.5'
                    } ${
                      isActive
                        ? 'bg-[rgba(232,36,44,0.08)] text-[#E8242C] font-semibold border-l-[3px] border-l-[#E8242C]'
                        : 'text-[var(--esl-text-muted)] hover:bg-[var(--esl-bg-card)] hover:text-[var(--esl-text-secondary)] border-l-[3px] border-l-transparent'
                    }`}
                  >
                    <IconComponent className={`shrink-0 transition-colors duration-150 ${
                      collapsed ? 'w-[18px] h-[18px]' : 'w-4 h-4'
                    } ${
                      isActive ? 'text-[#E8242C]' : 'text-[var(--esl-text-disabled)] group-hover:text-[var(--esl-text-muted)]'
                    }`} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge !== undefined && (
                          <span className={`text-[10px] font-semibold px-1.5 py-px rounded-md leading-tight ${
                            typeof item.badge === 'number' && item.badge > 0
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-[var(--esl-bg-elevated)] text-[var(--esl-text-disabled)]'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        {item.isNew && (
                          <span className="text-[9px] font-bold bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-1.5 py-px rounded uppercase">
                            new
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}

              {/* Section divider */}
              {si < sections.length - 1 && !collapsed && (
                <div className="mx-3 mt-1 border-b border-slate-100" />
              )}
            </div>
          );
        })}
      </nav>

      {/* ═══ Upgrade CTA ═══ */}
      {!collapsed && storeInfo?.plan === 'Үнэгүй' && (
        <div className="mx-3 mb-2">
          <Link
            href="/dashboard/store/package"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#E8242C] to-[#C41E25] text-white text-[12px] font-semibold no-underline shadow-sm hover:shadow-md hover:from-indigo-700 hover:to-violet-700 transition-all"
          >
            <Crown className="w-3.5 h-3.5" />
            Багц шинэчлэх
          </Link>
        </div>
      )}

      {/* ═══ User ═══ */}
      <div className="border-t border-[var(--esl-border)] p-3 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--esl-bg-elevated)] flex items-center justify-center text-[var(--esl-text-muted)] text-[11px] font-semibold shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-[var(--esl-text-secondary)] truncate leading-tight">{user?.name || '...'}</div>
              <div className="text-[10px] text-[var(--esl-text-disabled)] truncate leading-tight mt-0.5">{user?.email || ''}</div>
            </div>
            <button
              onClick={logout}
              className="w-7 h-7 rounded-md bg-transparent hover:bg-[rgba(232,36,44,0.15)] flex items-center justify-center text-[var(--esl-text-disabled)] hover:text-[#E8242C] transition-colors border-none cursor-pointer"
              title="Гарах"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="flex items-center justify-center w-full py-2 rounded-lg text-[var(--esl-text-disabled)] hover:bg-[rgba(232,36,44,0.15)] hover:text-[#E8242C] transition-colors border-none bg-transparent cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ═══ Theme Selector ═══ */}
      {!collapsed && (
        <div className="px-3 pb-3 border-t border-[var(--esl-border)] pt-3">
          <p className="text-[10px] text-[var(--esl-text-muted)] mb-2 uppercase tracking-wider px-1">Горим</p>
          <ThemeSelector />
        </div>
      )}

      {/* ═══ Collapse Toggle ═══ */}
      <button
        onClick={toggle}
        className="absolute top-4 -right-3 w-6 h-6 rounded-full bg-[var(--esl-bg-section)] border border-[var(--esl-border)] flex items-center justify-center text-[var(--esl-text-disabled)] hover:text-[#E8242C] hover:border-indigo-200 cursor-pointer text-[10px] transition-all z-50 shadow-xs"
      >
        {collapsed ? '→' : '←'}
      </button>
    </aside>
  );
}
