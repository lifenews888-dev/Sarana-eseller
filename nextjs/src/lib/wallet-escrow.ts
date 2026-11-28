/**
 * Хэтэвчийн туслах функц. Дундын дансны (escrow) урсгал бүхэлдээ @/lib/escrow-д байна.
 * Wallet { balance, pending, escrowHold, history: Json[] }.
 */
import { prisma } from '@/lib/prisma';

export interface WalletHistoryEntry {
  type: 'TOPUP' | 'ESCROW_HOLD' | 'ESCROW_RELEASE' | 'ESCROW_REFUND' | 'PAYOUT' | 'POINTS_REDEEM' | 'CASHBACK';
  amount: number;
  orderId?: string;
  reference?: string;
  description?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  method?: string;
  createdAt: string;
}

/** Get or create wallet for a user */
export async function getOrCreateWallet(userId: string) {
  return prisma.wallet.upsert({
    where: { userId },
    create: { userId, balance: 0, pending: 0, escrowHold: 0, history: [] },
    update: {},
  });
}
