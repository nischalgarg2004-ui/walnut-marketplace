# Landing + Onboarding Visual Audit

Date: 2026-04-30
Scope: `/`, `/login`, `/login/creator`, `/login/business`, `/signup/creator`, `/signup/business`

## Audit Pass 1 (Desktop-first)

### Findings
- **Major**: Legacy nav had competing actions (`Signup`, `Get started`) against login intent.  
  **Resolution**: Reduced nav to `Home`, `Privacy`, `Login`; promoted `Login` as primary visual action.
- **Major**: Hero conversion path was split across multiple actions with weak hierarchy.  
  **Resolution**: Replaced with one primary CTA (`Enter Merex`) and one trust-secondary action.
- **Major**: Onboarding continuity broke between `/login` and role pages.  
  **Resolution**: Added step framing and shared progress dots on login and role entry surfaces.
- **Minor**: Creator role naming was ambiguous (`Editor/Page (Clipping)`).  
  **Resolution**: Updated to `UGC Creator` and `Editor/Clipper` with explicit definition hints.

### Scorecard (0-2)

| Page | Hierarchy | Spacing | Typography | Conversion Clarity | Illustration Fit | Color Discipline | Responsive Integrity | Onboarding Continuity | Avg |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` | 2.0 | 1.8 | 1.9 | 2.0 | 1.8 | 1.9 | 1.8 | 1.8 | 1.88 |
| `/login` | 1.9 | 1.9 | 1.9 | 1.9 | 1.7 | 1.9 | 1.9 | 2.0 | 1.89 |
| `/login/creator` | 1.9 | 1.8 | 1.9 | 1.9 | 1.7 | 1.9 | 1.9 | 1.9 | 1.86 |
| `/login/business` | 1.9 | 1.8 | 1.9 | 1.9 | 1.7 | 1.9 | 1.9 | 1.9 | 1.86 |

Pass result: no critical issues open; average above 1.6 threshold.

## Correction Pass

Implemented in the same cycle:
- Helvetica-first typography baseline on public entry surfaces.
- Unified section rhythm classes for landing cadence and spacing.
- Doodle persona cluster with restrained 3-accent palette and reduced-motion fallback.
- Deterministic Instagram callback routing for new vs existing creator/business users.
- Unified onboarding progression cues (step labels + progress dots).

## Audit Pass 2 (Responsive + Continuity)

Validated breakpoints:
- 320
- 375
- 768
- 1024
- 1440

Validation results:
- CTA remains prominent and readable at all target breakpoints.
- Hero visual compresses without obscuring copy hierarchy.
- Login and signup surfaces retain one primary objective per step.
- Reduced-motion fallback disables non-essential illustration animation.
- Flow wording remains consistent with `Enter Merex` and clear branch language.

Final status: ship threshold met with no critical/major issues remaining.
