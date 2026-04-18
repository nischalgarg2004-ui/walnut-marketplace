# Project Walnut - India Creator Marketplace MVP

Lean MVP for a two-sided marketplace where brands post creator requirements and creators apply based on eligibility.

## Implemented Scope

- Auth + RBAC: HTTP-only session cookie (`walnut_session`, signed with `SESSION_SECRET`), login at `/login`
- Creator and business profile schema
- Requirement posting with eligibility and compensation models
- Creator application flow with eligibility checks
- Business approval workflow and contract snapshot creation
- Deliverable submit/review flow
- Payout calculation and trigger API with commission capture
- Razorpay webhook handler scaffold
- Admin metrics API and protected admin surface
- Creator and business profile APIs + onboarding pages
- Bulk application decision API for brand approval workflows
- Business operations APIs for applications, deliverables, contracts, and payouts

## Tech

- Next.js App Router + TypeScript
- PostgreSQL + Prisma
- Zod validations

## Setup

1. Install Node.js 20+ and npm.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` and **`SESSION_SECRET`** (used to sign session cookies; set a long random string in every environment).
3. Install dependencies:
   - `npm install`
4. Generate Prisma client and migrate:
   - `npm run prisma:generate`
   - `npm run prisma:migrate` (or `npx prisma migrate dev` to apply pending migrations, including `passwordHash` on `User`)
5. Seed demo data:
   - `npm run prisma:seed`
   - Writes `dummy_vars.json` at the repo root (listed in `.gitignore`) with emails, shared demo password, and role hints for 10 creators, 5 brands (25 published requirements total), and 1 admin. Regenerate any time with `npm run prisma:seed`.
6. Run app:
   - `npm run dev`
7. Open **`http://localhost:3000/login`** and sign in with an account from `dummy_vars.json`.

## Local-Hosted Workflow (Current Phase)

This repo is now prepared for local-first development and later hosting.

### Option A: Fast local scripts (recommended)

From `d:\Project Walnut\walnut-marketplace`:

- `npm run local:setup`
- `npm run local:run`

Health check:

- `GET http://localhost:3000/api/health`

Stop local services:

- `npm run local:stop`

### Option B: Dockerized local run (when Docker is installed)

- `docker compose up --build`

This starts:

- `db` (PostgreSQL on `localhost:5432`)
- `app` (Next.js on `localhost:3000`)

## Hosting later

When ready, you can host with:

- App: Vercel, Fly.io, Render, or ECS
- Database: Neon, Supabase, or RDS

No code changes should be required beyond environment variable updates and real auth/payment provider setup.

### Preview-first hosting workflow

Walnut is now structured to support a preview-first Vercel workflow:

- Use Vercel for hosted previews and stable deployments
- Use a hosted PostgreSQL database for shared environments
- Generate Prisma client during Vercel build with:
  - `npm run vercel:build`
- Apply shared-environment migrations explicitly with:
  - `npm run prisma:migrate:deploy`

Operational reference:

- See `HOSTING_AND_MIGRATIONS.md`

## Auth and API access

- Browser flows rely on the session cookie set by `POST /api/auth/login`. Role areas (`/creator/*`, `/business/*`, `/admin/*`) are protected by middleware (cookie presence) and server layouts (signature + role).
- Some `getSessionUser` paths still accept `x-user-id` / `x-role` / `x-email` for internal or legacy calls; prefer the cookie for normal use.

## Hosted environment variables

In addition to baseline database/session variables, Instagram OAuth requires:

- `INSTAGRAM_CLIENT_ID`
- `INSTAGRAM_CLIENT_SECRET`
- `INSTAGRAM_REDIRECT_URI`
- optional: `INSTAGRAM_SCOPE`

Do not enable Instagram OAuth on Meta until your hosted domain is stable and the callback URL is final.

## Business Ops Screens Added

- `/business/applications`: single and bulk approval decisions
- `/business/deliverables`: approve or request revision
- `/business/payouts`: trigger payouts and view payout ledger
