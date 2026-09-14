## Story: Default the product features list to active (non-definition-of-done) features only

**Epic reference:** None — short-track (bounded feature addition, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery; scope stated directly below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **the operator viewing a product's feature list (`/products/:id`, all three tabs)**,
I want **the list to show only features still in progress by default — hiding anything already at `definition-of-done` stage — with a clear, one-click way to see everything including completed work**,
So that **I'm not scanning past hundreds of already-shipped features every time I'm looking for something still active, on a product with as much completed history as `skills-framework`'s 564 features**.

## Benefit Linkage

**Metric moved:** None formal — UX/scale fix, per this story's own short-track Benefit Linkage convention.
**How:** Directly requested by the operator (2026-09-14) immediately after the `pflx-s1` search investigation surfaced just how large this list already is (564 items on `skills-framework` alone, the large majority already at `definition-of-done`) — most of the operator's own actual look-ups are for active work, not the completed history.

## Architecture Constraints

- **New "Active only" checkbox, default checked**, positioned alongside the existing health-filter chips and search input in `_renderConsolidatedFeaturesSection` (`products.js`).
- **New `data-active` attribute per row.** Add `data-active="true"/"false"` to each `.pvc-item` at render time, computed as `item.stage !== 'definition-of-done'`. Reuses the existing per-row data-attribute pattern (`data-health`, `data-search`) rather than introducing a new mechanism.
- **Independent AND-ed filter dimension.** `pvcApplyFilters()` gains a third condition alongside `healthOk`/`searchOk`: `stageOk = !pvcHideDod || el.getAttribute('data-active') === 'true'`. When "Active only" is checked, a `definition-of-done`-stage item stays hidden even if it matches the current search text or health filter — consistent with how a coarser state filter (e.g. GitHub's `is:open`) composes with a text search, not overridden by it. This is a deliberate choice, not an oversight — call it out explicitly so `pflx-s1`'s search-driven auto-expand is never expected to reveal a DoD-stage item while "Active only" stays checked.
- **Applied on initial page load, not only on interaction.** Today, `pvcApplyFilters()` only ever runs in response to a search/health-chip event — nothing hides anything until the operator first interacts. This story requires an explicit `pvcApplyFilters()` call once at the end of the inline `<script>` block so the active-only default actually takes effect the moment the page renders, before any interaction.
- **Does not touch the existing health-chip counts** (`healthCounts`, computed server-side via `_productRollup`) — those remain absolute totals across all stages, unchanged. This story's own count (how many completed features exist) is computed and shown separately, next to the new checkbox, not folded into the existing health-chip labels.
- **No interaction with `pflx-s1`'s auto-expand logic.** Per `pflx-s1`'s own Architecture Constraints, auto-expand fires only on non-empty search text — the active-only default (and the health chips) never trigger it, so applying this story's default filter on page load does not force every group open.

## Dependencies

- **Upstream:** None — `_renderConsolidatedFeaturesSection`, `_renderPvcItemRow`, and `pvcApplyFilters()` all already exist.
- **Downstream:** Implemented alongside `pflx-s1` (this same feature's sibling story) in the same function/script block, but independently testable — see that story's own Dependencies note.

## Acceptance Criteria

**AC1:** Given the features list renders, When the page first loads (before any user interaction), Then every `.pvc-item` whose underlying item has `stage === 'definition-of-done'` is already hidden.

**AC2:** Given the page has just loaded, When inspecting the new "Active only" checkbox, Then it is checked by default.

**AC3:** Given "Active only" is checked (the default), When the operator unchecks it, Then `definition-of-done`-stage items become visible again, subject to whatever search/health filters are otherwise active.

**AC4:** Given "Active only" was unchecked and `definition-of-done`-stage items are visible, When the operator re-checks it, Then those items are hidden again.

**AC5:** Given a non-`definition-of-done`-stage item, When "Active only" is toggled on or off, Then that item's own visibility is governed only by the existing search/health filters, unaffected by this toggle.

**AC6:** Given the "By Module", "By Phase", and "All" tabs each render their own separate copy of the same items, When the page loads, Then the active-only default applies consistently and independently across all three tab panels.

## Out of Scope

- Recomputing the existing health-chip counts to reflect the active-only default (left as absolute totals, per Architecture Constraints).
- Persisting the checkbox's on/off state across page reloads or between products.
- Any change to what counts as "definition-of-done" (uses the exact, existing `item.stage === 'definition-of-done'` string match — no new stage taxonomy).
- Migrating or backfilling any existing feature's `stage` field.

## NFRs

- **Performance:** one extra boolean attribute per row at render time, one extra condition in the already-existing per-row filter loop — negligible.
- **Security:** None — no new external input surface, `item.stage` is already server-resolved data rendered elsewhere on the same page.
- **Accessibility:** the checkbox is a real `<input type="checkbox">` with an associated `<label>`, keyboard-operable and screen-reader-announced by default, consistent with the existing health-chip buttons' own accessible-by-default markup.

## Complexity Rating

**Rating:** 1 — a straightforward additive filter dimension, reusing an already-proven pattern (health chips) with a well-understood interaction rule (AND-ed, not overridden by search).
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic
