# Contract Proposal: Module-less products get the full grouped/collapsed/filterable features UI, and health counts render in one place, not three

**Story reference:** artefacts/2026-09-03-product-page-module-gate-and-health-duplication-fix/stories/ppg-s1-decouple-modules-gate-and-consolidate-health-counts.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-03

---

## What will be built

1. In `_renderConsolidatedFeaturesSection` (`src/web-ui/routes/products.js`): replace the `if (modules.length === 0) { return ... }` early return with `if (modules.length === 0 && items.length === 0) { return '<p>No features yet.</p>'; }` — preserving the existing empty-state message exactly, while removing the gate that skipped the tabs/grouping UI for any non-empty, module-less product.
2. Compute `byModule`/`byPhase` and render the tabs/filter-bar/panels unconditionally (previously only reached when `modules.length > 0`).
3. Add a `defaultTab` variable (`'phase'` when `modules.length === 0`, else `'module'`), driving which tab/panel carries the `--active` class and `aria-selected="true"` — previously hardcoded to `'module'` always.
4. Only render `bulkAssignBarHtml` inside the By Module panel when `modules.length > 0`.
5. Add real per-status counts to the existing `healthChips` (e.g. `Warning (3)`), using `healthCounts` already computed in `_renderProductView` (passed as a new parameter to `_renderConsolidatedFeaturesSection`).
6. Remove `triageStripHtml` (the `pdt-s2`-era separate block) entirely, and its usage at the call site.
7. Simplify `healthHtml` (the "Overall:" line) to render only the single derived `Overall: [label]` span — remove the `['green','amber','red','unknown'].map(...)` per-status breakdown.
8. Writes the 6 tests from the test plan (AC1–AC6), and updates `tests/check-pdt-s2-triage-summary-strip.js`'s own 5 tests to assert the new consolidated chip-bar behaviour instead of the removed `pdt-triage-strip` class — a legitimate, intentional supersession of that story's own separate mechanism, not a silent regression.

## What will NOT be built

- Any change to `groupItemsByModule`, `groupItemsByPhase`, `computeHealthCounts`, or `computeOverallHealthSignal` — all reused completely unchanged.
- A synthetic "Default" Module — explicitly rejected in the story's own Out of Scope.
- Any change to the bulk-assign mechanism's own assign/select logic (`bmau-s1`) — only whether its bar renders when there are zero modules to assign to.
- Tab-selection persistence across reloads.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Zero-modules fixture; assert tabs/search/chip-bar markup present, no bare unwrapped flat `<ul>` | unit |
| AC2 | Zero-modules fixture; assert exactly one "Unclassified (N)" group in the By Module panel, no `bmau-bar` | unit |
| AC3 | Two fixtures (zero and ≥1 modules); assert `--active`/`aria-selected` on the correct tab for each | unit |
| AC4 | Distinct non-zero health-count fixture; assert chip bar shows real counts, `pdt-triage-strip` class absent | unit |
| AC5 | Same fixture; assert the Overall-line element contains only its own single label | unit |
| AC6 | ≥1-module fixture; assert default tab, bulk-assign bar, and module sections unchanged from today | unit (regression guard) |

## Assumptions

- `groupItemsByModule(items, assignmentMap, [])` already returns `{byModule: [], unclassified: items, totalCount: N}` for zero modules — confirmed via direct code reading, not assumed; no change to that function is needed.
- `groupItemsByPhase` has no module dependency at all — confirmed via direct code reading.
- Removing `triageStripHtml` and rewriting its own test file's assertions is a legitimate scope decision for this short-track story (consolidating a genuinely duplicated UI element into the mechanism that already does the same job more completely), not scope creep — the story's own Benefit Linkage names this duplication explicitly as one of the two things this story fixes.

## Estimated touch points

Files: `src/web-ui/routes/products.js` (`_renderConsolidatedFeaturesSection`, `_renderProductView`), `tests/check-ppg-s1-*.js` (new), `tests/check-pdt-s2-triage-summary-strip.js` (rewritten to match the consolidated design).
Services: None new.
APIs: None new.
