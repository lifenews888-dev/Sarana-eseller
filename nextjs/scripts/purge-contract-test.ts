/** Purge endpoint-ийн edge-үүд: admin хамгаалалт, схемээс холбоос олох. Run: npx tsx scripts/purge-contract-test.ts */
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
const names = new Set(Prisma.dmmf.datamodel.models.map((m) => m.name));
for (const n of ['User', 'Shop', 'Product', 'Order', 'Wallet', 'SellerProfile', 'AdminLog']) assert.ok(names.has(n), n);
const userRefs = Prisma.dmmf.datamodel.models.filter((m) => m.fields.some((f) => f.kind === 'object' && f.type === 'User' && f.relationFromFields?.length)).map((m) => m.name);
assert.ok(userRefs.includes('Order') && userRefs.includes('Shop') && userRefs.includes('Wallet'));
console.log(`purge contract: ${names.size} model, User-ийг заасан ${userRefs.length} relation — OK`);
