/**
 * P0 marketplace surface repair (store / feed / shops data)
 *
 * 1. Set isDemo=false on products where field is missing (Mongo unset ≠ false)
 * 2. Swap inverted salePrice pairs
 * 3. Soft-hide feed items with mojibake titles or absurd low prices
 * 4. Report shop logo / inventory gaps
 *
 * Usage:
 *   npx tsx scripts/fix-marketplace-surfaces.ts --dry-run
 *   npx tsx scripts/fix-marketplace-surfaces.ts --apply
 */
import { PrismaClient } from '@prisma/client';
import {
  PUBLIC_PRODUCT_MIN_PRICE,
  hasInvertedSalePrice,
} from '../src/lib/product-visibility';
import { looksLikeMojibake } from '../src/lib/text-quality';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

async function main() {
  console.log(`fix-marketplace-surfaces  apply=${APPLY}`);

  // --- 1) Products: isDemo unset → false ---
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      price: true,
      salePrice: true,
      isDemo: true,
      images: true,
      isActive: true,
    },
  });

  let isDemoFixed = 0;
  let invertedFixed = 0;
  for (const product of products) {
    // Prisma returns default false for missing isDemo, so detect via raw count later.
    if (hasInvertedSalePrice(product)) {
      invertedFixed++;
      const list = product.salePrice as number;
      const sale = product.price;
      console.log(`  INVERT ${product.id} ${product.name?.slice(0, 28)} ${product.price}->${list} sale ${product.salePrice}->${sale}`);
      if (APPLY) {
        await prisma.product.update({
          where: { id: product.id },
          data: { price: list, salePrice: sale },
        });
      }
    }
  }

  // Explicitly set isDemo:false for Mongo docs missing the field
  try {
    const missingDemo = await prisma.$runCommandRaw({
      count: 'products',
      query: { isDemo: { $exists: false } },
    }) as { n?: number };
    const missingN = Number(missingDemo?.n || 0);
    console.log(`products missing isDemo field: ${missingN}`);
    if (APPLY && missingN > 0) {
      const result = await prisma.$runCommandRaw({
        update: 'products',
        updates: [
          {
            q: { isDemo: { $exists: false } },
            u: { $set: { isDemo: false } },
            multi: true,
          },
        ],
      }) as { nModified?: number; n?: number };
      isDemoFixed = Number(result?.nModified ?? result?.n ?? missingN);
      console.log(`  set isDemo=false on ~${isDemoFixed} products`);
    }
  } catch (e) {
    console.warn('isDemo raw update skipped:', (e as Error).message);
  }

  // --- 2) Feed: mojibake / low price → status=hidden ---
  const feedItems = await prisma.feedItem.findMany({
    select: { id: true, title: true, description: true, price: true, status: true, images: true },
    take: 500,
    orderBy: { createdAt: 'desc' },
  });

  let feedHidden = 0;
  for (const item of feedItems) {
    const badText = looksLikeMojibake(item.title) || looksLikeMojibake(item.description);
    const badPrice = typeof item.price === 'number' && item.price > 0 && item.price < PUBLIC_PRODUCT_MIN_PRICE;
    if (!badText && !badPrice) continue;
    if (item.status === 'hidden' || item.status === 'removed') continue;
    feedHidden++;
    console.log(
      `  FEED_HIDE ${item.id} price=${item.price} title=${JSON.stringify((item.title || '').slice(0, 40))} reasons=${[
        badText ? 'mojibake' : '',
        badPrice ? 'low_price' : '',
      ]
        .filter(Boolean)
        .join(',')}`,
    );
    if (APPLY) {
      await prisma.feedItem.update({
        where: { id: item.id },
        data: { status: 'hidden' },
      });
    }
  }

  // --- 3) Shops inventory report ---
  const shops = await prisma.shop.findMany({
    where: { isBlocked: false },
    select: { id: true, name: true, slug: true, logo: true, userId: true, isDemo: true },
    take: 200,
  });
  let noLogo = 0;
  let zeroProducts = 0;
  for (const shop of shops) {
    const productCount = await prisma.product.count({
      where: {
        isActive: true,
        OR: [{ shopId: shop.id }, { userId: shop.userId }],
      },
    });
    if (!shop.logo) noLogo++;
    if (productCount === 0) zeroProducts++;
  }

  console.log('\n--- Summary ---');
  console.log(`products scanned: ${products.length}`);
  console.log(`inverted salePrice: ${invertedFixed}${APPLY ? ' (fixed)' : ' (dry-run)'}`);
  console.log(`isDemo field backfill: ${isDemoFixed}${APPLY ? ' (applied)' : ' (pending --apply)'}`);
  console.log(`feed hide candidates: ${feedHidden}${APPLY ? ' (hidden)' : ' (dry-run)'}`);
  console.log(`shops: ${shops.length}, no logo: ${noLogo}, zero products: ${zeroProducts}`);
  console.log(APPLY ? 'DONE applied' : 'DONE dry-run — re-run with --apply');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
