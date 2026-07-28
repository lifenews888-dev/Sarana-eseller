/**
 * P0 catalog data repair for eseller.mn
 *
 * Fixes:
 * 1. Inverted salePrice (sale > price) → swap so sale becomes discount
 * 2. Clear isDemo on otherwise public-quality products (optional flag)
 * 3. Report mojibake / low-price / missing-image rows
 *
 * Usage:
 *   npx tsx scripts/fix-catalog-data.ts --dry-run
 *   npx tsx scripts/fix-catalog-data.ts --apply
 *   npx tsx scripts/fix-catalog-data.ts --apply --clear-demo
 *
 * Requires DATABASE_URL in env (or .env).
 */
import { PrismaClient } from '@prisma/client';
import {
  PUBLIC_PRODUCT_MIN_PRICE,
  getPublicProductQualityIssue,
  hasInvertedSalePrice,
} from '../src/lib/product-visibility';

const prisma = new PrismaClient();

const args = new Set(process.argv.slice(2));
const APPLY = args.has('--apply');
const CLEAR_DEMO = args.has('--clear-demo');

function looksLikeMojibake(text: string | null | undefined): boolean {
  if (!text) return false;
  // Common UTF-8-as-Latin1 artifacts and replacement-like sequences in our DB dump.
  if (/[ÐÑÃ][\x80-\xff]/.test(text)) return true;
  if (/D[?�]{1,3}/.test(text)) return true;
  if (text.includes('\uFFFD')) return true;
  // High ratio of non-printable / control-ish Latin range in "Mongolian" fields.
  const weird = (text.match(/[^\u0400-\u04FF\u1800-\u18AF\w\s\d₮.,%+\-–—/()'":&]/g) || []).length;
  return text.length > 4 && weird / text.length > 0.35;
}

async function main() {
  console.log(`fix-catalog-data  dryRun=${!APPLY} clearDemo=${CLEAR_DEMO}`);

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      salePrice: true,
      images: true,
      isActive: true,
      isDemo: true,
      category: true,
    },
    take: 5000,
  });

  let inverted = 0;
  let demosCleared = 0;
  let mojibake = 0;
  let lowPrice = 0;
  let hiddenQuality = 0;

  for (const p of products) {
    if (looksLikeMojibake(p.name) || looksLikeMojibake(p.description) || looksLikeMojibake(p.category)) {
      mojibake++;
      console.log(`  MOJIBAKE  ${p.id}  name=${JSON.stringify(p.name?.slice(0, 40))}`);
    }

    if (typeof p.price === 'number' && p.price > 0 && p.price < PUBLIC_PRODUCT_MIN_PRICE) {
      lowPrice++;
    }

    const issue = getPublicProductQualityIssue(p);
    if (issue) hiddenQuality++;

    if (hasInvertedSalePrice(p)) {
      inverted++;
      // sale was stored as the higher "list" price — swap so sale becomes discount.
      const list = p.salePrice as number;
      const sale = p.price;
      console.log(`  INVERT  ${p.id}  ${p.name?.slice(0, 30)}  price ${p.price}→${list}  sale ${p.salePrice}→${sale}`);
      if (APPLY) {
        await prisma.product.update({
          where: { id: p.id },
          data: { price: list, salePrice: sale },
        });
      }
    }

    if (CLEAR_DEMO && p.isDemo) {
      // Only clear demo when product would otherwise pass public quality (after invert fix).
      const after = {
        ...p,
        isDemo: false,
        price: hasInvertedSalePrice(p) ? (p.salePrice as number) : p.price,
        salePrice: hasInvertedSalePrice(p) ? p.price : p.salePrice,
      };
      if (!getPublicProductQualityIssue(after)) {
        demosCleared++;
        console.log(`  CLEAR_DEMO  ${p.id}  ${p.name?.slice(0, 40)}`);
        if (APPLY) {
          await prisma.product.update({ where: { id: p.id }, data: { isDemo: false } });
        }
      }
    }
  }

  // Homepage section titles mojibake report
  const sections = await prisma.homepageSection.findMany({ select: { id: true, key: true, title: true } }).catch(() => []);
  for (const s of sections) {
    if (looksLikeMojibake(s.title)) {
      mojibake++;
      console.log(`  SECTION_MOJIBAKE  ${s.key}  ${JSON.stringify(s.title)}`);
    }
  }

  console.log('\n--- Summary ---');
  console.log(`products scanned: ${products.length}`);
  console.log(`inverted salePrice: ${inverted}${APPLY ? ' (fixed)' : ' (dry-run)'}`);
  console.log(`demo clear candidates: ${demosCleared}${APPLY && CLEAR_DEMO ? ' (cleared)' : ''}`);
  console.log(`mojibake fields: ${mojibake} (manual re-seed recommended — auto re-encode is unsafe)`);
  console.log(`low price (<${PUBLIC_PRODUCT_MIN_PRICE}): ${lowPrice}`);
  console.log(`fail public quality gate: ${hiddenQuality}`);
  console.log(APPLY ? 'DONE (applied)' : 'DONE (dry-run — re-run with --apply)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
