# Marketplace Readiness Gate

This launch gate checks the public eseller.mn marketplace flows before a release or after deployment.

## Command

From `nextjs/`:

```bash
BASE_URL=https://eseller.mn npm run test:readiness
```

For preview or local verification:

```bash
BASE_URL=https://your-preview.vercel.app npm run test:readiness
BASE_URL=http://127.0.0.1:3007 npm run test:readiness
```

## Coverage

- TypeScript: `npx tsc --noEmit`
- Scoped lint for touched launch surfaces
- Image URL safety unit test
- Route smoke test
- Feed/store readiness smoke
- Product, feed detail, and entity profile readiness smoke

## Notes

- `BASE_URL` defaults to `https://eseller.mn`.
- The command exits non-zero if any step fails.
- Repo-wide `npm run lint` still includes older unrelated lint debt, so this launch gate uses scoped lint for the marketplace surfaces covered by the current release work.
- Do not put secrets in this command or document.
