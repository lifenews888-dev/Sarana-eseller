import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const modal = readFileSync(join(process.cwd(), 'src', 'components', 'store', 'ProductModal.tsx'), 'utf8');
const mobileNav = readFileSync(join(process.cwd(), 'src', 'components', 'shared', 'MobileNav.tsx'), 'utf8');

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(mobileNav.includes('z-[9999]'), 'Mobile bottom nav z-index expectation changed; review modal layer contract.');
assert(modal.includes('z-[10050]'), 'Product modal must render above the mobile bottom nav.');
assert(modal.includes('z-[10020]'), 'Product backdrop must cover the mobile bottom nav.');
assert(modal.includes('bottom-[calc(8px+env(safe-area-inset-bottom))]'), 'Product modal must reserve mobile safe-area at the bottom.');
assert(modal.includes('max-md:h-[34dvh]'), 'Product image area must be capped on mobile so details and footer remain reachable.');
assert(modal.includes('flex min-h-0 flex-1 flex-col'), 'Product detail column must allow internal scrolling.');
assert(modal.includes('overflow-y-auto'), 'Product detail content must scroll inside the modal.');
assert(modal.includes('pb-[calc(12px+env(safe-area-inset-bottom))]'), 'Product modal footer must stay above iOS safe-area.');

console.log('Mobile product modal contract passed.');
