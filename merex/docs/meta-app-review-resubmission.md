# Meta App Review — Resubmission notes (paste into the App Review form)

Use these texts verbatim in the Meta App Review form fields. They replace the
previous submission notes that contained `[YOUR ...]` placeholders and that
referenced surfaces that did not exist. The accompanying code changes ship the
`/creator/profile` insights card the reviewers need to see, and consolidate the
OAuth flow on `https://www.merex.in`.

Before submitting, confirm:

- Vercel project has `www.merex.in` as the canonical Production domain.
- Meta App Dashboard -> Instagram -> Basic settings -> Valid OAuth Redirect URIs
  contains `https://www.merex.in/api/auth/instagram/callback`.
- Meta App Dashboard -> Instagram -> Basic settings has:
  - **Deauthorize Callback URL** = `https://www.merex.in/api/meta/deauthorize`
  - **Data Deletion Request URL** = `https://www.merex.in/api/meta/data-deletion`
- Production env has:
  - `NEXT_PUBLIC_APP_URL=https://www.merex.in`
  - `INSTAGRAM_REDIRECT_URI=https://www.merex.in/api/auth/instagram/callback`
  - `INSTAGRAM_SCOPE=instagram_business_basic,instagram_business_manage_insights`
  - `INSTAGRAM_CLIENT_SECRET=...` (the app secret used to verify Meta-signed
    `signed_request` payloads on the two callback endpoints).
- The database migration `20260511060000_meta_platform_requests` has been
  applied on the production Neon database (`npm run prisma:migrate:deploy`
  during the next Vercel build, or via `vercel env pull` + manual run).
- Visiting `https://www.merex.in/api/auth/instagram/start?mode=login&role=creator`
  redirects to `https://api.instagram.com/oauth/authorize?...` with
  `scope=instagram_business_basic%2Cinstagram_business_manage_insights`.

---

## App identity (paste into "App credentials" / "How to access" fields)

- App ID: `1267257992161238`
- Auth mode: **Instagram Login** (user OAuth). This is **not** a server-to-server
  app and it does **not** use a system user token. Reviewers will see the
  Instagram consent screen and grant permissions interactively.
- Instagram Client ID (Instagram product): `2493697741065974`
- Valid OAuth Redirect URI (must match dashboard exactly):
  `https://www.merex.in/api/auth/instagram/callback`
- Production URL: `https://www.merex.in`
- Privacy Policy: `https://www.merex.in/privacy`
- **Deauthorize Callback URL:** `https://www.merex.in/api/meta/deauthorize`
- **Data Deletion Request URL:** `https://www.merex.in/api/meta/data-deletion`
- Data deletion status page: `https://www.merex.in/privacy/data-deletion`
- Terms of Service URL (if requested): `https://www.merex.in/privacy` (same
  document covers Instagram platform data use; Merex does not yet ship a
  separate ToS page).

---

## Permission: instagram_business_basic — "Tell us how you're using this permission"

> Merex (product name: Merex) is a creator marketplace. Creators sign in via
> Instagram Login (not Facebook Login). After OAuth, Merex uses
> `instagram_business_basic` to call `GET /me?fields=id,username,account_type`
> on `graph.instagram.com` from the authenticated Instagram professional
> (Creator / Business) account.
>
> The resolved Instagram `@username`, account type, follower count, and profile
> photo are displayed to the creator on `/creator/profile` as the canonical
> identity of their Merex account, and are used internally to (1) bind each
> Merex user record to the correct Instagram professional account, (2) prevent
> duplicate accounts, and (3) match the creator to campaigns. The same
> identity is shown in the connection chip and in the "Update from Instagram"
> button, which explicitly labels the Graph endpoint and permission it uses.
>
> The button on `/creator/profile` titled "Update from Instagram" triggers
> `GET /me` to refresh handle, photo, followers, and media count. No data is
> sold or shared with third parties; aggregated/anonymized derivatives are
> only used to operate creator-facing features and improve reliability.

---

## Permission: instagram_business_manage_insights — "Tell us how you're using this permission"

> Merex uses `instagram_business_manage_insights` exclusively on behalf of the
> authenticated creator's own Instagram professional account to verify the
> performance of the creator's own published content for active campaigns.
>
> Two product surfaces exercise this permission, both visible without any
> brand-side setup:
>
> 1. **`/creator/profile` -> "Instagram insights" card.** After Instagram is
>    connected, the page mounts a card that lists the creator's most recent 10
>    media via `GET /me/media` and, for the selected media, calls
>    `GET /{media-id}/insights` on `graph.instagram.com`. The card's helper
>    text explicitly states the Graph endpoint and the permission being used.
>    Metric selection is media-type aware:
>    - REELS / VIDEO: views, reach, likes, comments, saved, shares
>    - STORY: views, reach, replies, shares
>    - Other media: reach, likes, comments, saved, shares
> 2. **`/creator/deals/[contractId]` -> "Refresh views" / "Save link & refresh
>    views".** When a creator submits the public URL of a published Reel on an
>    active deal, the same `GET /{media-id}/insights` endpoint records verified
>    view counts that feed CPV (cost-per-view) payouts and the deliverable's
>    performance report. This is implemented server-side via
>    `syncContractMetrics` / metrics refresh, never via manual entry.
>
> Aggregated / anonymized statistics are used internally to monitor reliability
> (for example identifying media types where insights are unavailable). Merex
> does not access other users' Instagram data beyond what the authenticated
> creator's own token allows, and does not sell any Instagram data.

---

## Reviewer testing instructions — "Provide instructions for accessing the app"

```
Production URL: https://www.merex.in
Auth mode: Instagram Login (user OAuth)
Note: This is NOT a server-to-server app. It does NOT use a system user
token. The reviewer will see the standard Instagram consent screen and
will grant permissions interactively.
Browser: Chrome or Edge (desktop), normal or incognito window
Prerequisite: An Instagram professional (Creator or Business) account
controlled by the reviewer. Do not share Instagram passwords.

----------------------------------------------------------------
Step 1 — Sign in as a creator
----------------------------------------------------------------
1. Open https://www.merex.in/login/creator
2. Click "Continue with Instagram"
3. Complete Instagram sign-in in the same browser window
4. On the consent screen, approve BOTH of the requested permissions:
     - instagram_business_basic
     - instagram_business_manage_insights
5. You will be redirected back to Merex and land on /creator/profile
   (with ?onboarding=1 if your account is brand new). For existing
   creators, you may land on /creator instead.

----------------------------------------------------------------
Step 2 — Verify instagram_business_basic
----------------------------------------------------------------
On /creator/profile, confirm:
  - Your @username appears as the primary heading.
  - Your Instagram profile photo is shown.
  - Follower count and post count are populated.
  - These values come from graph.instagram.com /me, which is the
    documented use of instagram_business_basic.

Click "Update from Instagram" on the profile header. The button's helper
text states it calls Instagram Graph /me and uses
instagram_business_basic. The values refresh on click.

----------------------------------------------------------------
Step 3 — Verify instagram_business_manage_insights
----------------------------------------------------------------
On the same /creator/profile page, scroll to the card titled
"Instagram insights (live)".

1. The card lists up to 10 of your most recent media items
   (loaded via GET /me/media).
2. Pick any item from the dropdown. The card calls
   GET /{media-id}/insights on graph.instagram.com.
3. The insights table populates with the media's metric rows
   (e.g. views, reach, likes, comments, saved, shares for a Reel).
4. The card's caption explicitly names the Graph endpoint and the
   instagram_business_manage_insights permission it uses.
5. Click "Refresh insights" to repeat the call on demand.

If your test account does not have any media yet, the card will display
a clear "NO_DATA_YET" banner — the permission is still being used, the
endpoint simply has nothing to return.

----------------------------------------------------------------
Step 4 (optional, in-product context) — Insights inside a deal
----------------------------------------------------------------
The same /{media-id}/insights call is wired into the deal workflow at
/creator/deals/[contractId]. Saving a public Instagram Reel URL on an
active deal and clicking "Refresh views" calls
GET /{media-id}/insights and records the verified view count. The
buttons there have tooltips and helper text naming the Graph endpoint
and the permission. Reviewers can skip this step if no active deal
exists on the test account; Step 3 is sufficient to verify the
permission end-to-end.
```

---

## Files to attach in the App Review form

- Screencast for `instagram_business_basic`: one .mp4 covering Steps 1–2 (and
  optionally Step 3 in the same take).
- Screencast for `instagram_business_manage_insights`: one .mp4 covering Steps
  1, 3 (and optionally 4). If the same continuous take covers both
  permissions end-to-end, the same file can be uploaded against both
  permissions.

---

## Screencast script (mandatory English voiceover OR burnt-in captions)

Record ONE continuous take, 3–4 minutes, at >= 1080p, MP4. Keep the browser
language set to English. Do not cut the consent screen.

1. Show a clean Chrome incognito window with `https://www.merex.in` in the URL
   bar. Narrate that this is the Merex production site.
2. Navigate to `https://www.merex.in/login/creator`. Narrate "Merex uses
   Instagram Login (not Facebook Login)."
3. Click "Continue with Instagram". The browser navigates to
   `api.instagram.com/oauth/authorize`.
4. Show the **full Instagram consent screen including the permission list**
   (`instagram_business_basic` AND `instagram_business_manage_insights`).
   Hold for ~2 seconds. Narrate "I am granting both requested permissions."
5. Click Allow. Show the redirect landing on `/creator/profile` (or
   `?onboarding=1`).
6. Point the cursor at the Instagram handle, photo, and follower count.
   Narrate: "These values come from `GET /me` on `graph.instagram.com` — this
   is `instagram_business_basic` in use." Click "Update from Instagram" and
   show the values refresh.
7. Scroll to the "Instagram insights (live)" card. Open the media picker, pick
   a recent media item. Narrate "Merex now calls
   `GET /{media-id}/insights` — this is
   `instagram_business_manage_insights` in use." Show the populated metrics
   table. Click "Refresh insights" once to repeat the call.
8. (Optional) Navigate to a prepared `/creator/deals/<contractId>` page and
   click "Refresh views"; show the view count update and the tooltip text
   naming the Graph endpoint.
9. End on `https://www.merex.in/privacy` to show the privacy policy.

Best practice rules from Meta's Screen Recording Guide that the prior take
violated and that this take must satisfy:

- English UI everywhere.
- English voiceover OR burnt-in captions throughout.
- Tooltips / helper text visible (the new in-product captions added in this
  release satisfy this).
- The Instagram consent screen is shown un-cut.
- The recording uses the real production URL `https://www.merex.in`, not a
  preview / Vercel URL.

---

## Deauthorize and data-deletion endpoints (required by Meta)

Both endpoints expect Meta's standard `signed_request` body
(`application/x-www-form-urlencoded`, value of `<base64url(sig)>.<base64url(payload)>`,
signed with HMAC-SHA256 using the app secret). They are implemented in
`src/app/api/meta/deauthorize/route.ts` and
`src/app/api/meta/data-deletion/route.ts`, and use the shared verifier in
`src/lib/integrations/meta-signed-request.ts`.

### Deauthorize Callback URL

- URL: `https://www.merex.in/api/meta/deauthorize`
- Trigger: a user removes Merex from Instagram -> Settings -> Security ->
  Apps and Websites.
- Behaviour: clears `instagramUserId`, `instagramUsername`, `instagramHandle`,
  `instagramAccountType`, `instagramConnectedAt`,
  `instagramAccessTokenEncrypted`, `instagramTokenExpiresAt`,
  `instagramStatsSyncedAt`, `instagramProfilePictureUrl`, and the follower /
  post / view aggregates on the matching `CreatorProfile` or
  `BusinessProfile`. The Merex user record is preserved so the user can
  reconnect later if they choose. A `MetaPlatformRequest` row is recorded
  for audit. Responds 200 `{ ok: true }`.

### Data Deletion Request URL

- URL: `https://www.merex.in/api/meta/data-deletion`
- Trigger: a user submits a Meta-initiated data-deletion request that names
  Merex.
- Behaviour: everything the deauthorize endpoint does, plus clears
  `Deliverable.instagramMediaId` on every deliverable owned by that
  creator's contracts so no Meta-derived media identifiers remain.
- Response (per Meta spec): JSON
  `{ "url": "https://www.merex.in/privacy/data-deletion?code=<id>",
     "confirmation_code": "<id>" }`.
- The status URL is a public Next.js page (`src/app/privacy/data-deletion/page.tsx`)
  that reads `MetaPlatformRequest.confirmationCode` and displays the
  request's state (`COMPLETED` / `RECEIVED` / `NO_MATCH` / `FAILED`).

### How a reviewer can test the endpoints

A reviewer normally does not need to hit these endpoints directly; the URLs
are validated by Meta's automated reachability probe in the App Dashboard.
If a reviewer wants to verify behaviour manually:

1. Sign in as a creator following Step 1 of the testing instructions.
2. Open Instagram -> Settings -> Security -> Apps and Websites and remove
   "Merex". Meta will POST `signed_request` to the Deauthorize Callback
   URL within a few minutes; the Merex profile loses its Instagram link
   on the next reload of `/creator/profile`.
3. To test data-deletion, click the "Request data deletion" link on the
   Instagram settings page. Meta will redirect the browser to
   `https://www.merex.in/privacy/data-deletion?code=<confirmation_code>`
   where the status row appears as `COMPLETED`.

---

## Pre-submit checklist

- [ ] Production env updated: `INSTAGRAM_SCOPE`,
      `INSTAGRAM_REDIRECT_URI`, `NEXT_PUBLIC_APP_URL`,
      `INSTAGRAM_CLIENT_SECRET`.
- [ ] Meta dashboard Valid OAuth Redirect URIs contains
      `https://www.merex.in/api/auth/instagram/callback`.
- [ ] Meta dashboard Deauthorize Callback URL is
      `https://www.merex.in/api/meta/deauthorize`.
- [ ] Meta dashboard Data Deletion Request URL is
      `https://www.merex.in/api/meta/data-deletion`.
- [ ] Database migration `20260511060000_meta_platform_requests` is applied
      on production.
- [ ] Vercel domain `www.merex.in` is set as canonical production.
- [ ] `/creator/profile` shows the Instagram insights card after Instagram
      connect.
- [ ] `/login/creator` and `/creator/connect-instagram` reference the privacy
      policy and the two permissions.
- [ ] `/privacy` references both callback URLs and links to the status page.
- [ ] Screencast follows the script above.
- [ ] All `[YOUR ...]` placeholders removed from submission notes.
