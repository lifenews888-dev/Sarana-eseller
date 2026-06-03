/**
 * Dropship Cron Job — run daily at 06:00
 * Usage: npx tsx scripts/dropship-cron.ts
 *
 * Tasks:
 * 1. Auto-fulfill new dropship orders
 * 2. Update tracking for shipped orders
 * 3. Release escrow for delivered orders
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type OrderItem = {
  id?: string;
  productId?: string;
};

async function main() {
  console.log('[DROPSHIP CRON] Starting at', new Date().toISOString());

  // 1. Auto-fulfill pending dropship orders
  const pendingOrders = await prisma.order.findMany({
    where: {
      status: 'confirmed',
      dropshipOrder: null,
    },
    include: { dropshipOrder: true },
    take: 50,
  });

  for (const order of pendingOrders) {
    const items = Array.isArray(order.items) ? (order.items as OrderItem[]) : [];
    let hasDropship = false;

    for (const item of items) {
      const productId = item.productId || item.id;
      if (!productId) continue;
      const ds = await prisma.dropshipProduct.findFirst({
        where: { productId, autoSync: true },
      });
      if (ds) {
        hasDropship = true;
        break;
      }
    }

    if (hasDropship) {
      console.log(`[FULFILL] Order ${order.id.slice(-6)} — creating dropship order`);
      await prisma.dropshipOrder.create({
        data: {
          orderId: order.id,
          status: 'PENDING',
        },
      });
    }
  }

  // 2. Update tracking for ORDERED items
  const orderedItems = await prisma.dropshipOrder.findMany({
    where: { status: { in: ['ORDERED', 'SHIPPED'] } },
    take: 100,
  });

  console.log(`[TRACKING] Checking ${orderedItems.length} orders`);

  // In production, call getCJTracking() for each

  // 3. Release escrow for delivered dropship orders
  const deliveredOrders = await prisma.dropshipOrder.findMany({
    where: { status: 'DELIVERED' },
    include: { order: true },
    take: 50,
  });

  for (const dso of deliveredOrders) {
    if (dso.order.escrowStatus === 'HOLDING') {
      console.log(`[ESCROW] Releasing for order ${dso.orderId.slice(-6)}`);
      await prisma.order.update({
        where: { id: dso.orderId },
        data: { status: 'delivered', escrowStatus: 'RELEASED' },
      });
    }
  }

  console.log('[DROPSHIP CRON] Done');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
