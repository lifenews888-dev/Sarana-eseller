/**
 * Sanity check for marketplace category taxonomy (brand-first vehicles/phones).
 * Run: npx tsx scripts/verify-category-master.ts
 */
import {
  MARKETPLACE_CATEGORIES,
  categoryTreeFallback,
  flattenCategoryTree,
  normalizeMarketplaceCategory,
  findMarketplaceCategory,
  categoryPathInfo,
} from '../src/lib/marketplaceCategories';
import { metadataFieldsForCategory } from '../src/lib/listingMetadata';

const roots = MARKETPLACE_CATEGORIES.length;
const tree = categoryTreeFallback();
const flat = flattenCategoryTree(tree);

console.log('roots', roots);
console.log('tree roots', tree.length);
console.log('flat nodes', flat.length);

// Brand-first markers (previous good taxonomy)
const vehicle = findMarketplaceCategory('vehicles');
const phone = findMarketplaceCategory('phones');
if (!vehicle) {
  console.error('MISSING vehicles');
  process.exit(1);
}
const vehicleText = JSON.stringify(vehicle.subcategories);
for (const brand of ['Toyota', 'Tesla', 'Lexus', 'Hyundai', 'BMW']) {
  if (!vehicleText.includes(brand)) {
    console.error('MISSING brand under vehicles:', brand);
    process.exit(1);
  }
}
const phoneText = JSON.stringify(phone?.subcategories || []);
if (!phoneText.includes('iPhone') && !phoneText.includes('Apple')) {
  console.error('MISSING Apple/iPhone under phones');
  process.exit(1);
}

// Path resolution for brand leaves
const prius = categoryPathInfo('vehicles-1-2'); // may not work if slug differs
// Check path via alias/name resolution
const toyotaNorm = normalizeMarketplaceCategory('toyota');
console.log('normalize toyota →', toyotaNorm);

for (const cat of MARKETPLACE_CATEGORIES) {
  if (!cat.key || !cat.label || !Array.isArray(cat.subcategories)) {
    console.error('BAD CATEGORY', cat.key);
    process.exit(1);
  }
  if (!findMarketplaceCategory(cat.key)) {
    console.error('NOT FOUND', cat.key);
    process.exit(1);
  }
}

console.log('vehicles fields', metadataFieldsForCategory('vehicles').length);
console.log('jobs fields', metadataFieldsForCategory('jobs').length);
console.log('phones fields', metadataFieldsForCategory('phones').length);
console.log('OK brand-first taxonomy');
