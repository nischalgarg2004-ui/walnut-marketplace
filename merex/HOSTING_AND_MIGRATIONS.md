# Merex Hosting And Migrations

This document is the operational reference for hosting Merex on Vercel now and evolving toward safer shared-environment migrations over time.

## Current Hosting Target

- App hosting: Vercel
- Database: hosted PostgreSQL (Neon recommended)
- Runtime model: Next.js App Router with Node-based route handlers

## Environment Strategy

### Minimum viable setup
- `Preview/Dev`: one hosted Vercel project using a hosted dev database
- `Production later`: separate Vercel production environment and separate production database

### Recommended long-term setup
- `Local`: local development using `prisma migrate dev`
- `Preview`: Vercel preview deployments against a non-production hosted database
- `Production`: stable hosted deployment against a production database

## Neon (PostgreSQL)

- In the **Neon** dashboard, copy the connection string for your branch (typically **`DATABASE_URL`**).
- Use Neon’s **pooled** connection for serverless/Vercel if you enable the pooler; Prisma Migrate sometimes needs a **direct** (non-pooled) URL for `migrate deploy`. If Neon gives you two URLs, add the direct one as `DIRECT_URL` and set `directUrl = env("DIRECT_URL")` in `schema.prisma` (see [Prisma + Neon](https://www.prisma.io/docs/orm/overview/databases/neon)).
- Connection strings must include SSL where Neon requires it (usually included in the dashboard copy).

## Required Environment Variables

### Baseline hosting
- `DATABASE_URL` (Neon Postgres URL)
- `SESSION_SECRET`
- `NEXT_PUBLIC_APP_URL` (your Vercel production URL, e.g. `https://your-app.vercel.app`)
- `COMMISSION_PERCENT`

### Instagram OAuth (enable after hosted URL is stable)
- `INSTAGRAM_CLIENT_ID`
- `INSTAGRAM_CLIENT_SECRET`
- `INSTAGRAM_REDIRECT_URI`
- `INSTAGRAM_SCOPE`

### Optional / future
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RESEND_API_KEY` (required for business-settings OTP email verification flow)
- `RESEND_FROM_EMAIL` (sender identity for OTP emails)

## Vercel Deployment Notes

- `vercel.json` points builds to `npm run vercel:build`.
- **`scripts/vercel-build.mjs`** (used on Vercel because `VERCEL=1` is set during build) runs in order:
  1. **`prisma migrate deploy`** — applies committed migrations to the database pointed at by `DATABASE_URL` (your Neon branch).
  2. **`prisma generate`**
  3. **`next build`**
- So **preview/production** databases are migrated **during the build**, as long as `DATABASE_URL` is set in that Vercel environment. If you use a **pooled** Neon URL and migrations fail, configure `DIRECT_URL` + `directUrl` in Prisma (see Neon section above).
- Local/manual fallback: `npm run prisma:migrate:deploy` against the same `DATABASE_URL` if you ever need to run migrations outside CI.

### CLI production deploy (without waiting for Git)

Git-connected projects still build on push. To ship **from your machine** with `npx vercel deploy --prod` and then sync Git, follow **[Make New Version.md](./Make%20New%20Version.md)**. Summary:

- **Working directory must match Vercel “Root Directory”.** If the project is linked with Root Directory = `merex` (repo contains that subfolder), run the CLI from the **Git repository root** (parent of `merex`), not from inside the app twice-deep—otherwise paths like `…\merex\merex` break.
- **`.vercel` link:** `.vercel/` is gitignored. It must exist in the directory **from which you run** `vercel deploy`. If you linked only inside `merex` but deploy from the repo root, copy `.vercel/project.json` to that root or run `vercel link` once there.
- **Command:** `npx vercel deploy --prod --yes` (see Make New Version for PowerShell example and verification with `npx vercel inspect`).

## Prisma Rules

### Local only
- `npm run prisma:migrate`
- `npm run prisma:seed`

### Shared environments
- `npm run prisma:generate`
- `npm run prisma:migrate:deploy`

### Never do this in preview or production
- `prisma migrate dev`
- automatic execution of the current demo seed

## Seed Policy

The current `prisma/seed.ts` is for local/demo use only because it:
- creates predictable demo credentials
- writes `dummy_vars.json`
- deletes and recreates seeded business requirements

Do not run it automatically in Vercel preview or production.

If preview data is needed later:
- create a separate preview-safe seeding script
- gate it explicitly by environment
- avoid shared/demo credentials

## Deployment Workflow

### First hosted deployment
1. Create or connect the Merex Vercel project
2. Set app root to this repository directory
3. Add baseline env vars only
4. Deploy current state
5. Apply committed Prisma migrations to the hosted database
6. Verify app and API connectivity

### Ongoing preview-first workflow
1. Develop locally
2. Create migration locally if schema changes
3. Commit schema and migration files together
4. Deploy to preview
5. Run `prisma migrate deploy` against preview/shared target database
6. Verify preview behavior
7. Promote to stable only after preview validation

### Current schema expansion note

Recent business-side revamp adds new Prisma entities/fields:
- `BusinessProfile` Instagram-link fields for business OAuth linking
- `BusinessSettings` persisted settings model
- Wallet domain models: `WalletAccount`, `WalletTransaction`, `WalletCommitment`

Ensure migration files for these are applied in preview before production promotion.

### Release checklist (creator insights + Graph-only rollout)
1. Confirm Bright Data cleanup is present in the deployment diff (no `BRIGHTDATA_` envs/references).
2. Confirm env vars in target Vercel environment:
   - `INSTAGRAM_CLIENT_ID`
   - `INSTAGRAM_CLIENT_SECRET`
   - `INSTAGRAM_REDIRECT_URI`
   - `INSTAGRAM_SCOPE`
3. Confirm Meta app redirect URI exactly matches deployed callback URL.
4. Deploy to preview and verify creator production insights:
   - page: `/creator/profile` (Insights section + refresh)
   - API: `GET/POST /api/creator/insights`
5. Run creator insights matrix (success + controlled failures) before production promotion.
6. Promote preview to production only after successful matrix run.

## Instagram OAuth Rollout

Do not enable Instagram OAuth until the hosted domain is stable.

Once hosted:
- Set Meta redirect URI to:
  - `https://<hosted-domain>/api/auth/instagram/callback`
- Set `INSTAGRAM_REDIRECT_URI` to the exact same value
- Test:
  - Instagram-first signup/login
  - Email-first signup followed by Instagram connect
  - Creator insights refresh at `/creator/profile` (deployed domain only)

### Important testing note

- Instagram OAuth/API behavior should be validated on hosted domains configured in Meta app settings.
- Localhost/manual local domains are useful for UI iteration but are not authoritative for final Instagram Login capability validation.

## Creator insights QA guide (hosted domains)

### Preconditions
- Use a creator account in Merex with connected Instagram.
- Confirm app/user grant includes required insights permission.

### Smoke test
1. Login as creator and open `/creator/profile`.
2. Scroll to `Instagram insights` and run `Refresh insights`.
3. Expect:
   - account summary + latest media rows visible
   - insights table values for selected media
   - status badge and diagnostics (`COMPLETE` / `PARTIAL` / `NO_DATA` / `ERROR`)
   - no fallback/provider messaging

### Negative test matrix
- **Expired token**: revoke token and rerun -> expect `TOKEN_EXPIRED_OR_INVALID`.
- **Scope gap**: remove/deny insights scope -> expect `PERMISSION_SCOPE_GAP`.
- **No media**: creator account without media -> expect `NO_MEDIA_FOUND`.
- **Incompatible metric/media**: request mismatched metric -> expect `INSIGHTS_UNAVAILABLE_FOR_MEDIA`.

### Exit criteria
- Creator can refresh insights in production UI without admin-only routes.
- Insights responses include actionable remediation hints.
- No fallback-source messaging appears in payout/deal screens.
- Submitted reel views refresh uses the submitted reel media-id/permalink path first.

## Current Caveats Before Production

- Header-based auth fallback still exists in `src/lib/auth.ts`
- Razorpay webhook signature verification is still incomplete
- Login debug instrumentation should be removed before true production use
- Current seed strategy is not safe for hosted shared environments

## Operational Principles

- Always create migrations locally first
- Always commit migration files before shared deployment
- Always apply migrations to preview before production
- Never patch shared schema manually unless recovering from a known incident
- Keep preview/demo data isolated from production data
