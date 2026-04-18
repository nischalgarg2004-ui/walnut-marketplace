# Layout & responsiveness contract (Phase 3b)

Implementation rules to avoid clipping and overlap:

1. **`min-w-0`** on flex children that contain text, chips, or embedded tables.
2. **Tables** only inside `.table-scroller` (or equivalent `overflow-x-auto` wrapper).
3. **Fixed/sticky** footers and bottom CTAs: `padding-bottom: max(..., env(safe-area-inset-bottom))`.
4. **Z-index** only use: `z-dropdown`, `z-sticky`, `z-modal-backdrop`, `z-modal`, `z-toast` (see `tailwind.config.ts`).
5. **Touch targets** ≥44px (`min-h-touch` / `min-w-touch`).

QA before release: iOS Safari, Chrome Android, keyboard-only, 200% zoom.
