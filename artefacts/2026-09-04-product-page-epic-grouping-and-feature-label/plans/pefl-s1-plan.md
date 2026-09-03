# Implementation Plan: Grouped item rows show the parent feature's own name instead of repeating the epic group header, and epic-grouped view becomes the default when a product has more than one epic

**Story reference:** artefacts/2026-09-04-product-page-epic-grouping-and-feature-label/stories/pefl-s1-feature-name-not-epic-name-on-grouped-rows.md
**DoR contract:** artefacts/2026-09-04-product-page-epic-grouping-and-feature-label/dor/pefl-s1-dor-contract.md
**Worktree:** .worktrees/pefl-s1 (branch `feature/pefl-s1`)
**Baseline:** 604 files, 1 pre-existing failure (`tests/check-p3.5-validate-trace.js` — confirmed present on master before this branch existed, same known local-environment gap noted in every prior story's DoD this session)

---

## Task 1: Both fixes together (AC1–AC5)

**Sub-steps, in TDD order:**
1. Write `tests/check-pefl-s1-feature-name-not-epic-name.js` (RED) — 6 tests covering AC1–AC5.
2. Fix `computeTaxonomyRollup` (`src/web-ui/modules/product-rollup.js`) — add `featureName: feature.name` to the epic-nested item mapping.
3. Add `preferFeatureName` third parameter to `_renderPvcItemRow` (`src/web-ui/routes/products.js`) — `subLabel = item.stage || (preferFeatureName ? item.featureName : item.epicName) || ''`.
4. Add `_renderPvcItemRowForPhase` wrapper (matching the existing `_renderPvcItemRowWithCheckbox` convention), wire it into both `.map(...)` calls in `byPhaseHtml`.
5. Change `defaultTab` to `byPhase.byPhase.length > 1 ? 'phase' : (modules.length === 0 ? 'phase' : 'module')`, reusing the already-computed `byPhase` value.
6. Confirm GREEN (new tests + `check-ppg-s1-decouple-modules-gate.js` + `check-fal-s1-artefact-lookup-epic-nested-fix.js` regression guards).

**Files touched:**
- `src/web-ui/modules/product-rollup.js`
- `src/web-ui/routes/products.js`
- `tests/check-pefl-s1-feature-name-not-epic-name.js` (new)

**TDD verification performed:** before committing, the fix was temporarily stashed (`git stash push -u`, reapplied and dropped by SHA per this repo's worktree stash-safety convention) and the new test file re-run against the pre-fix code — confirmed AC1, AC3, and AC5 fail with exactly the expected values (missing feature name, wrong default tab, `undefined` featureName), while AC2/AC4's regression guards correctly pass either way. Proves the new tests are load-bearing, not vacuously true.

**Status:** Complete. Committed as `9092b394` on `feature/pefl-s1`.

---

## Verification

- New test file: 6/6 passing.
- `tests/check-ppg-s1-decouple-modules-gate.js` (regression guard): 7/7 passing, unmodified.
- `tests/check-fal-s1-artefact-lookup-epic-nested-fix.js` (regression guard, since `computeTaxonomyRollup` was touched again): 5/5 passing, unmodified.
- Full suite: 604 files run, 1 failed (the known pre-existing `check-p3.5-validate-trace.js`), 0 new failures.
