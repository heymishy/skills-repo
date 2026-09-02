# Contract Proposal: Fix the Story-Detail Dead End With a Breadcrumb and Back Link

**Story reference:** artefacts/2026-09-02-product-dashboard-triage/stories/pdt-s4.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-02

---

## What will be built

1. In `handleGetFeatureArtefacts` (`src/web-ui/routes/features.js`), render a Product breadcrumb segment using the already-available `journeyForPage.productId` (the same field `alrf-s10`'s own delete-redirect already uses).
2. Add a reverse lookup — given a story slug, find its parent feature/epic within `pipeline-state.json`'s `features[].epics[].stories[]` tree — to resolve a Phase/Epic breadcrumb segment when possible. Degrade gracefully (omit the segment, or fall back to a bare "Back to product list" link) when nothing is resolvable.
3. Writes the 7 tests from the test plan: 3 unit, 2 integration, 2 NFR.

## What will NOT be built

- Any redesign of the artefact-content display itself once a story has real artefacts.
- A performance/load test of the reverse lookup at full production scale (531+ stories) — a correctness test is sufficient for this MVP.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Fixture journey with `productId` set; assert the breadcrumb includes the resolved product name | Unit + Integration |
| AC1a | Fixture `pipelineState` with a nested story; assert Phase/Epic resolves when found, and degrades gracefully when not | Unit |
| AC2 | Extract the breadcrumb's product link `href`; request it; assert it resolves to that product's page | Integration |
| AC3 | Fixture feature with zero artefacts; assert breadcrumb AND the existing "No artefacts found" message both render together | Unit + Integration |

## Assumptions

- The reverse lookup's internal implementation (linear scan vs. a precomputed index) is an implementation-plan decision, not prescribed here — the ACs test observable behaviour only.
- `journeyForPage.productId`'s existing reliability (confirmed by `acdg-s1`'s own investigation — set at creation, persisted, correctly reloaded per `dfr-s1`) extends unchanged to this new read-only usage.

## Estimated touch points

Files: `src/web-ui/routes/features.js`, `tests/check-pdt-s4-*.js` (new).
Services: None new.
APIs: None new.
