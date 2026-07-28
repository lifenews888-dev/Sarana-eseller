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
} from '../src/lib/marketplaceCategories';
import { metadataFieldsForCategory } from '../src/lib/listingMetadata';
import { generatedFieldsForCategoryKey } from '../src/lib/generated/categoryAttributes';

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
for (const brand of ['Toyota', 'Tesla', 'Lexus', 'Hyundai', 'BMW', 'Хүнд механизм']) {
  if (!vehicleText.includes(brand)) {
    console.error('MISSING under vehicles:', brand);
    process.exit(1);
  }
}
for (const zaryAutoMarker of ['Мотоцикл', 'Авто дугуй', 'Обуд']) {
  const autoPartsText = JSON.stringify(findMarketplaceCategory('auto-parts')?.subcategories || []);
  if (!vehicleText.includes(zaryAutoMarker) && !autoPartsText.includes(zaryAutoMarker)) {
    console.error('MISSING zary.mn auto marker:', zaryAutoMarker);
    process.exit(1);
  }
}
const phoneText = JSON.stringify(phone?.subcategories || []);
if (!phoneText.includes('iPhone') && !phoneText.includes('Apple')) {
  console.error('MISSING Apple/iPhone under phones');
  process.exit(1);
}

// Path resolution for aliases and generated slugs.
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

// Preserve eseller's previous stable category keys even after Excel generation.
for (const restoredKey of [
  'kids-toys',
  'health-vitamins',
  'gifts-hobby',
  'books-stationery',
  'construction-tools',
  'food-beverage',
  'digital-goods',
]) {
  if (!findMarketplaceCategory(restoredKey)) {
    console.error('MISSING restored eseller category key:', restoredKey);
    process.exit(1);
  }
  if (generatedFieldsForCategoryKey(restoredKey).length === 0) {
    console.error('MISSING generated attributes for restored key:', restoredKey);
    process.exit(1);
  }
}

console.log('vehicles fields', metadataFieldsForCategory('vehicles').length);
console.log('jobs fields', metadataFieldsForCategory('jobs').length);
console.log('phones fields', metadataFieldsForCategory('phones').length);
console.log('OK brand-first taxonomy');
