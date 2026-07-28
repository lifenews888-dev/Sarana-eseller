import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const missing = (await p.$runCommandRaw({
    count: 'stores',
    query: { isDemo: { $exists: false } },
  })) as { n?: number };
  console.log('shops missing isDemo', missing);

  if ((missing.n || 0) > 0) {
    const result = await p.$runCommandRaw({
      update: 'stores',
      updates: [
        {
          q: { isDemo: { $exists: false } },
          u: { $set: { isDemo: false } },
          multi: true,
        },
      ],
    });
    console.log('shops updated', result);
  }

  const productCount = await p.product.count({
    where: { isActive: true, isDemo: false, price: { gte: 1000 } },
  });
  console.log('products active nonDemo priceOk', productCount);

  const { filterPublicLaunchProducts, publicProductWhere } = await import(
    '../src/lib/product-visibility'
  );
  const whereCount = await p.product.count({ where: publicProductWhere() });
  const rows = await p.product.findMany({ where: publicProductWhere(), take: 20 });
  console.log('publicProductWhere', whereCount, 'sample visible', filterPublicLaunchProducts(rows).length);
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
