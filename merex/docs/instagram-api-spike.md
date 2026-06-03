# Instagram API spike (Instagram Login path)

## Product in use

Merex uses **Instagram API with Instagram Login** (not Facebook Login): OAuth at `api.instagram.com`, Graph calls to `graph.instagram.com` (see `src/lib/integrations/instagram.ts`).

## Decision (no auth-path migration)

Stay on **Instagram Login** for P0–P1; extend scopes and jobs rather than migrating to `graph.facebook.com` + Facebook Login unless Marketing API / Page-centric features are required later.

## Scopes (verify in Meta App Dashboard)

- Required on production: `instagram_business_basic` (identity) **and** `instagram_business_manage_insights` (per-media insights).
- Both scopes are passed as a comma-separated value via the `INSTAGRAM_SCOPE` env (see `src/lib/integrations/instagram.ts` `buildInstagramAuthorizeUrlWithRedirectUri`).
- Do not rely on deprecated `instagram_manage_insights` from old blog posts; the dashboard name is `instagram_business_manage_insights`.
- **App Review** and **Advanced Access** are required for production users outside roles/testers.

## Long-lived tokens

Short-lived user tokens from the authorization code exchange should be exchanged for **long-lived** tokens per Meta’s Instagram Login documentation, then stored encrypted (`TOKEN_ENCRYPTION_KEY` / `SESSION_SECRET` derivation in `src/lib/token-crypto.ts`). Implement a **refresh job** before expiry (often ~60 days for long-lived user tokens—confirm in current docs).

### Merex rollout notes

- OAuth callback now exchanges short-lived token -> long-lived token and stores `instagramTokenExpiresAt`.
- Sync flows refresh tokens proactively near expiry (14-day window).
- Graph API version is pinned to `v25.0`.
- Reel metrics are sourced from Graph API only; when Graph is unavailable, Merex keeps last-known stored metrics as fallback.

### Live-domain creator insights validation

- Merex validates Instagram Login capability directly in creator production surfaces:
  - API: `GET / POST /api/creator/insights` (`src/app/api/creator/insights/route.ts`)
  - UI: `/creator/profile` renders the `CreatorInstagramInsightsCard` component (`src/components/creator/CreatorInstagramInsightsCard.tsx`) when the creator's Instagram is connected. The card lists the latest 10 media, lets the creator pick one, shows the insights table, and surfaces `Refresh insights`.
  - UI: `/creator/deals/[contractId]` exposes the same `/{media-id}/insights` path via "Refresh views" / "Save link & refresh views" for campaign-linked deliverables.
- Probe flow (creator path):
  1. Validate stored token / optional refresh.
  2. `GET /me` on `graph.instagram.com`.
  3. `GET /me/media`.
  4. `GET /{media-id}/insights`.
- API/UI return structured diagnostics (`scope gaps`, token issues, no-media, insights unavailable) and timestamps.
- This flow is deployment-domain-first; local non-whitelisted domains are not authoritative for OAuth/API behavior.

### Metric compatibility + display behavior

- Merex now requests insights using a media-type-aware metric policy:
  - REELS/VIDEO: `views, reach, likes, comments, saved, shares`
  - STORY: `views, reach, replies, shares`
  - other media: `reach, likes, comments, saved, shares`
- Creator profile insights UI shows:
  - selected media
  - status (`COMPLETE` / `PARTIAL` / `NO_DATA` / `ERROR`)
  - unsupported metrics list (when metric is incompatible for that media type)
- Empty data is treated as a first-class state (`NO_DATA_YET`) rather than zero.

### Reel submission view sync rules

- Contract metrics sync prioritizes the submitted reel deliverable when resolving media id.
- Resolution order:
  1. submitted reel deliverable `instagramMediaId`
  2. resolve from submitted reel permalink
  3. fallback to any available media id on contract deliverables
- Failure messaging distinguishes:
  - missing token
  - unresolved submitted media id
  - Graph endpoint unavailable for submitted reel

### Deployment runbook (Vercel domain only)

1. Confirm Meta app setup:
   - Product: **Instagram API with Instagram Login**.
   - Redirect URI exactly equals `https://<host>/api/auth/instagram/callback`.
   - Scopes configured and granted for the tester call pattern:
     - `instagram_business_basic`
     - `instagram_business_manage_insights` (for media insights probes).
2. Confirm runtime env on deployment:
   - `INSTAGRAM_CLIENT_ID`
   - `INSTAGRAM_CLIENT_SECRET`
   - `INSTAGRAM_REDIRECT_URI` (must be `https://www.merex.in/api/auth/instagram/callback` on production)
   - `INSTAGRAM_SCOPE` (must be `instagram_business_basic,instagram_business_manage_insights` on production)
3. Open `/creator/profile` and run `Refresh insights` on the Instagram insights card with a connected creator profile.

### Troubleshooting flow

- `TOKEN_MISSING`: profile has no stored encrypted token. Reconnect Instagram from hosted app.
- `TOKEN_EXPIRED_OR_INVALID`: token refresh/re-auth needed; verify callback URI and app mode.
- `PERMISSION_SCOPE_GAP`: required permission not granted in app/user grant.
- `NO_MEDIA_FOUND`: account has no media visible to current token.
- `INSIGHTS_UNAVAILABLE_FOR_MEDIA`: metric/media-type mismatch, story window expired, or insufficient data.

### Verification matrix for deployed run

- Case A (`SUCCESS`): valid token + selectable media + valid metric set.
- Case B (`TOKEN_EXPIRED_OR_INVALID`): revoke token in Meta and rerun probe.
- Case C (`PERMISSION_SCOPE_GAP`): remove/deny insights scope and rerun probe.
- Case D (`INSIGHTS_UNAVAILABLE_FOR_MEDIA`): request incompatible metric for selected media type.
- Case E (`NO_MEDIA_FOUND`): run against a professional account with no media.

### Current implementation verification evidence

- Test suite (`npm run test`) passes after Bright Data decommission and Graph-only path updates.
- Repository search confirms no remaining `BRIGHTDATA_` env/runtime references.
- Creator-facing probe route/UI is implemented in production creator surfaces with Graph-only calls.

## Endpoints to validate in a real app (manual / automated against dev users)

1. `GET /{api-version}/me?fields=...` — already used.
2. User insights: documented under Instagram Platform insights (e.g. follower demographics / counts where permitted).
3. Media list + media id resolution for a published reel/post URL (may require media discovery endpoints applicable to your token).
4. `GET /{media-id}/insights?metric=views,...` — confirm metrics available per media type; **story** metrics are time-bounded (often ~24h).

## Gaps vs CPV automation (expected)

- **Latency:** insights can lag (up to ~48h in docs).
- **Stories:** narrow insight window; CPV on stories may need attestation fallback.
- **Carousels / albums:** may have limited or no insights; hybrid **manual attestation** in product.
- **Rate limits:** batch cron (`/api/internal/metrics/sync`) and backoff.

## References (Meta)

- [Instagram API with Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/)
- [Instagram media insights](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights/)
