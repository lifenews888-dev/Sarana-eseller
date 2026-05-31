// eseller.mn - clean local-device image URLs from DB.
//
// Mobile clients have posted Android/iOS cache paths such as
// file:///data/user/0/.../ImagePicker/... into image arrays. Browsers cannot
// render those paths, so this script removes non-public image URLs from the
// collections that store public media.
//
// Usage:
//   npm run clean:images:dry
//   CONFIRM_PRODUCTION_CLEANUP=yes npm run clean:images

import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { isValidPublicImageUrl } from '../src/lib/image-url';

const DRY_RUN = process.argv.includes('--dry-run');
const CONFIRMED = process.env.CONFIRM_PRODUCTION_CLEANUP === 'yes';

type Stat = { scanned: number; updated: number; totalBadUrls: number };

function cleanList(urls: unknown): { cleaned: string[]; removed: number } {
  if (!Array.isArray(urls)) return { cleaned: [], removed: 0 };
  const cleaned: string[] = [];
  let removed = 0;

  for (const url of urls) {
    if (isValidPublicImageUrl(url)) cleaned.push(url as string);
    else removed++;
  }

  return { cleaned, removed };
}

async function cleanProducts(stat: Stat) {
  const items = await prisma.product.findMany({ select: { id: true, images: true } });
  stat.scanned += items.length;

  for (const product of items) {
    const { cleaned, removed } = cleanList(product.images);
    if (removed === 0) continue;

    stat.updated++;
    stat.totalBadUrls += removed;
    console.log(`  product ${product.id}: ${removed} bad URL${removed > 1 ? 's' : ''} -> ${cleaned.length} kept`);

    if (!DRY_RUN) {
      await prisma.product.update({ where: { id: product.id }, data: { images: cleaned } });
    }
  }
}

async function cleanServices(stat: Stat) {
  const items = await prisma.service.findMany({ select: { id: true, images: true } });
  stat.scanned += items.length;

  for (const service of items) {
    const { cleaned, removed } = cleanList(service.images);
    if (removed === 0) continue;

    stat.updated++;
    stat.totalBadUrls += removed;
    console.log(`  service ${service.id}: ${removed} bad URL${removed > 1 ? 's' : ''} -> ${cleaned.length} kept`);

    if (!DRY_RUN) {
      await prisma.service.update({ where: { id: service.id }, data: { images: cleaned } });
    }
  }
}

async function cleanFeedItems(stat: Stat) {
  const items = await prisma.feedItem.findMany({ select: { id: true, images: true } });
  stat.scanned += items.length;

  for (const feedItem of items) {
    const { cleaned, removed } = cleanList(feedItem.images);
    if (removed === 0) continue;

    stat.updated++;
    stat.totalBadUrls += removed;
    console.log(`  feedItem ${feedItem.id}: ${removed} bad URL${removed > 1 ? 's' : ''} -> ${cleaned.length} kept`);

    if (!DRY_RUN) {
      await prisma.feedItem.update({ where: { id: feedItem.id }, data: { images: cleaned } });
    }
  }
}

async function cleanPreOrders(stat: Stat) {
  const items = await prisma.preOrderProduct.findMany({ select: { id: true, images: true } });
  stat.scanned += items.length;

  for (const preOrder of items) {
    const { cleaned, removed } = cleanList(preOrder.images);
    if (removed === 0) continue;

    stat.updated++;
    stat.totalBadUrls += removed;
    console.log(`  preOrder ${preOrder.id}: ${removed} bad URL${removed > 1 ? 's' : ''} -> ${cleaned.length} kept`);

    if (!DRY_RUN) {
      await prisma.preOrderProduct.update({ where: { id: preOrder.id }, data: { images: cleaned } });
    }
  }
}

async function main() {
  if (!DRY_RUN && !CONFIRMED) {
    console.error('Refusing to run live image cleanup without CONFIRM_PRODUCTION_CLEANUP=yes.');
    console.error('Run dry-run first: npm run clean:images:dry');
    process.exit(1);
  }

  console.log(`Image URL cleanup - ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log('');

  const stat: Stat = { scanned: 0, updated: 0, totalBadUrls: 0 };

  console.log('Products:');
  await cleanProducts(stat);

  console.log('\nServices:');
  await cleanServices(stat);

  console.log('\nFeedItems:');
  await cleanFeedItems(stat);

  console.log('\nPreOrderProducts:');
  await cleanPreOrders(stat);

  console.log('');
  console.log('-------------------------------------');
  console.log(`Scanned rows:    ${stat.scanned}`);
  console.log(`Rows to update:  ${stat.updated}`);
  console.log(`Bad URLs purged: ${stat.totalBadUrls}`);

  if (DRY_RUN) {
    console.log('');
    console.log('No writes performed. Re-run with CONFIRM_PRODUCTION_CLEANUP=yes to apply.');
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
