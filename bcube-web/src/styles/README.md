# Styling guide

How styles are organised, and the rules that keep them consistent. Enforced (as warnings, ratcheting
down) by `npm run lint:css`.

## Layers - where does a style belong?

| Layer | Location | Holds |
|---|---|---|
| 1. Tokens | `styles/_tokens.scss` | Every raw value: colours, spacing (`--space-*`), radius (`--radius-*`), motion, z-index, state colours. The **only** place raw hex/px values live. |
| 2. Theme | `app/core/theme/bcube.preset.ts` | PrimeNG look (buttons, fields, dialogs, tables, menus) as design tokens. Reads layer 1. |
| 3. Layout | `styles/_layout.scss` | The app-shell contract (`.app-shell`, `.page-content`, `.fullscreen-scroll`). |
| 4. Shared patterns | `styles/_auth.scss`, `_list-views.scss`, ... | Cross-page building blocks that are not components. |
| 5. Shared components | `app/shared/ui/*` | Anything with behaviour or markup used in 2+ places: `app-back-button`, `app-pager`, `app-loading-spinner`. |
| 6. Component CSS | next to each component | Only what is unique to that component. |

Rule of thumb: **look -> theme, structure -> layout, repeated markup -> shared component, the rest -> component CSS.**

## Rules

1. **No magic numbers.** Spacing, radius, durations, z-index and colours come from tokens. A new value needed
   in two places becomes a token first.
2. **No inline `[style]` for look.** Variants come from the PrimeNG API (`[outlined]`, `[text]`, `severity`).
   (The old `DARK_BUTTON_STYLE`/`LIGHT_BUTTON_STYLE` maps were removed for this reason.)
3. **No `!important`, no `::ng-deep`** in new code. Re-theme PrimeNG in the preset; if a token does not exist, add a
   `css` block to that component in the preset. The few remaining exceptions carry a comment explaining why.
4. **Pages do not own the viewport.** No `100vh`, no `calc(100vh - Npx)`, no `overflow: hidden` on a page.
   `.page-content` is the scroll container; see `_layout.scss`.
5. **One interaction contract.** Hover = `--state-hover-bg` + `--state-hover-line` + `--lift-hover`;
   focus = `--state-focus-ring`. Use these for every clickable surface.
6. **Reuse before copy.** Seeing the same block in a second component means extracting it (shared component or
   partial), not copying it.

## Adding things

- New colour/size -> `_tokens.scss`, then use `var(--...)`.
- New PrimeNG component styling -> `bcube.preset.ts`.
- New full-page route outside the shell -> add `fullscreen-scroll` to its root element.
- New shared control -> `app/shared/ui/<name>/` as a standalone, `OnPush` component with `input()`/`output()`.

## Known debt (tracked by `lint:css` warnings)

Raw radii other than 12/16/24/30px, ~170 `!important`, ~135 `::ng-deep` (mostly page-specific PrimeNG tweaks),
raw `#hex` in gradients, and `calc(100dvh - …)` in `studios-view`. Reduce these when touching the file; do not add.
