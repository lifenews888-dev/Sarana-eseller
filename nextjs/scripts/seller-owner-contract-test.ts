/**
 * Seller owner registration contract checks.
 *
 * These checks keep the shop-owner onboarding contract launch-safe without
 * writing to the database. They verify the registration route keeps the pieces
 * the client dashboard depends on after `/become-seller` completes.
 */

import fs from 'node:fs';
import path from 'node:path';

type Check = {
  label: string;
  ok: boolean;
  detail: string;
};

const registerRoute = path.join(process.cwd(), 'src', 'app', 'api', 'entities', 'register', 'route.ts');
const becomeSellerPage = path.join(process.cwd(), 'src', 'app', 'become-seller', 'page.tsx');
const openShopPage = path.join(process.cwd(), 'src', 'app', 'open-shop', 'page.tsx');
const myStoresRoute = path.join(process.cwd(), 'src', 'app', 'api', 'seller', 'my-stores', 'route.ts');
const searchBar = path.join(process.cwd(), 'src', 'components', 'search', 'SearchBar.tsx');
const featuredShops = path.join(process.cwd(), 'src', 'components', 'home', 'FeaturedShops.tsx');
const publicShopUrl = path.join(process.cwd(), 'src', 'lib', 'public-shop-url.ts');
const publicCtaFiles = [
  path.join(process.cwd(), 'src', 'components', 'shared', 'Navbar.tsx'),
  path.join(process.cwd(), 'src', 'components', 'shared', 'Footer.tsx'),
  path.join(process.cwd(), 'src', 'components', 'home', 'HeroVideoSlider.tsx'),
  path.join(process.cwd(), 'src', 'components', 'home', 'SellerSection.tsx'),
  path.join(process.cwd(), 'src', 'app', 'about', 'page.tsx'),
  path.join(process.cwd(), 'src', 'app', 'shops', 'ShopsPageClient.tsx'),
  path.join(process.cwd(), 'src', 'app', 'compare', 'page.tsx'),
];

function readSource(filePath: string): string {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function includesAll(source: string, snippets: string[]): boolean {
  return snippets.every((snippet) => source.includes(snippet));
}

function main() {
  const registerSource = readSource(registerRoute);
  const onboardingSource = readSource(becomeSellerPage);
  const openShopSource = readSource(openShopPage);
  const myStoresSource = readSource(myStoresRoute);
  const searchBarSource = readSource(searchBar);
  const featuredShopsSource = readSource(featuredShops);
  const publicShopUrlSource = readSource(publicShopUrl);
  const publicCtaSources = publicCtaFiles.map(readSource);

  const checks: Check[] = [
    {
      label: 'register route exists',
      ok: !!registerSource,
      detail: 'src/app/api/entities/register/route.ts',
    },
    {
      label: 'server slug normalization',
      ok: includesAll(registerSource, ['function normalizeSlug', 'const safeSlug = normalizeSlug(slug)']),
      detail: 'slug is normalized server-side',
    },
    {
      label: 'server fallback slug',
      ok: registerSource.includes('seller-${auth.id.slice(-8).toLowerCase()}'),
      detail: 'Cyrillic-only names cannot leave slug empty',
    },
    {
      label: 'shop storefront slug set',
      ok: registerSource.includes('storefrontSlug: safeSlug'),
      detail: 'shop public URL follows registered slug',
    },
    {
      label: 'public image URL guard',
      ok: includesAll(registerSource, ['isValidPublicImageUrl', 'publicImageOrNull', 'safeLogo', 'safeCoverImage']),
      detail: 'local file/image-picker URLs are not stored',
    },
    {
      label: 'shop slug collision check',
      ok: includesAll(registerSource, ['prisma.shop.findFirst', 'OR: [{ slug: safeSlug }, { storefrontSlug: safeSlug }]']),
      detail: 'shop slug and storefrontSlug are both reserved',
    },
    {
      label: 'agent slug collision check',
      ok: registerSource.includes('prisma.agent.findFirst({ where: { slug: safeSlug'),
      detail: 'agent profile slugs cannot collide',
    },
    {
      label: 'company slug collision check',
      ok: registerSource.includes('prisma.company.findFirst({ where: { slug: safeSlug'),
      detail: 'company profile slugs cannot collide',
    },
    {
      label: 'auto dealer slug collision check',
      ok: registerSource.includes('prisma.autoDealer.findFirst({ where: { slug: safeSlug'),
      detail: 'auto dealer slugs cannot collide',
    },
    {
      label: 'service slug collision check',
      ok: registerSource.includes('prisma.serviceProvider.findFirst({ where: { slug: safeSlug'),
      detail: 'service provider slugs cannot collide',
    },
    {
      label: 'token carries entityType',
      ok: includesAll(registerSource, ['entityType: updatedUser.entityType', 'signToken']),
      detail: 'dashboard can switch to the selected owner tools',
    },
    {
      label: 'response carries store object',
      ok: includesAll(registerSource, ['store: entityStore', 'updatedUser.shop', 'updatedUser.agent']),
      detail: 'client auth state receives the owner profile summary',
    },
    {
      label: 'onboarding slug helper',
      ok: includesAll(onboardingSource, ['function toSellerSlug', 'generatedSlug || prev.slug']),
      detail: 'client does not submit empty slugs for Cyrillic names',
    },
    {
      label: 'onboarding slug step validation',
      ok: onboardingSource.includes('form.slug.length >= 3'),
      detail: 'next button waits for a valid visible slug',
    },
    {
      label: 'onboarding auth redirect',
      ok: includesAll(onboardingSource, ['currentSellerOnboardingPath', 'encodeURIComponent(currentSellerOnboardingPath())']),
      detail: 'logged-out users return to the same onboarding URL after login',
    },
    {
      label: 'create more stores intent',
      ok: includesAll(onboardingSource, ["new URLSearchParams(window.location.search).get('intent') === 'create-store'", '!isCreateStoreIntent']),
      detail: 'logged-in sellers can re-enter onboarding to add another store type',
    },
    {
      label: 'success continues setup',
      ok: onboardingSource.includes('href="/dashboard/store/settings/shop-type"'),
      detail: 'new store owners continue into the setup wizard',
    },
    {
      label: 'open-shop canonical redirect',
      ok: includesAll(openShopSource, ["redirect('/become-seller?source=open-shop')"]),
      detail: '/open-shop cannot become a second store creation flow',
    },
    {
      label: 'public CTAs use canonical flow',
      ok: publicCtaSources.every((source) => !source.includes('href="/open-shop"') && !source.includes("buttonLink: '/open-shop'")),
      detail: 'visible store-opening links go straight to /become-seller',
    },
    {
      label: 'my-stores route requires auth',
      ok: includesAll(myStoresSource, ['requireAuth(req)', 'auth instanceof Response']),
      detail: 'store switcher is scoped to the logged-in owner',
    },
    {
      label: 'my-stores owner filter',
      ok: includesAll(myStoresSource, ['where: { userId: auth.id', 'prisma.agent.findUnique({ where: { userId: auth.id } })']),
      detail: 'store switcher does not list unrelated stores',
    },
    {
      label: 'my-stores typed entries',
      ok: includesAll(myStoresSource, ['entityType:', 'storeType:', 'href:']),
      detail: 'dashboard can select tools by active store type',
    },
    {
      label: 'public shop links use namespace',
      ok: includesAll(publicShopUrlSource, ['function publicShopHref', "return value ? `/s/${value}` : '/shops'"])
        && [myStoresSource, searchBarSource, featuredShopsSource].every((source) => source.includes('publicShopHref')),
      detail: 'dashboard/search/home links resolve stores through /s/{slug}',
    },
    {
      label: 'onboarding terms gate',
      ok: includesAll(onboardingSource, ['acceptedTerms', 'setAcceptedTerms', 'canSubmit', '!acceptedTerms']),
      detail: 'owner registration cannot submit until terms are accepted',
    },
    {
      label: 'onboarding legal links',
      ok: includesAll(onboardingSource, ['href="/terms"', 'href="/privacy"']) && !onboardingSource.includes('href="#"'),
      detail: 'terms and privacy links point to real public pages',
    },
  ];

  console.log('\n══════════════════════════════');
  console.log(`eseller.mn SELLER OWNER CONTRACT — ${new Date().toISOString().split('T')[0]}`);
  console.log('══════════════════════════════\n');

  for (const check of checks) {
    console.log(`${check.ok ? '✅' : '❌'} ${check.label.padEnd(36)} ${check.detail}`);
  }

  const failures = checks.filter((check) => !check.ok);
  console.log('\n──────────────────────────────');
  console.log(`Нийт: ${checks.length} | ✅ ${checks.length - failures.length} | ❌ ${failures.length}`);
  console.log('──────────────────────────────\n');

  if (failures.length > 0) process.exit(1);
}

main();
