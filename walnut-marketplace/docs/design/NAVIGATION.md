# Navigation & routes (Part A5 — implementation baseline)

## Final labels (aligned with plan; adjust after research)

### Creator sidebar

| Label | Path | Notes |
|-------|------|-------|
| Home | `/creator` | Former dashboard content lives here |
| Opportunities | `/creator/opportunities` | |
| Applications | `/creator/applications` | |
| Deals | `/creator/deals` | List; detail `/creator/deals/[contractId]` |
| Earnings | `/creator/earnings` | |
| Profile | `/creator/profile` | |
| Settings | `/creator/settings` | |

**Removed from primary nav:** horizontal-only pattern. **Projects** (`/creator/projects`) — keep route but **not** in primary nav (link from profile/deals if needed) per IA consolidation.

### Business sidebar

| Label | Path |
|-------|------|
| Home | `/business` |
| Campaigns | `/business/requirements` |
| Applicants | `/business/applications` |
| Deals | `/business/deals/board` |
| Deliverables | `/business/deliverables` |
| Payouts | `/business/payouts` |
| Company | `/business/profile` |
| Settings | `/business/settings` *(add route if missing)* |

### Redirects

- `/creator/dashboard` → `/creator`
