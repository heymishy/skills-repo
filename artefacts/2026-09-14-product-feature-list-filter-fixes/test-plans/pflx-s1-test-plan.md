# Test Plan: Auto-expand collapsed module/phase groups when a search match is inside them (pflx-s1)

**Story:** artefacts/2026-09-14-product-feature-list-filter-fixes/stories/pflx-s1-auto-expand-collapsed-groups-on-search-match.md
**Track:** Short-track

---

## Test Cases

New test file `tests/check-pflx-s1-auto-expand-search-match.js`, extracting the real generated client script from an actual `_renderConsolidatedFeaturesSection` (or its containing page render function) render call and evaluating it in real `jsdom` against the real rendered DOM — the same "extract the real script, run it in jsdom against a real render" technique established by `tests/check-icv-s1-ideate-canvas-turn2-render-fix.js`, not a source-string regex check.

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Behavioural | A search term matching an item inside a collapsed group removes `.a4-module-body--collapsed` from that group and sets its header's `aria-expanded="true"` |
| T2 | AC2 | Behavioural | After T1's expansion, clearing the search input back to `''` re-collapses that same group |
| T3 | AC3 | Regression | A group expanded via a manual header click (no `data-auto-expanded` marker) stays expanded after a search that matches inside it is later cleared |
| T4 | AC4 | Regression | A group with zero matching rows for the current search keeps its original collapse state unchanged (collapsed stays collapsed, expanded stays expanded) |
| T5 | AC5 | Behavioural | A search match present in equivalently-named groups under both the "By Module" and "By Phase" tabs expands each tab's own group independently, with the other tab's own groups unaffected |

## Regression coverage

- Existing `pvcFilterBySearch`/`pvcFilterByHealth`/`pvcApplyFilters` row-level hide/show behaviour re-run unmodified — no existing test asserts specifically on `.a4-module-body--collapsed` state, so no changes expected there.
- `check-bmau-s1-*` (bulk-assign) tests re-run to confirm the "By Module" tab's own DOM structure and IDs are untouched by this change.

## Out of Scope (per story)

- Auto-expand triggered by health-chip filtering or the `pflx-s2` active-only toggle.
- Changes to search-match determination itself.
- Persisting expand state across reloads.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
