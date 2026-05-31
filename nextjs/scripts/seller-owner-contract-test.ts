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

function readSource(filePath: string): string {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function includesAll(source: string, snippets: string[]): boolean {
  return snippets.every((snippet) => source.includes(snippet));
}

function main() {
  const registerSource = readSource(registerRoute);
  const onboardingSource = readSource(becomeSellerPage);

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
      ok: onboardingSource.includes("router.push('/login?redirect=/become-seller')"),
      detail: 'logged-out users return to onboarding after login',
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
