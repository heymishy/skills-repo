# Spike outcome: Canvas view drawflow node styling

**Date:** 2026-10-15
**Feature:** 2026-10-14-journey-authoring-experience
**Question:** Why do Canvas view stage nodes render with a saturated cyan fill, and what is the smallest change that brings them onto the app's token palette?
**Verdict:** FIX — small, CSS-only, one file. Ready for a short-track story.

## Root cause

This is not app styling that drifted. It is drawflow's own vendor default stylesheet (`drawflow@^0.0.60`, served unmodified at `/vendor/drawflow.min.css`), and `src/web-ui/routes/journeys.js` overrides none of it. The only app rule targeting the node class is `.sw-drawflow-node:focus` (outline, added in ic-s4), which does not touch fill, border or text colour.

Vendor defaults currently in effect (read directly from `drawflow.min.css`):

| Element | Vendor default | Problem |
|---|---|---|
| `.drawflow-node` | `background:#0ff; border:2px solid #000; color:#000; padding:15px; width:160px` | Saturated cyan, hard black border, ignores dark mode entirely |
| `.drawflow-node.selected` | `background:red` | Selecting a node turns it solid red |
| `.drawflow-node .input` | `background:#ff0` (yellow), `border:2px solid #000` | Yellow port |
| `.drawflow-node .output` | `background:#fff`, `border:2px solid #000` | White port, hard black border |
| `.connection .main-path` | `stroke:#4682b4; stroke-width:5px` | Heavy steel-blue connector, unrelated to the palette |

Because the colours are hard-coded hex, the Canvas view also cannot follow the app's light/dark switch. The tokens live in `src/web-ui/utils/html-shell.js` (light and dark blocks: `--surface`, `--surface-2`, `--line`, `--ink`, `--accent`, `--accent-soft`).

## Recommended change

Add overrides inside the existing style block in `journeys.js` that already holds `#sw-drawflow-canvas` and `.sw-drawflow-node:focus`. Select via `.drawflow .sw-drawflow-node` so specificity matches the vendor `.drawflow .drawflow-node` rule (the node also carries drawflow's own `drawflow-node` class, so the custom class is available without `!important`).

- Node: `background:var(--surface); color:var(--ink); border:1px solid var(--line); border-radius:8px; padding:12px; box-shadow` subtle, matching the swimlane card look from jcx-s6.
- Hover: `border-color:var(--muted)`; keep `cursor:move`.
- Selected: `.drawflow .sw-drawflow-node.selected{background:var(--accent-soft); border-color:var(--accent)}` replacing the red.
- Ports: `.input, .output {background:var(--surface); border:2px solid var(--line)}` and `.input:hover, .output:hover {border-color:var(--accent)}`. Drop the yellow input.
- Connector: `.drawflow .connection .main-path{stroke:var(--line); stroke-width:2px}` (the Customer-experience view already draws its polyline at `stroke="var(--line)" stroke-width="2"`, so this makes the two views consistent).

## Things to check in the story, not assumed here

- Node width is 160px by vendor default with 15px padding; the node contains a name, health indicator, moment-of-truth badge, an Edit link and two buttons (Map feature, Add placeholder). Confirm nothing clips at 160px once padding drops to 12px, and decide whether to widen (e.g. 200px). Stored `position_x` values assume the existing 220px auto-layout spacing, so width must stay below that.
- Existing tests may assert on the rendered style block; check before editing.
- CSS-layout ACs need DoR classification per the CLAUDE.md B2 rule: Playwright screenshot comparison in `tests/e2e/`, or RISK-ACCEPT plus a manual smoke step. Recommend RISK-ACCEPT plus a manual light/dark smoke check on staging, since Canvas view currently has no screenshot baseline.
- The vendor stylesheet is served from `node_modules`, so overrides must be in app CSS, not a patched vendor file.

## Out of scope

Redesigning the Canvas view's layout or node content, and the Delivery-view redesign (separate spike, `delivery-view-design-outcome.md`). Map feature and Add placeholder button placement on nodes is unchanged here; it is the open P2 question for the Delivery-view story.

## Next step

Short-track story: `/test-plan` → `/definition-of-ready` → coding agent, then `/definition-of-done` after merge.
