import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  try {
    await prisma.$runCommandRaw({ dropIndexes: 'stores', index: 'referralCode_1' });
    console.log('✓ Dropped referralCode_1 index');
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.log('Drop result:', message.substring(0, 100));
  }
  await prisma.$disconnect();
}
main();
