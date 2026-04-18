# Instagram API spike (Instagram Login path)

## Product in use

Walnut uses **Instagram API with Instagram Login** (not Facebook Login): OAuth at `api.instagram.com`, Graph calls to `graph.instagram.com` (see `src/lib/integrations/instagram.ts`).

## Decision (no auth-path migration)

Stay on **Instagram Login** for P0–P1; extend scopes and jobs rather than migrating to `graph.facebook.com` + Facebook Login unless Marketing API / Page-centric features are required later.

## Scopes (verify in Meta App Dashboard)

- Default: `instagram_business_basic` (identity).
- For follower account insights and media insights: request the current **instagram_business_*** insights scope(s) shown in the dashboard (names change; do not rely on deprecated `instagram_manage_insights` from old blog posts).
- **App Review** and **Advanced Access** are required for production users outside roles/testers.

## Long-lived tokens

Short-lived user tokens from the authorization code exchange should be exchanged for **long-lived** tokens per Meta’s Instagram Login documentation, then stored encrypted (`TOKEN_ENCRYPTION_KEY` / `SESSION_SECRET` derivation in `src/lib/token-crypto.ts`). Implement a **refresh job** before expiry (often ~60 days for long-lived user tokens—confirm in current docs).

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
