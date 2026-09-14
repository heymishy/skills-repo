## Story: Collapsed group counts reflect the currently-filtered item count, not the unfiltered total

**Epic reference:** None — short-track (bug fix in already-shipped work from this same feature, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery; scope stated directly below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **the operator viewing a product's feature list with "Active only" checked (`pflx-s2`'s own default) or a search/health filter applied**,
I want **each collapsed module/phase group's own header count to reflect how many items are actually visible inside it right now, not the original unfiltered total**,
So that **the list visibly shrinks when I filter it, instead of looking exactly the same size until I manually open every group to see what's really inside**.

## Benefit Linkage

**Metric moved:** None formal — bug fix, per this story's own short-track Benefit Linkage convention.
**How:** Directly closes a gap the operator found first-hand immediately after `pflx-s2` shipped and reached production: "Filtering doesn't help as it still shows all the features, doesn't materially make it look any smaller unless you expand each." Root cause: `pflx-s2` correctly hides individual `definition-of-done` rows (`hidden` attribute, verified by that story's own tests), but each group's header count badge (`.a4-module-count`, `_renderModuleSection` in `products.js`) is set once at render time from `groupFeatures.length` — the group's real, unfiltered item count — and is never recomputed when `pvcApplyFilters()` runs. A collapsed group with 12 items, 10 of them now hidden by "Active only," still shows "(12)."

## Architecture Constraints

- **Recompute every group's header count inside the existing `pvcApplyFilters()`**, immediately after the per-row hide/show pass — a new `pvcSyncGroupCounts()` function, called the same way `pflx-s1`'s `pvcSyncGroupExpansion()` already is.
- **Count only currently-visible descendants.** For each `.a4-module-section`, find its `.a4-module-body` and count `.pvc-item:not([hidden])` within it; set the paired `.a4-module-count` element's text to `'(' + count + ')'`, preserving the existing parenthesised format.
- **Applies to every filter dimension** (search, health, active-only), not just `pflx-s2`'s toggle — any combination that changes which rows are visible must keep group counts honest. This generalizes rather than special-cases active-only.
- **Do not touch the group's health-signal glyph** (`.a4-module-signal`, e.g. "✓ Healthy") — that rollup is computed once from the group's full, real membership and stays a deliberately separate, unfiltered concern, matching how the top-level health chips themselves remain out of scope (per `pflx-s2`'s own Architecture Constraints).
- **A group that filters down to zero visible items shows "(0)"** — it is not hidden, collapsed, or removed; only its count changes. Auto-hiding empty groups is explicitly out of scope (see below).
- **Applies independently per tab**, mirroring `pflx-s1`'s own AC5 precedent — the "By Module" and "By Phase" tabs each render their own separate copies of the same groups and must each update their own counts correctly.

## Dependencies

- **Upstream:** `pflx-s1` (auto-expand) and `pflx-s2` (active-only default, `data-active` attribute, `pvcApplyFilters()`'s `stageOk` condition) — both already merged and live in production. This story adds a third pass inside the same `pvcApplyFilters()` function.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given any combination of search text, health filter, and "Active only" state, When `pvcApplyFilters()` runs, Then every group's `.a4-module-count` badge shows the count of currently-visible (non-`hidden`) `.pvc-item` descendants within that group, not the group's original `groupFeatures.length`.

**AC2:** Given the page first loads with "Active only" checked by default, When inspecting group header counts on initial render (before any interaction), Then they already reflect the active-only-filtered count, not the unfiltered total.

**AC3:** Given a group where every item is filtered out, When `pvcApplyFilters()` runs, Then its header count shows `(0)` — the group itself remains present and expandable, only its count changes.

**AC4:** Given filters are cleared back to defaults (empty search, health "all", "Active only" unchecked), When `pvcApplyFilters()` runs, Then every group's count returns to its original, full `groupFeatures.length`.

**AC5:** Given the "By Module" and "By Phase" tabs each render their own separate copy of the same underlying groups, When filters change, Then each tab's own group counts update independently and correctly.

## Out of Scope

- Auto-hiding or auto-removing a group that filters down to zero visible items.
- Recomputing the `.a4-module-signal` health-rollup glyph to reflect only visible items.
- Recomputing the top-level health-chip counts or the page's own "N epics · N stories" summary line (both already explicitly out of scope per `pflx-s2`).
- Any change to `pflx-s1`'s auto-expand/collapse logic.

## NFRs

- **Performance:** one additional `querySelectorAll` + textContent write per group, per existing `pvcApplyFilters()` call — negligible, same order of cost as `pflx-s1`'s own group-expansion pass added to the same function.
- **Security:** None — pure client-side DOM state, no new data or input surface.
- **Accessibility:** the count badge remains plain text inside the existing header `<button>`, already announced as part of that button's accessible name — no new ARIA surface needed.

## Complexity Rating

**Rating:** 1 — small, mechanical, well-understood; a direct correction to an under-scoped AC in `pflx-s2`.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic
