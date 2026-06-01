/**
 * eseller.mn marketplace launch readiness gate.
 *
 * Runs the focused checks that protect the public marketplace browsing,
 * posting, product detail, entity profile, and image URL surfaces.
 *
 * Usage:
 *   BASE_URL=https://eseller.mn npm run test:readiness
 */

import { spawnSync } from 'node:child_process';

type ReadinessStep = {
  label: string;
  command: string;
  args: string[];
  env?: NodeJS.ProcessEnv;
};

type StepResult = {
  label: string;
  ok: boolean;
  detail: string;
};

const BASE_URL = process.env.BASE_URL || 'https://eseller.mn';

const scopedLintFiles = [
  'scripts/feed-readiness-test.ts',
  'scripts/detail-readiness-test.ts',
  'scripts/marketplace-readiness-test.ts',
  'scripts/login-redirect-contract-test.ts',
  'scripts/seller-owner-contract-test.ts',
  'scripts/store-dashboard-readiness-test.ts',
  'scripts/test-image-url.ts',
  'src/lib/image-url.ts',
  'src/lib/product-visibility.ts',
  'src/app/api/auth/dan/route.ts',
  'src/app/api/auth/dan/callback/route.ts',
  'src/app/api/auth/logout/route.ts',
  'src/app/feed/FeedPageClient.tsx',
  'src/app/api/marketplace/route.ts',
  'src/app/api/health/route.ts',
  'src/app/api/search/route.ts',
  'src/app/api/products/route.ts',
  'src/app/api/products/[id]/route.ts',
  'src/app/api/products/[id]/related/route.ts',
  'src/app/api/integrations/external/route.ts',
  'src/app/api/social/feed/route.ts',
  'src/app/api/quick-order/route.ts',
  'src/app/api/wishlist/route.ts',
  'src/app/api/group-buy/route.ts',
  'src/app/api/homepage/config/route.ts',
  'src/app/api/search/suggest/route.ts',
  'src/app/api/stories/route.ts',
  'src/app/api/live/route.ts',
  'src/app/api/live/[id]/route.ts',
  'src/app/api/live/[id]/products/route.ts',
  'src/app/api/live/[id]/purchase/route.ts',
  'src/app/api/social/trending/route.ts',
  'src/app/api/digital/upload/route.ts',
  'src/app/api/upload/route.ts',
  'scripts/clean-bad-image-urls.ts',
  'scripts/clean-audit-products.ts',
  'src/app/product/[id]/page.tsx',
  'src/app/feed/[id]/page.tsx',
];

const steps: ReadinessStep[] = [
  {
    label: 'TypeScript',
    command: 'npx',
    args: ['tsc', '--noEmit'],
  },
  {
    label: 'Scoped lint',
    command: 'npx',
    args: ['eslint', ...scopedLintFiles],
  },
  {
    label: 'Image URL unit test',
    command: 'npm',
    args: ['run', 'test:image-url'],
  },
  {
    label: 'Route smoke',
    command: 'npm',
    args: ['run', 'test:smoke'],
    env: { BASE_URL },
  },
  {
    label: 'Feed readiness',
    command: 'npm',
    args: ['run', 'test:feed'],
    env: { BASE_URL },
  },
  {
    label: 'Detail readiness',
    command: 'npm',
    args: ['run', 'test:details'],
    env: { BASE_URL },
  },
  {
    label: 'Store dashboard readiness',
    command: 'npm',
    args: ['run', 'test:store-dashboard'],
  },
  {
    label: 'Seller owner contract',
    command: 'npm',
    args: ['run', 'test:seller-owner'],
  },
  {
    label: 'Login redirect contract',
    command: 'npm',
    args: ['run', 'test:login-redirect'],
  },
];

function runStep(step: ReadinessStep): StepResult {
  const startedAt = Date.now();
  const commandLine = [step.command, ...step.args].join(' ');
  const executable = process.platform === 'win32' ? 'cmd.exe' : step.command;
  const args = process.platform === 'win32' ? ['/d', '/s', '/c', commandLine] : step.args;

  console.log(`\n--- ${step.label}`);
  console.log(`$ ${commandLine}`);

  const result = spawnSync(executable, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      BASE_URL,
      ...step.env,
    },
    stdio: 'inherit',
  });

  const durationSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  const ok = result.status === 0;

  return {
    label: step.label,
    ok,
    detail: `${ok ? 'passed' : `failed (${result.status ?? 'unknown'})`} in ${durationSeconds}s`,
  };
}

function main() {
  const date = new Date().toISOString().split('T')[0];
  const results: StepResult[] = [];

  console.log('\n==============================');
  console.log(`eseller.mn MARKETPLACE READINESS - ${date}`);
  console.log(`Base: ${BASE_URL}`);
  console.log('==============================');

  for (const step of steps) {
    results.push(runStep(step));
  }

  const failures = results.filter((result) => !result.ok);

  console.log('\n------------------------------');
  for (const result of results) {
    console.log(`${result.ok ? '[OK]' : '[FAIL]'} ${result.label.padEnd(22)} ${result.detail}`);
  }
  console.log(`Total: ${results.length} | Passed: ${results.length - failures.length} | Failed: ${failures.length}`);
  console.log('------------------------------\n');

  if (failures.length > 0) {
    process.exit(1);
  }
}

main();
