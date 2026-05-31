# eseller.mn Production Audit Cleanup

This runbook covers the post-audit cleanup for public marketplace data issues:

- local-device image paths such as `file:///data/user/0/.../ImagePicker/...`
- obvious public test products such as E2E/test/dummy/demo rows, or active products with price `0` or `1`

The public API and UI already hide these unsafe records. This runbook is for cleaning the production database after deployment.

## Guardrails

- Do not add secrets to this file.
- Do not run live cleanup before reviewing dry-run output.
- Do not delete products in these scripts; audit product cleanup only deactivates public visibility with `isActive: false`.
- Image cleanup only removes invalid image URLs from arrays; it does not upload files or create CDN URLs.
- Keep a production database backup/snapshot available before running live cleanup.

## Required Environment

Run from `nextjs/` in an environment that has production `DATABASE_URL` configured.

```bash
npm run clean:images:dry
npm run clean:audit-products:dry
```

Review the dry-run output:

- confirm each product row is truly test/demo/invalid
- confirm image rows are removing only non-public URLs
- confirm no legitimate CDN URL is removed

## Live Cleanup

Live cleanup requires an explicit confirmation environment variable.

```bash
CONFIRM_PRODUCTION_CLEANUP=yes npm run clean:images
CONFIRM_PRODUCTION_CLEANUP=yes npm run clean:audit-products
```

If using PowerShell:

```powershell
$env:CONFIRM_PRODUCTION_CLEANUP = "yes"
npm run clean:images
npm run clean:audit-products
Remove-Item Env:\CONFIRM_PRODUCTION_CLEANUP
```

## Verification

After cleanup and deploy, run:

```bash
BASE_URL=https://eseller.mn npm run test:readiness
```

Expected checks:

- `/api/marketplace` returns only public image URLs
- `/api/products?limit=20` returns only public image URLs
- known audit/test product page returns `404`
- known audit/test product API route returns `404`
- route smoke passes
- feed readiness passes
- detail readiness passes

## Rollback

If image cleanup removed a legitimate URL, restore the affected row from backup and rerun readiness.

If audit product cleanup deactivated a legitimate product, restore `isActive: true` for that product after confirming it has:

- a real seller/source
- real title and description
- valid public image URLs
- a launch-safe price
- no test/demo markers
