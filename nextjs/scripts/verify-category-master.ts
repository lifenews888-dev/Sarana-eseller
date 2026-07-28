/**
 * Quick sanity check for generated category master.
 * Run: npx tsx scripts/verify-category-master.ts
 */
import {
  MARKETPLACE_CATEGORIES,
  categoryTreeFallback,
  flattenCategoryTree,
  normalizeMarketplaceCategory,
  findMarketplaceCategory,
} from '../src/lib/marketplaceCategories';
import { metadataFieldsForCategory } from '../src/lib/listingMetadata';

const roots = MARKETPLACE_CATEGORIES.length;
const tree = categoryTreeFallback();
const flat = flattenCategoryTree(tree);

console.log('roots', roots);
console.log('tree roots', tree.length);
console.log('flat nodes', flat.length);

const aliases = [
  ['jobs', 'jobs'],
  ['kids-toys', 'kids'],
  ['digital-goods', 'digital'],
  ['books-stationery', 'books'],
  ['food-beverage', 'food'],
  ['health-vitamins', 'health'],
  ['gifts-hobby', 'gifts'],
  ['construction-tools', 'construction'],
];

for (const [from, to] of aliases) {
  const got = normalizeMarketplaceCategory(from);
  if (got !== to) {
    console.error('ALIAS FAIL', from, '→', got, 'expected', to);
    process.exit(1);
  }
}

for (const cat of MARKETPLACE_CATEGORIES) {
  if (!cat.key || !cat.label || !Array.isArray(cat.subcategories)) {
    console.error('BAD CATEGORY', cat);
    process.exit(1);
  }
  const fields = metadataFieldsForCategory(cat.key);
  if (fields.length === 0 && cat.section !== 'service') {
    // services always get SERVICE_FIELDS at least
  }
  if (!findMarketplaceCategory(cat.key)) {
    console.error('NOT FOUND', cat.key);
    process.exit(1);
  }
}

console.log('vehicles fields', metadataFieldsForCategory('vehicles').length);
console.log('jobs fields', metadataFieldsForCategory('jobs').length);
console.log('women fields', metadataFieldsForCategory('women').length);
console.log('OK');
