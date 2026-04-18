# Walnut Hosting And Migrations

This document is the operational reference for hosting Walnut on Vercel now and evolving toward safer shared-environment migrations over time.

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

## Required Environment Variables

### Baseline hosting
- `DATABASE_URL`
- `SESSION_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `COMMISSION_PERCENT`

### Instagram OAuth (enable after hosted URL is stable)
- `INSTAGRAM_CLIENT_ID`
- `INSTAGRAM_CLIENT_SECRET`
- `INSTAGRAM_REDIRECT_URI`
- `INSTAGRAM_SCOPE`

### Optional / future
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

## Vercel Deployment Notes

- `vercel.json` points builds to `npm run vercel:build`
- `npm run vercel:build` runs:
  - `prisma generate`
  - `next build`
- Migrations are intentionally **not** run automatically during Vercel build
- Shared-environment migrations must be applied explicitly using:
  - `npm run prisma:migrate:deploy`

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
1. Create or connect the Walnut Vercel project
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

## Instagram OAuth Rollout

Do not enable Instagram OAuth until the hosted domain is stable.

Once hosted:
- Set Meta redirect URI to:
  - `https://<hosted-domain>/api/auth/instagram/callback`
- Set `INSTAGRAM_REDIRECT_URI` to the exact same value
- Test:
  - Instagram-first signup/login
  - Email-first signup followed by Instagram connect

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
