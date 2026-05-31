// Hide obvious test products from production public surfaces.
//
// Usage:
//   npx tsx scripts/clean-audit-products.ts --dry-run
//   CONFIRM_PRODUCTION_CLEANUP=yes npx tsx scripts/clean-audit-products.ts

import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { isPublicLaunchProduct } from '../src/lib/product-visibility';

const DRY_RUN = process.argv.includes('--dry-run');
const CONFIRMED = process.env.CONFIRM_PRODUCTION_CLEANUP === 'yes';

async function main() {
  if (!DRY_RUN && !CONFIRMED) {
    console.error('Refusing to deactivate products without CONFIRM_PRODUCTION_CLEANUP=yes.');
    console.error('Run dry-run first: npm run clean:audit-products:dry');
    process.exit(1);
  }

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      isActive: true,
      isDemo: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const blocked = products.filter((product) => product.isActive && !isPublicLaunchProduct(product));

  console.log(`Product audit cleanup - ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Scanned: ${products.length}`);
  console.log(`To deactivate: ${blocked.length}`);

  for (const product of blocked) {
    console.log(`  ${product.id} | ${product.name} | price=${product.price} | demo=${product.isDemo}`);
    if (!DRY_RUN) {
      await prisma.product.update({
        where: { id: product.id },
        data: { isActive: false },
      });
    }
  }

  if (DRY_RUN) {
    console.log('No writes performed. Re-run with CONFIRM_PRODUCTION_CLEANUP=yes to apply.');
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
