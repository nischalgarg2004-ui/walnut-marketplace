# Typography system (Part A2 — locked for implementation)

## Families

| Role | Font | Source |
|------|------|--------|
| **UI / headings** | **Inter** (variable) | `next/font/google` |
| **Numeric / IDs / money** | **JetBrains Mono** (variable) | `next/font/google` |

**Fallback stack:** `Inter, system-ui, -apple-system, Segoe UI, sans-serif`

**Display:** Use Inter **semibold (600)** for page titles, **medium (500)** for section titles, **regular (400)** for body.

## Scale (rem)

| Token | Size | Use |
|-------|------|-----|
| `text-xs` | 0.75rem | Meta, captions |
| `text-sm` | 0.875rem | Secondary labels, table cells |
| `text-base` | 1rem | Body |
| `text-lg` | 1.125rem | Lead |
| `text-xl` | 1.25rem | Card titles |
| `text-2xl` | 1.5rem | Page title (mobile) |
| `text-3xl` | 1.875rem | Page title (desktop) |

## Rules

- **Tabular figures** for currency and counts in tables (`font-variant-numeric: tabular-nums` via `font-mono` utility on numeric columns or `tabular-nums` class).
- **Max line length** ~65ch for long briefs (`max-w-prose`).
- **Line height:** body `leading-relaxed` (1.625), headings `leading-tight`.
