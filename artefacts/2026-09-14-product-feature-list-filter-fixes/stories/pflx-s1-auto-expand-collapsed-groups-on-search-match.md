## Story: Auto-expand collapsed module/phase groups when a search match is inside them

**Epic reference:** None — short-track (bounded bug fix, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery; scope stated directly below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **the operator searching a product's feature list (the "By Module" or "By Phase" tab on `/products/:id`)**,
I want **a feature that matches my search text to actually become visible, even when it lives inside a collapsed module or phase group**,
So that **typing a real, matching search term doesn't silently show nothing, making me think search is broken when it actually found the item and just never revealed it**.

## Benefit Linkage

**Metric moved:** None formal — reliability/UX bug fix, per this story's own short-track Benefit Linkage convention.
**How:** Directly closes a gap the operator found first-hand (2026-09-14): searching for their own feature on the live production app returned nothing, reported as "filters and search don't work." Root-caused via direct JS inspection of the live app (`skills-framework.fly.dev`): `pvcApplyFilters()` (`products.js`) correctly toggles the `hidden` attribute on matching `.pvc-item` rows, but never touches the `.a4-module-body--collapsed` class on the group that contains them — a matching row can have `hidden` removed while still being visually clipped to zero height by its own still-collapsed parent group, making a successful search indistinguishable from a failed one.

## Architecture Constraints

- **Scope the auto-expand trigger to search text only, not health-chip filtering or the `pflx-s2` active-only toggle (this same feature's sibling story).** Health filtering and the active-only default are coarse, everyone-affecting filters where most groups will still contain at least one match — auto-expanding every group on every health-chip click or on the page's own default active-only state would force the whole list open by default, defeating the point of collapsible sections. Auto-expand fires only when `pvcCurrentSearch !== ''`.
- **Only re-collapse groups this code itself opened.** Mark a group `data-auto-expanded="true"` the moment this logic expands it. When the search is cleared back to empty, re-collapse only groups still carrying that marker — a group the operator opened manually (by clicking its own header) must never be force-collapsed by this logic clearing itself.
- **A group with zero matching rows is left completely untouched** — this story only ever expands a group that contains at least one visible match; it never touches a group's collapse state otherwise.
- **Applies independently per tab.** The "By Module" and "By Phase" tabs each render their own separate DOM copies of the same underlying items, with their own distinct group ids (`a4-mod-*` vs `a4-mod-phase-*`). The fix must operate correctly within each tab's own subtree without cross-tab interference.
- **No change to `pvcFilterByHealth`, `pvcFilterBySearch`, or the underlying hide/show logic itself** — this story only adds group-expansion behavior on top of the existing, already-correct row-level filtering.

## Dependencies

- **Upstream:** None — `pvcApplyFilters()`, `.a4-module-body--collapsed`, and the header/body `aria-controls` pairing all already exist (`pvc-s1`, `ppg-s1`).
- **Downstream:** `pflx-s2` (this same feature's sibling story) adds a new "Active only" default filter in the same function — implemented together to avoid two separate edits to the same inline `<script>` block, but each story's ACs and tests are independent of the other.

## Acceptance Criteria

**AC1:** Given the search input has a non-empty value, When `pvcApplyFilters()` runs, Then any `.a4-module-body--collapsed` group containing at least one visible (non-`hidden`) `.pvc-item` after filtering has its `--collapsed` class removed and its paired header's `aria-expanded` set to `"true"`.

**AC2:** Given a group was auto-expanded by this logic (carries `data-auto-expanded="true"`), When the search is subsequently cleared back to an empty string, Then that specific group re-collapses to its default collapsed state.

**AC3:** Given a group is already expanded because the operator manually clicked its header (no `data-auto-expanded` marker), When a search match later occurs inside it and the search is then cleared, Then the group is left expanded — it is never force-collapsed by this logic.

**AC4:** Given a group contains zero rows matching the current search, When `pvcApplyFilters()` runs, Then that group's collapse state is left completely unchanged.

**AC5:** Given both the "By Module" and "By Phase" tabs are present in the DOM simultaneously, When a search match occurs in a group that exists (under different ids) in both tabs, Then each tab's own matching group expands independently and correctly, with no cross-tab state leakage.

## Out of Scope

- Auto-expanding groups in response to the health-chip filter or the `pflx-s2` active-only toggle (explicitly excluded — see Architecture Constraints).
- Any change to how a match itself is determined (`data-search` construction, `indexOf` matching) — this story only affects group visibility, not row matching.
- Persisting expand/collapse state across page reloads.

## NFRs

- **Performance:** the added expand/collapse check runs client-side, synchronously, once per `pvcApplyFilters()` call (already triggered by search input/health-chip events) — negligible additional cost against the existing per-row iteration.
- **Security:** None — pure client-side DOM state, no new data or input surface.
- **Accessibility:** `aria-expanded` is kept in sync with the visual collapse state for both manual and auto-expand paths, preserving existing screen-reader semantics.

## Complexity Rating

**Rating:** 2 — small in code size, but the "only re-collapse what I opened, never what the operator opened" rule requires care to get the marker logic right.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic
