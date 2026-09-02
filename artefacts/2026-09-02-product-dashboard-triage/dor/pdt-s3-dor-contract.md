# Contract Proposal: De-emphasize Unknown Health Visually

**Story reference:** artefacts/2026-09-02-product-dashboard-triage/stories/pdt-s3.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-02

---

## What will be built

Change the `HEALTH_COLORS`/`HEALTH_LABELS` mapping and badge markup in `_renderProductView`/`_renderConsolidatedFeaturesSection` (`src/web-ui/routes/products.js`) so `unknown` renders as quiet grey text without a colored badge background, applied both to per-item health indicators and the top-level "Overall:" summary line. Writes the 4 tests from the test plan: 3 unit, 1 NFR.

## What will NOT be built

- Any change to `computeHealthCounts` or the underlying health-computation logic — confirmed out of scope per the discovery (feature-granularity-only computation is a separate, larger initiative).

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Fixture item with no `healthBySlug` match; assert quiet/grey rendering, no colored badge | Unit |
| AC2 | Fixture items with real `green`/`amber`/`red` values; assert unchanged colored badges | Unit |
| AC3 | Fixture `rollupRow` with `health_counts: null`; assert the Overall line uses the same de-emphasized treatment | Unit |

## Assumptions

- The muted/grey design token already used elsewhere in this codebase's dark theme is sufficient contrast for this treatment — verified by the NFR contrast-ratio test, not assumed silently.

## Estimated touch points

Files: `src/web-ui/routes/products.js`, `tests/check-pdt-s3-*.js` (new).
Services: None new.
APIs: None new.
