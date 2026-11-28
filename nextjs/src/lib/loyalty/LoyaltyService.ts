import { prisma } from '@/lib/prisma';
import { LOYALTY_CONFIG, calculateTier } from './config';

export class LoyaltyService {
  /** Get or create loyalty account */
  async getOrCreate(userId: string) {
    return prisma.loyaltyAccount.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  /** Check if user has active Gold membership */
  async hasActiveGold(userId: string): Promise<boolean> {
    const m = await prisma.goldMembership.findUnique({ where: { userId } });
    return !!m && (m.status === 'ACTIVE' || m.status === 'TRIAL') && new Date(m.endsAt) > new Date();
  }

  /** Earn points */
  async earn(
    userId: string, type: string, basePoints: number,
    description: string, refType?: string, refId?: string,
  ) {
    const account = await this.getOrCreate(userId);
    const hasGold = await this.hasActiveGold(userId);
    const tierMult = LOYALTY_CONFIG.earn.tierMultipliers[account.tier] || 1;
    const goldMult = hasGold ? LOYALTY_CONFIG.earn.goldMultiplier : 1;
    const finalPoints = Math.round(basePoints * tierMult * goldMult);

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + LOYALTY_CONFIG.expiryMonths);

    const tx = await prisma.loyaltyTransaction.create({
      data: { accountId: account.id, type, points: finalPoints, description, refType, refId, expiresAt },
    });

    await prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        balance: { increment: finalPoints },
        lifetimeEarned: { increment: finalPoints },
        lastActivityAt: new Date(),
      },
    });

    // Check tier upgrade
    const updated = await prisma.loyaltyAccount.findUnique({ where: { id: account.id } });
    if (updated) {
      const newTier = calculateTier(updated.lifetimeEarned);
      if (newTier !== updated.tier) {
        await prisma.loyaltyAccount.update({
          where: { id: account.id },
          data: { tier: newTier, tierUpdatedAt: new Date() },
        });
      }
    }

    return { ...tx, finalPoints };
  }

  /** Earn from order purchase */
  async earnFromOrder(userId: string, orderId: string, amount: number) {
    const basePoints = Math.floor(amount / 100) * LOYALTY_CONFIG.earn.purchaseRate;
    return this.earn(userId, 'EARN_PURCHASE', basePoints,
      `Захиалга ${orderId} — ${amount.toLocaleString()}₮`, 'order', orderId);
  }

  /** Redeem points */
  async redeem(userId: string, points: number, type: string, orderId?: string) {
    if (typeof points !== 'number' || !Number.isInteger(points) || points <= 0) throw new Error('Оноо буруу');
    const account = await this.getOrCreate(userId);

    if (account.balance < points) throw new Error('Оноо хүрэлцэхгүй');
    if (points < LOYALTY_CONFIG.redeem.minRedeemPoints) throw new Error(`Хамгийн бага ${LOYALTY_CONFIG.redeem.minRedeemPoints} оноо`);

    const valueAmount = points * LOYALTY_CONFIG.redeem.pointValue;
    const couponCode = `PTS${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Оноог эхлээд атомаар хасна — зэрэг хүсэлт давхар зарцуулахгүй
    const taken = await prisma.loyaltyAccount.updateMany({
      where: { id: account.id, balance: { gte: points } },
      data: { balance: { decrement: points }, lifetimeSpent: { increment: points } },
    });
    if (taken.count === 0) throw new Error('Оноо хүрэлцэхгүй');

    const redemption = await prisma.loyaltyRedemption.create({
      data: { accountId: account.id, userId, type, pointsUsed: points, valueAmount, couponCode, expiresAt, orderId },
    });

    await prisma.loyaltyTransaction.create({
      data: { accountId: account.id, type: 'REDEEM_DISCOUNT', points: -points, description: `${points} оноо зарцуулав (${valueAmount.toLocaleString()}₮)` },
    });

    return redemption;
  }

  /**
   * Redeem points directly for wallet cash credit.
   * Uses LOYALTY_CONFIG.redeem.pointValue (5₮/point by default).
   * Minimum 500 points.
   */
  async redeemForCash(userId: string, points: number): Promise<number> {
    if (points < 500) {
      throw new Error('Хамгийн бага 500 оноо шаардлагатай');
    }
    const account = await this.getOrCreate(userId);
    if (account.balance < points) {
      throw new Error('Оноо хүрэлцэхгүй');
    }

    const cashAmount = points * LOYALTY_CONFIG.redeem.pointValue;

    // Decrement loyalty balance atomically (зэрэг хүсэлт давхар хасахгүй) + record transaction
    const taken = await prisma.loyaltyAccount.updateMany({
      where: { id: account.id, balance: { gte: points } },
      data: {
        balance: { decrement: points },
        lifetimeSpent: { increment: points },
      },
    });
    if (taken.count === 0) throw new Error('Оноо хүрэлцэхгүй');
    await prisma.loyaltyTransaction.create({
      data: {
        accountId: account.id,
        type: 'REDEEM_CASH',
        points: -points,
        description: `${points} оноо → ${cashAmount.toLocaleString()}₮ хэтэвч`,
      },
    });

    // Credit wallet balance + history entry
    await prisma.wallet.upsert({
      where: { userId },
      create: {
        userId,
        balance: cashAmount,
        pending: 0,
        escrowHold: 0,
        history: [
          {
            type: 'POINTS_REDEEM',
            amount: cashAmount,
            points: -points,
            description: `${points} оноо → ${cashAmount.toLocaleString()}₮`,
            status: 'COMPLETED',
            createdAt: new Date().toISOString(),
          },
        ],
      },
      update: {
        balance: { increment: cashAmount },
        history: {
          push: {
            type: 'POINTS_REDEEM',
            amount: cashAmount,
            points: -points,
            description: `${points} оноо → ${cashAmount.toLocaleString()}₮`,
            status: 'COMPLETED',
            createdAt: new Date().toISOString(),
          },
        },
      },
    });

    return cashAmount;
  }

  /** Lifetime earned points (alias for LoyaltyAccount.lifetimeEarned) */
  async getLifetimeTotal(userId: string): Promise<number> {
    const account = await prisma.loyaltyAccount.findUnique({ where: { userId } });
    return account?.lifetimeEarned ?? 0;
  }
}

export const loyaltyService = new LoyaltyService();
