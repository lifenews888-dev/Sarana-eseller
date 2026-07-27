import { publicShopHref, publicShopUrl } from '@/lib/public-shop-url';

type Check = {
  label: string;
  actual: string;
  expected: string;
};

const checks: Check[] = [
  { label: 'normal slug', actual: publicShopHref('muugiinu'), expected: '/s/muugiinu' },
  { label: 'leading slash', actual: publicShopHref('/muugiinu'), expected: '/s/muugiinu' },
  { label: 'canonical href input', actual: publicShopHref('/s/muugiinu'), expected: '/s/muugiinu' },
  { label: 'trailing slash', actual: publicShopHref('muugiinu/'), expected: '/s/muugiinu' },
  { label: 'empty slug fallback', actual: publicShopHref('   '), expected: '/shops' },
  { label: 'absolute production URL', actual: publicShopUrl('https://eseller.mn/', 'muugiinu'), expected: 'https://eseller.mn/s/muugiinu' },
  { label: 'absolute fallback URL', actual: publicShopUrl('https://eseller.mn/', null), expected: 'https://eseller.mn/shops' },
];

const failures = checks.filter((check) => check.actual !== check.expected);

for (const check of checks) {
  console.log(`${check.actual === check.expected ? '✅' : '❌'} ${check.label.padEnd(24)} ${check.actual}`);
}

if (failures.length > 0) {
  console.error(`\n${failures.length} public shop URL check(s) failed`);
  process.exit(1);
}

console.log(`\nPublic shop URL checks passed: ${checks.length}/${checks.length}`);
