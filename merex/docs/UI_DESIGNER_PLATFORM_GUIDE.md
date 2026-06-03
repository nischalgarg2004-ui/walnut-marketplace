# Merex Platform Guide for UI / UX Designers

This document describes **what exists in the product today**—primary user journeys, information architecture (navigation), and what each surface is for—so designers can map screens, tabs, states, and copy without reading the codebase.

**Product framing:** Merex connects **businesses** (brands posting campaigns and paying for work) with **creators** (who browse opportunities, apply, and fulfill deliverables). Campaigns can emphasize **UGC** (organic-style content workflows) or **Clipping** (volume visibility / repurposing workflows). Payment, review, and delivery paths differ partly by campaign type.

**How to read this:** Use **Section 1** for shared marketing and auth flows, **Section 2** for the creator workspace, **Section 3** for the business workspace. Routes are given as paths (for example `/creator/deals`) to align with IA and QA.

---

## 1. Common experience (landing → account choice → signup / sign-in)

### 1.1 Marketing and public entry

| Route | Purpose | Designer notes |
|-------|---------|------------------|
| `/` | Public landing / hero | Positions the product (FFAB: “Fast Fame At Bulk”), highlights Clipping, payments, and UGC. Primary CTA is **Sign In**; secondary scrolls to **About / features**. |

Other public pages (for example `/privacy`) may exist for policy content; they use the broader public chrome, not creator/business shells.

### 1.2 Account creation (signup)

| Route | Purpose |
|-------|---------|
| `/signup` | Hub: choose **Creator signup** or **Business signup**, or go to login if the user already has an account. |
| `/signup/creator` | Creator registration flow (dedicated onboarding for creator role). |
| `/signup/business` | Business registration flow (dedicated onboarding for business role). |

**Journey:** Land → Create account → pick role-specific signup → eventually land in the correct workspace after authentication.

### 1.3 Sign-in and workspace choice

| Route | Purpose |
|-------|---------|
| `/login` | **Step 1 — Choose workspace**: Creator vs Business (with optional “account suspended” messaging). Links onward to `/login/creator` or `/login/business`, and to `/signup`. |
| `/login/creator` | Creator sign-in (can receive `next=` return path, e.g. `/creator`). |
| `/login/business` | Business sign-in (default continuation often `/business/home`). |

**Out of scope for this doc but present in the app:** Admin sign-in (`/login/admin`) and the **admin** app live on a separate hostname when configured; designers focused on marketplace UX can treat admin as internal tooling.

### 1.4 Access control (what designers should expect)

- Unauthenticated visits to `/creator/*` or `/business/*` are redirected to the appropriate login with a `next=` parameter so users return to their intended page after sign-in.
- Creator and business **layouts enforce role**: a creator cannot load business routes (and vice versa); users are bounced to the correct workspace.
- **Suspended accounts** are redirected to login with an error state explaining suspension.

Design implication: preserve **clear role selection** early (login hub and signup hub) to avoid wrong-workspace confusion; error and empty states should align with these redirects.

---

## 2. Creator interface

### 2.1 Shell and primary navigation

Logged-in creators use **CreatorAppShell**. Primary sidebar destinations:

| Label (nav) | Route | Role |
|---------------|-------|------|
| Home | `/creator` | Main **opportunities feed** (browse campaigns, filters, apply). |
| Applications | `/creator/applications` | Track applications and their outcomes. |
| Deals | `/creator/deals` (detail: `/creator/deals/[contractId]`) | Active contracts / deliverables after acceptance. |
| Earnings | `/creator/earnings` | Payout-oriented view; may surface receivables vs history depending on product state. |
| Profile | `/creator/profile` | Creator profile and **onboarding** (when required). |
| Settings | `/creator/settings` | Account / preferences. |

**Header:** Mobile menu, email, log out. No **Notifications** item in the creator shell (creators use deep links and in-app states; business has a notifications entry—see Section 3).

### 2.2 Core creator journey (happy path)

1. **Sign in** as creator → land in `/creator` (Home).
2. **Gating before the feed:** If Instagram is not connected, the client redirects to **`/creator/connect-instagram`**. If onboarding is required, redirect to **`/creator/profile?onboarding=1`**.
3. **Home (`/creator`):** Scrollable feed of opportunities (campaign cards with brief, compensation hints, category UGC vs CLIPPING, filters such as eligible-only, pay types, sort). User opens a campaign for detail/apply.
4. **Opportunity detail:** **`/creator/opportunity/[id]`** — full brief, criteria, apply CTA.
5. **Applications (`/creator/applications`):** Status of each application; bridge from “applied” to “accepted.”
6. **Deals:** On acceptance, work moves to **`/creator/deals`** and per-contract **`/creator/deals/[contractId]`**. Here creators submit and iterate on deliverables (UGC often involves **draft → publish link** style stages; clipping flows may skip draft and focus on link/sample verification—align UI with campaign category).
7. **Earnings (`/creator/earnings`):** Visibility into money movement (active receivables vs paid history as implemented).

**Redirects (legacy paths):** `/creator/opportunities` and `/creator/dashboard` redirect to **`/creator`** so IA treats **Home** as the single discovery hub.

### 2.3 Secondary / supporting creator routes (not all in main nav)

| Route | Purpose |
|-------|---------|
| `/creator/connect-instagram` | OAuth / connection flow required for eligibility and identity signals. |
| `/creator/requirements` | Requirements-related view (supporting compliance or campaign rules—use for edge flows). |
| `/creator/projects` | Project-style grouping or archive (if surfaced in UI). |
| `/creator/clips` | Clipping-specific creator surface if present in your build. |

Designers should confirm with product/engineering which of these are **first-class** in the current release vs **hidden** / deep-linked.

### 2.4 Domain concepts to reflect in UI

- **Opportunity** = open campaign a creator can apply to.
- **Application** = creator’s request to participate; business reviews and accepts/declines.
- **Deal / contract** = accepted engagement with deliverable slots and review cycles.
- **UGC vs CLIPPING** = different expectations for assets, review, and “done” (avoid one-size-fits-all copy and step lists).
- **Earnings** = tied to verified completion / payout lifecycle; show **pending vs available** clearly if both exist.

---

## 3. Business interface

### 3.1 Shell and primary navigation

Logged-in businesses use **BusinessAppShell**. Primary sidebar destinations:

| Label (nav) | Route | Role |
|---------------|-------|------|
| Home | `/business/home` (also `/business` → redirect) | Dashboard: summaries, notifications feed, spotlight reels/analytics snippets. |
| Campaigns | `/business/campaigns` (detail `/business/campaigns/[id]`) | List and manage campaigns. |
| Applications | `/business/applications` | Review creator applications to campaigns. |
| Deals | `/business/deals/board` | Board / queue of deals and “next actions” across accepted work. |
| Clips Ops | `/business/clips` | Operational view for clipping workflows (samples, publish verification, ops metrics). |
| Create Campaign | `/business/campaigns/create` (related: `/business/campaigns/new`) | Campaign creation wizard / form entry. |
| Database Manager | `/business/database` | Data-heavy manager for connected records (see **nav quirk** below). |
| Funds | `/business/funds` | Wallet / top-up / balance context (Razorpay checkout when enabled). |
| Notifications | `/notifications` | Cross-workspace notification list (implementation may use static/demo content—verify in environment). |
| Profile | `/business/profile` | Brand / business profile. |
| Settings | `/business/settings` | Account / team / preferences. |

**Nav quirks (important for active states and wayfinding):**

- **Database Manager** is considered active not only on `/business/database` but also on **`/business/applications`**, **`/business/applications/*`**, and **`/business/deals*`**—so the sidebar highlights “Database Manager” when users are deep in applications or deal routes that sit under that mental model.
- **Funds** is considered active on **`/business/funds`**, **`/business/payouts`**, and **`/business/operations/payouts`**—treating payouts as part of the money center.

**Layout:** Business main content uses a **wider max width** on “data-heavy” routes (database, deals board) vs standard pages.

### 3.2 Core business journey (happy path)

1. **Sign in** as business → **`/business/home`**.
2. **Create campaign** via **Create Campaign** → publish/list campaigns under **Campaigns**.
3. **Applications:** Review inbound creator applications; accept or reject. Accepted work becomes **deals**.
4. **Deals board:** Operate at scale—see which contracts need review, draft approval, publish-link verification, or completion.
5. **Clips Ops:** For clipping-heavy programs, monitor pipeline health (submitted → approved → published → verified → paid style stages—align labels with live data).
6. **Funds / payouts:** Ensure balance covers commitments; trigger or track payouts; use **operations** sub-routes if present for deliverables/payout batches.
7. **Profile / settings:** Maintain brand identity and operational preferences.

### 3.3 Additional business routes (detail and operations)

| Route area | Purpose |
|------------|---------|
| `/business/campaigns/[id]` | Single campaign: edit, requirements, performance, links to applications. |
| `/business/deals/[contractId]` | Single deal workspace: parallel to creator’s deal view; review deliverables, request changes, verify links. |
| `/business/deliverables` | Cross-deal deliverable list or operational table (if enabled in nav or deep links). |
| `/business/payouts` | Payout listing / actions (grouped under Funds active state). |
| `/business/operations`, `/business/operations/payouts`, `/business/operations/deliverables` | Internal-style operations consoles for batches and processing. |

Designers should treat **Campaigns → Applications → Deals → Funds** as the **macro spine** of business UX, with **Clips Ops** as a specialty lane for clipping SKUs.

### 3.4 Domain concepts to reflect in UI

- **Campaign** = the unit of demand (brief, budget model, category, requirements).
- **Application** = creator’s pitch; business decision converts it into a **contract/deal**.
- **Deal board** = operational triage; emphasize **next action** per row/card.
- **Funds** = prefunding / wallet / top-up; pair with **payouts** so finance users see **available vs committed vs paid out**.
- **Clipping vs UGC** = different review columns, statuses, and success metrics on dashboards.

---

## 4. Quick reference: who sees what

| Surface | Creators | Businesses |
|---------|----------|--------------|
| Marketing `/` | Yes | Yes |
| Signup / login hubs | Yes | Yes |
| `/creator/*` app shell | Yes | No (redirect) |
| `/business/*` app shell | No (redirect) | Yes |
| `/notifications` | Possible direct link | Linked from business nav |
| Admin app | No | No |

---

## 5. Design handoff checklist

- **Role clarity:** Every authenticated screen should make **Creator** vs **Business** context obvious (chrome, copy, primary tasks).
- **Category clarity:** When a flow touches **UGC** or **Clipping**, surface the type early and adapt steps/copy.
- **State coverage:** Applications (pending/accepted/rejected), deals (per deliverable stage), funds (insufficient balance, pending top-up, paid), and **empty** states for each primary nav item.
- **Mobile:** Both shells use a **collapsible sidebar** and sticky top bar on small viewports; validate touch targets and table density on **Deals board** and **Database Manager**.

---

*This guide reflects the Next.js `src/app` routes and `CreatorAppShell` / `BusinessAppShell` navigation as implemented in the repository. If engineering adds routes or renames labels, update this document in the same PR.*
