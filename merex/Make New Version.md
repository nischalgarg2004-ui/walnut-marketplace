# Make New Version (production deploy + Git)

Use this when you want to **deploy the current working tree to Vercel production via the CLI** (without relying on a Git push to trigger the deploy), then **update the remote Git repository** so history matches what you shipped.

For architecture and repo layout, read [Knowledge Transfer.md](./Knowledge%20Transfer.md) first. For env vars, Neon, and Prisma on Vercel, see [HOSTING_AND_MIGRATIONS.md](./HOSTING_AND_MIGRATIONS.md).

## Prerequisites

- **Where to run the CLI:** depends how the Vercel project’s **Root Directory** is set (Project → Settings → General).
  - **Root Directory = `merex` (subfolder):** run `npx vercel deploy` from the **Git repository root** — the folder that contains the `merex` directory (e.g. `d:\Merex`), **not** from inside `merex`. Otherwise the CLI can resolve a non-existent path like `…\merex\merex`.
  - **Root Directory = `./` (app at repo root):** run the CLI from the same folder as `package.json` (the repo root).
- **`.vercel` link:** after `vercel link`, `.vercel/project.json` is gitignored. It must live in the directory **from which you invoke** `vercel deploy`. If you deploy from the Git root but linked only inside `merex`, copy the same `.vercel/project.json` to the Git root (or run `vercel link` once from that root).
- **CLI:** use `npx vercel` (listed in `devDependencies`) if `vercel` is not on your PATH.
- **Auth:** `vercel login` if needed.

## Steps

1. **Production deploy (CLI)** — `cd` to the correct directory (see Prerequisites), then:

   ```bash
   npx vercel deploy --prod --yes
   ```

   - `--prod` targets production; `--yes` accepts defaults in non-interactive runs.

   **Windows PowerShell** (example when Git root is `Merex` and Root Directory is `merex`):

   ```powershell
   Set-Location "d:\Merex"
   npx vercel deploy --prod --yes
   ```

2. **Git** — from your **Git repository root**, commit any pending changes, then push:

   ```bash
   git status
   git add .
   git commit -m "Your message"
   git push origin main
   ```

   Adjust branch name if you do not use `main`.

## Verification

The CLI prints a deployment URL; production is usually aliased to your project’s primary `.vercel.app` domain (e.g. `https://merex.vercel.app`). Inspect a deployment with `npx vercel inspect <deployment-url>`.

## Notes

- Pushing to the connected Git branch **also** triggers a Vercel build. This workflow is for an **explicit CLI production deploy** followed by **Git sync** (or the reverse order, depending on your process).
- **Team access:** if the CLI reports that the **Git author** must have access to the Vercel team, add that GitHub user to the team or deploy with an account that has access. See [Troubleshoot project collaboration](https://vercel.com/docs/deployments/troubleshoot-project-collaboration#team-configuration).

## Troubleshooting

- **`…\merex\merex` does not exist:** Your shell was probably inside the inner app folder while Vercel **Root Directory** is set to `merex`. **cd** to the **Git root** and deploy again (see Prerequisites).
- **Root Directory mismatch:** Align **cwd** with how the project is configured in Vercel (subfolder vs repo root).
- **Auth errors:** Run `vercel login` or check team/project scope.
