// ══════════════════════════════════════════════════════════════
// eseller.mn — Clean local-device image URLs from DB
// Mobile clients (Android ImagePicker) were posting cache paths
// like `file:///data/user/0/mn.eseller.app/cache/...` into
// Product.images. The web cannot render those, so this script
// strips them out across every collection that stores images.
//
// Usage:
//   npx tsx scripts/clean-bad-image-urls.ts --dry-run
//   npx tsx scripts/clean-bad-image-urls.ts
// ══════════════════════════════════════════════════════════════

import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { isValidPublicImageUrl } from '../src/lib/image-url';

const DRY_RUN = process.argv.includes('--dry-run');

type Stat = { scanned: number; updated: number; totalBadUrls: number };

function cleanList(urls: unknown): { cleaned: string[]; removed: number } {
  if (!Array.isArray(urls)) return { cleaned: [], removed: 0 };
  const cleaned: string[] = [];
  let removed = 0;
  for (const u of urls) {
    if (isValidPublicImageUrl(u)) cleaned.push(u as string);
    else removed++;
  }
  return { cleaned, removed };
}

async function cleanProducts(stat: Stat) {
  const items = await prisma.product.findMany({ select: { id: true, images: true } });
  stat.scanned += items.length;
  for (const p of items) {
    const { cleaned, removed } = cleanList(p.images);
    if (removed === 0) continue;
    stat.updated++;
    stat.totalBadUrls += removed;
    console.log(`  product ${p.id}: ${removed} bad URL${removed > 1 ? 's' : ''} → ${cleaned.length} kept`);
    if (!DRY_RUN) {
      await prisma.product.update({ where: { id: p.id }, data: { images: cleaned } });
    }
  }
}

async function cleanServices(stat: Stat) {
  const items = await prisma.service.findMany({ select: { id: true, images: true } });
  stat.scanned += items.length;
  for (const s of items) {
    const { cleaned, removed } = cleanList(s.images);
    if (removed === 0) continue;
    stat.updated++;
    stat.totalBadUrls += removed;
    console.log(`  service ${s.id}: ${removed} bad URL${removed > 1 ? 's' : ''} → ${cleaned.length} kept`);
    if (!DRY_RUN) {
      await prisma.service.update({ where: { id: s.id }, data: { images: cleaned } });
    }
  }
}

async function cleanFeedItems(stat: Stat) {
  const items = await prisma.feedItem.findMany({ select: { id: true, images: true } });
  stat.scanned += items.length;
  for (const f of items) {
    const { cleaned, removed } = cleanList(f.images);
    if (removed === 0) continue;
    stat.updated++;
    stat.totalBadUrls += removed;
    console.log(`  feedItem ${f.id}: ${removed} bad URL${removed > 1 ? 's' : ''} → ${cleaned.length} kept`);
    if (!DRY_RUN) {
      await prisma.feedItem.update({ where: { id: f.id }, data: { images: cleaned } });
    }
  }
}

async function cleanPreOrders(stat: Stat) {
  const items = await prisma.preOrderProduct.findMany({ select: { id: true, images: true } });
  stat.scanned += items.length;
  for (const p of items) {
    const { cleaned, removed } = cleanList(p.images);
    if (removed === 0) continue;
    stat.updated++;
    stat.totalBadUrls += removed;
    console.log(`  preOrder ${p.id}: ${removed} bad URL${removed > 1 ? 's' : ''} → ${cleaned.length} kept`);
    if (!DRY_RUN) {
      await prisma.preOrderProduct.update({ where: { id: p.id }, data: { images: cleaned } });
    }
  }
}

async function main() {
  console.log(`▶ Image URL cleanup — ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}`);
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
  console.log('─────────────────────────────────────');
  console.log(`Scanned rows:    ${stat.scanned}`);
  console.log(`Rows to update:  ${stat.updated}`);
  console.log(`Bad URLs purged: ${stat.totalBadUrls}`);
  if (DRY_RUN) {
    console.log('');
    console.log('No writes performed. Re-run without --dry-run to apply.');
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
