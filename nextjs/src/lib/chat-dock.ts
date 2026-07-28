/**
 * Shared floating chat dock helpers.
 * Positions both FABs above MobileNav so bottom tabs stay fully tappable.
 *
 * MobileNav: h-14 (3.5rem) + safe-area, z-[9999]
 * Support FAB (red): lower slot
 * AI Shopper FAB (violet): upper slot
 * Panels: above the 2-FAB stack; z below MobileNav
 */

export type ChatDockId = 'support' | 'shopper';

/** Custom event: opening one widget closes the other */
export const CHAT_DOCK_OPEN_EVENT = 'esl:chat-dock-open';

export function announceChatDockOpen(id: ChatDockId) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CHAT_DOCK_OPEN_EVENT, { detail: { id } }));
}
