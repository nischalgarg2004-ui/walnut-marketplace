# Make New Version (production deploy + Git)

Use this when you want to **deploy the current working tree to Vercel production via the CLI** (without relying on a Git push to trigger the deploy), then **update the remote Git repository** so history matches what you shipped.

For architecture and repo layout, read [Knowledge Transfer.md](./Knowledge%20Transfer.md) first. For env vars, Neon, and Prisma on Vercel, see [HOSTING_AND_MIGRATIONS.md](./HOSTING_AND_MIGRATIONS.md).

## Prerequisites

- **Working directory:** repository root (folder containing `package.json` and, after linking, `.vercel`).
- **Vercel:** project **Root Directory** should be `./` in Vercel Project Settings so the CLI does not look for a nested duplicate folder.
- **CLI:** use `npx vercel` (listed in `devDependencies`) if `vercel` is not on your PATH.
- **Auth:** `vercel login` if needed; local link via `.vercel` (gitignored).

## Steps

1. **Production deploy (CLI)** — from repo root:

   ```bash
   npx vercel deploy --prod --yes
   ```

   - `--prod` targets production; `--yes` accepts defaults in non-interactive runs.

2. **Git** — commit any pending changes, then push:

   ```bash
   git status
   git add .
   git commit -m "Your message"
   git push origin main
   ```

   Adjust branch name if you do not use `main`.

## Verification

The CLI prints a deployment URL; production is usually aliased to your project’s `.vercel.app` domain. You can inspect a deployment with `npx vercel inspect <url>`.

## Notes

- Pushing to the connected Git branch **also** triggers a Vercel build. This workflow is for an **explicit CLI production deploy** followed by **Git sync**.
- **Windows PowerShell:** quote paths with spaces, e.g. `Set-Location "d:\Project Walnut\walnut-marketplace"`.

## Troubleshooting

- **Wrong path / nested folder errors:** Confirm Vercel **Root Directory** is `./` and your shell cwd is the repo root.
- **Auth errors:** Run `vercel login` or check team/project scope.
