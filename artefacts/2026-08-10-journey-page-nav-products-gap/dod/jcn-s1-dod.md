# Definition of Done: Resuming a stage's history and viewing a completed journey both strand the operator with no way back to the dashboard

**PR:** #712 (commit `db9eded2`) | **Merged:** 2026-08-10
**Story:** artefacts/2026-08-10-journey-page-nav-products-gap/stories/jcn-s1-thread-products-nav-to-journey-pages.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|------------|----------|----------------------|-----------|
| AC1 — stage-history page nav shows product list + "See all products →" | Yes | `AC1: handleGetJourneyStageView_withPool_rendersProductsNavSection` — asserts 200 response and `Product One` present in rendered body | Unit test (re-run this session) | None |
| AC2 — "See all products →" links to `/dashboard` | Yes | `AC2: handleGetJourneyStageView_seeAllProductsLink_pointsAtDashboard` — asserts `href="/dashboard"` present | Unit test (re-run this session) | None |
| AC3 — journey-complete page nav shows the same products section | Yes | `AC3: handleGetJourneyComplete_withPool_rendersProductsNavSection` — asserts 200, `Product One`, and `href="/dashboard"` all present | Unit test (re-run this session) | None |
| AC4 — zero-products state matches the rest of the app | Yes | `AC4: bothPages_zeroProducts_rendersEmptyProductsStateNotProductOne` — asserts neither page fabricates a product name when the mock pool returns zero products | Unit test (re-run this session) | None |
| AC5 — no-pool callers unaffected (regression guard) | Yes | `AC5: bothHandlers_calledWithoutPool_unaffected` — asserts both handlers still return 200 when called with no `pool` argument | Unit test (re-run this session) | None |

## Scope Deviations

None found against the story's stated scope. The story itself names one accepted, explicitly out-of-scope item: **"Any other page that might also be missing this wiring"** — the story scopes the fix to only the two pages the operator reported (stage-history, journey-complete) and explicitly defers a broader `renderShell` call-site audit as separate future work, not a defect of this story.

## Test Plan Coverage

The test counts supplied for this backlog pass (`null passed, null failed`) were not usable evidence, so `tests/check-jcn-s1-journey-page-nav-products.js` was re-run directly this session per the "re-run if suspicious" guardrail. Result: **5 passed, 0 failed**, covering AC1–AC5 exactly (one test per AC, matching the test plan's 1:1 AC-to-unit-test mapping in `artefacts/2026-08-10-journey-page-nav-products-gap/test-plans/jcn-s1-test-plan.md`). No integration or E2E tests were planned or required — the test plan classifies all five ACs as server-rendered-HTML unit assertions.

## NFR Status

The story names two NFRs, both non-functional/qualitative rather than test-measured: **Correctness** (closes an operator-confirmed navigation dead-end) and **Consistency** (both pages now reuse the same `_getProductsNavSummary` wiring pattern as `handleGetJourney`, rather than a page-specific treatment). Both are supported by the AC1–AC5 test evidence above; no separate NFR test suite was planned.

## Metric Signal

No formal benefit-metric artefact exists for this story — it is explicitly short-track ("Benefit-metric reference: None — short-track skips benefit-metric; benefit linkage stated directly below"). The story states its benefit directly: closing an operator-confirmed "stranded with no way back to dashboard" gap on two pages, verified live via Chrome inspection on the operator's real staging journey before the fix.

## Outcome

**COMPLETE**
**Follow-up actions:** None. The one deferred item (broader `renderShell` call-site audit) is already accepted out-of-scope in the story text, not an open gap from this story.

## DoD Observations

Implementation confirmed present in `src/web-ui/routes/journey.js` (`handleGetJourneyStageView`, `handleGetJourneyComplete`), and all 5 tests pass cleanly against current `master`, three commits ahead in the same file area as of this check — no signs of regression or drift since merge.
