/**
 * Drop unique index stores_userId_key so one user can own multiple shops.
 * Keeps a non-unique index on userId for lookups.
 *
 * Usage:
 *   npx tsx scripts/drop-store-userid-unique.ts --dry-run
 *   npx tsx scripts/drop-store-userid-unique.ts --apply
 */
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
const APPLY = process.argv.includes('--apply');

async function main() {
  const listed = (await p.$runCommandRaw({ listIndexes: 'stores' })) as {
    cursor?: { firstBatch?: Array<{ name: string; unique?: boolean; key: Record<string, number> }> };
  };
  const indexes = listed.cursor?.firstBatch || [];
  console.log(
    'indexes:',
    indexes.map((i) => ({ name: i.name, unique: !!i.unique, key: i.key })),
  );

  const uniqueUserId = indexes.find(
    (i) => i.name === 'stores_userId_key' || (i.unique && i.key?.userId === 1 && Object.keys(i.key).length === 1),
  );

  if (!uniqueUserId) {
    console.log('No unique userId index found — already multi-shop ready.');
    return;
  }

  console.log(`Found unique index: ${uniqueUserId.name}`);
  if (!APPLY) {
    console.log('Dry-run only. Re-run with --apply to drop and recreate non-unique index.');
    return;
  }

  await p.$runCommandRaw({ dropIndexes: 'stores', index: uniqueUserId.name });
  console.log(`Dropped ${uniqueUserId.name}`);

  await p.$runCommandRaw({
    createIndexes: 'stores',
    indexes: [{ key: { userId: 1 }, name: 'stores_userId_idx' }],
  });
  console.log('Created non-unique stores_userId_idx');

  const after = (await p.$runCommandRaw({ listIndexes: 'stores' })) as {
    cursor?: { firstBatch?: Array<{ name: string; unique?: boolean }> };
  };
  console.log(
    'after:',
    (after.cursor?.firstBatch || []).map((i) => ({ name: i.name, unique: !!i.unique })),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
