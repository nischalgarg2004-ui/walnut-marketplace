# Merex rebrand (executed)

## Decisions applied

| Area | Choice |
|------|--------|
| Product name | **Merex** everywhere in UI |
| Support email | **hello@merex.in** (unchanged domain) |
| Transactional email from | **Merex &lt;no-reply@merex.app&gt;** until Merex domain is live |
| Session cookie | **merex_session** (kept — no mass logout) |
| Theme storage | **merex_theme** (migrates from `Merex_theme`) |
| IG token salt | **merex:ig-token** (kept — no forced reconnect) |
| Package / local DB | **merex** (`package.json`, Docker `merex` database) |
| Privacy / Meta URLs | **`NEXT_PUBLIC_APP_URL`** via `appUrl()` in `@/lib/brand` |
| Logos | Reuse `/brand/Merex/logo-round-*.png` (abstract; Merex name in UI only) |
| Social footer | Removed until Merex accounts exist |
| Seed demo emails | **@merex.demo** unchanged |
| Production domain | **www.merex.in** until DNS cutover |

## Source of truth

`src/lib/brand.ts` — `BRAND_NAME`, `SUPPORT_EMAIL`, `appUrl()`, logo paths, cookie name.

## Phase 2 (later): domain cutover

1. Point `NEXT_PUBLIC_APP_URL` and Meta OAuth URLs to the new domain.
2. Update Vercel canonical domain + redirects from merex.in.
3. Resend verified domain + `RESEND_FROM_EMAIL`.
4. Meta App Review display name and callback URLs.

## Verify

```bash
rg -i "Merex|walnut" --glob "!node_modules" --glob "!.next"
```

Expected remaining hits: `hello@merex.in`, `merex.app` email, `/brand/Merex/` logo paths, `merex.in` in `getAppOrigin()` fallback, `Merex_theme` legacy key, `merex_session`, `merex:ig-token`, `@merex.demo` seeds, Vercel project slug in ops notes.
