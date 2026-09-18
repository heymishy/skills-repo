# Skills Platform — Design System

Reference for any agent (Claude Code, a coding skill, a future design pass) implementing or extending UI for this product. Grounded in `Skills Platform - Style Guide.dc.html` — treat that file as the source of truth for visual examples; this doc is the token/rule reference for writing code against it.

## Direction

Sharp, technical developer tool. Audience: individual developers, small squads, regulated enterprise reviewers. Dark-first (single dark theme was the original ask; a light variant was added for the existing Settings dark/light toggle — see Light mode below). References: Linear, Stripe.

## Typography

- UI/display: **Inter Tight** (400/500/600/700/800). Google Fonts: `family=Inter+Tight:wght@400;500;600;700;800`.
- Code, hashes, timestamps, trace IDs, pills/badges: **JetBrains Mono** (400/500/600).
- Long-form prose (artefact/document bodies only — DoR, discovery docs): **Source Serif 4**, matches the existing product's document rendering.
- Scale: 56 / 32 / 20 / 16 / 13–14px. Never below 12px for UI text, never below 11px even for metadata.
- Letter-spacing: tight on large display type (-0.02em to -0.03em), normal on body.

## Color tokens (dark — default)

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#0B0D10` | page background |
| `--surface` | `#0E1013` | cards, panels |
| `--surface-2` | `#161A1F` | hover/raised state, active nav row |
| `--line` | `#23272E` | borders, dividers |
| `--line-2` | `#1A1D22` | subtle inner dividers (table rows) |
| `--ink` | `#F5F6F7` | primary text |
| `--ink-2` | `#B4BAC2` | secondary text, body copy |
| `--muted` | `#9AA1AB` | tertiary text, labels |
| `--muted-2` | `#6B7280` | metadata, timestamps |
| `--muted-3` | `#454B54` | least prominent (version stamps) |
| `--accent` | `#3B82F6` | primary actions, active states, links |
| `--accent-soft` | `#152238` | accent pill background |
| `--accent-ink` | `#93C5FD` | text on accent-soft |
| `--success` | `#34D399` / soft `#0F2318` | pass/merged/confirmed |
| `--warn` | `#F59E0B` / soft `#2A2011` | pending/awaiting |
| `--danger` | `#F87171` / soft `#2A1416` | fail/flagged/destructive |

## Light mode

Same structure, inverted values (Settings toggle swaps these in, no component changes):

| Token | Hex |
|---|---|
| `--bg` | `#FAFAFA` |
| `--surface` | `#FFFFFF` |
| `--surface-2` | `#F2F3F5` |
| `--line` | `#E4E7EB` |
| `--ink` | `#14171A` |
| `--ink-2` | `#3F454C` |
| `--muted` | `#6B7280` |
| `--accent` | `#2563EB` (deepened for contrast on white) |
| `--accent-soft` | `#EFF4FF` |
| `--accent-ink` | `#1D4ED8` |
| success/warn/danger soft backgrounds | `#DCFCE7` / `#FEF3C7` / `#FEE2E2` (text: `#15803D` / `#B45309` / `#B91C1C`) |

## Spacing & radius

- Spacing scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64px. Section padding on full pages: 48–64px horizontal.
- Radius: 6–7px (buttons, pills, inputs), 8–10px (cards), 12–14px (page-level panels, window chrome).
- Card border: always `1px solid var(--line)`, never a shadow-only card on dark backgrounds.

## Components

- **Buttons**: primary (accent fill, dark text), secondary (white fill, dark text), ghost (transparent, bordered), tertiary (text-only), destructive (danger-soft fill, danger text/border). All `font-weight: 500–600`, `border-radius: 7–8px`.
- **Badges/pills**: `JetBrains Mono`, 11–12px, soft-background + ink-colored text, no border unless on a light card. Use for status only (pass/fail/pending/in review/draft) — not decoration.
- **Cards**: `var(--surface)` fill, `1px solid var(--line)`, 8–12px radius, 16–24px padding.
- **Inputs**: `var(--bg)` fill (darker than surrounding card), `1px solid` a slightly lighter border than `--line` (`#2E333B` on dark), accent border on focus.
- **Nav**: sidebar items use the icon set (see below) + label; active state = `--surface-2` background, `--ink` text; inactive = `--muted` text, transparent background.
- **Tables**: header row uppercase 10.5px muted labels, row dividers `--line-2`, no vertical borders.

## Icons

Custom stroke icon set — 20×20 viewBox, `1.5px` stroke, round caps/joins, `currentColor` (or explicit status color for check/warning/pending). Defined inline in the style guide's Icons section (board, session, artefact, settings, search, check, pending, warning, add, arrow-right, code, close, external-link, folder). Do not use unicode glyphs (▦ ◧ ✦ ⚙) in new work — they were a placeholder in early drafts; use these SVGs instead, or extend the same stroke style for new icons rather than pulling in an icon font/library.

## Layout patterns by screen type

- **Marketing/landing**: centered hero, max-width ~900px for copy, full-bleed sections below at max-width 1120px. Browser-chrome frame (traffic lights) for product screenshots — see "Product in action" pattern in the landing page file.
- **Dashboard/app shell**: fixed 224px sidebar (products list + main nav + account nav pinned to bottom) + fluid main column, max-width 1080px content.
- **Phase stepper** (top of any skill-session screen): full phase list (Idea → Discovery → Clarify → Estimate → Benefits → Design → Definition → Review → Test Plan → Ready) plus a trailing "Ref docs" link. Wraps (`flex-wrap:wrap`) instead of scrolling — every phase is always visible, including on mobile. Active phase = deep indigo pill (`#1E1B4B` bg, white text, `▶` in `#818CF8`); done = white text + green `✓`; upcoming = muted text, no fill.
- **Skill session**: resizable two-pane layout (drag handle between panes, and between stacked sections within the right pane — all via a shared px/percentage drag pattern, not fixed splits). Left pane has two independently toggleable view modes (segmented control in the header, e.g. "Focused / Chat" — build both, let the user switch, don't pick one for them):
  - **Focused** — one prominent question at a time (large text, progress dots, "Question X of Y", collapsible previous answer) instead of a scrolling log. On completion, replaced by a checkmark confirmation ("All questions answered") pointing to the artefact draft.
  - **Chat** — the full running thread (skill questions + user answers as bubbles), for when history matters more than focus.
  Right pane varies by skill, each a resizable stack:
  - Generic/`/design` → **Artefact draft** (sectioned draft with status pills) above a **Diagrams** sub-panel.
  - `/ideate` → **Conditions** → **Assumptions** (confirmed/flagged/pending, colored border+bg) → **Canvas** (lens pips A–E + JTBD tree), three independently resizable sections.
  - `/definition` → **Story map** (epic pills with story-count badge, phase grouping label, story cards with `C:n` complexity, "Apply changes (N pending)") above a **Diagrams** sub-panel.
  - Diagrams (mermaid-generated) → render as styled boxes + arrows matching the actual node graph (not a generic list), with a collapsible "View mermaid/diagram source" block showing raw syntax in mono. Do not attempt to render real mermaid.js output in a static mock.
- **Artefact/document viewer**: two-column, `minmax(0,1fr) 320px`. Doc body in `Source Serif 4` on a surface card; sidebar = Sign-off card (avatar + role + signed/pending) + Comments card (threaded, with reply/resolve).

## Rules for agents extending this system

1. Inline styles only, using the hex values above directly (no CSS variables inside `.dc.html` files per the Design Components spec) — but keep values byte-identical to this table across files so screens stay visually consistent.
2. Never invent a new accent, success/warn/danger hue, or font — extend from this palette (e.g. `oklch` adjustments of `--accent`) rather than picking a new color.
3. New icons follow the existing stroke spec (20px grid, 1.5px stroke) — add them to the style guide's Icons section first, then consume elsewhere.
4. New screens should identify which layout pattern above they match before laying out from scratch.
5. Keep JetBrains Mono for anything machine-generated or verifiable (hashes, IDs, timestamps, status) and Inter Tight for everything a human wrote or reads as prose UI.
