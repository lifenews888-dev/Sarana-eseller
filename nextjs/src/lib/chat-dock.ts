/**
 * Legacy dual-FAB dock helpers kept as no-ops so old imports don't break.
 * UI now uses a single EsellerAssistant widget.
 */

export type ChatDockId = 'support' | 'shopper' | 'unified';

export const CHAT_DOCK_OPEN_EVENT = 'esl:chat-dock-open';

export function announceChatDockOpen(_id: ChatDockId) {
  // no-op: single assistant owns the dock
}
