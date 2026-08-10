## Test Plan: Resuming a stage's history and viewing a completed journey both strand the operator with no way back to the dashboard

**Story reference:** artefacts/2026-08-10-journey-page-nav-products-gap/stories/jcn-s1-thread-products-nav-to-journey-pages.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-10

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Gap type | Risk |
|----|-------------|------|-------------|-----|----------|------|
| AC1 | Stage-history page nav includes product list + "See all products" | 1 test | — | — | — | 🟢 |
| AC2 | "See all products" link points at /dashboard | 1 test | — | — | — | 🟢 |
| AC3 | Journey-complete page nav includes the same products section | 1 test | — | — | — | 🟢 |
| AC4 | Zero-products state matches the rest of the app | 1 test | — | — | — | 🟢 |
| AC5 | No-pool test callers unaffected (regression guard) | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. All ACs are server-rendered-HTML assertions, matching this repo's existing coverage style for both handlers.

---

## Test Data Strategy

**Source:** Hand-authored fixtures matching `_getProductsNavSummary`'s existing `pool.query` shape (reused from `check-p0.2-journey-guard-wiring.js`'s and `handleGetJourney`'s own test conventions), plus the existing journey/completed-stage fixture patterns already used by `check-drh-s1-resume-history-diagram-rendering.js` and `check-ougl7-dor-and-journey-complete.js`.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A completed stage journey + a mock pool returning ≥1 product | Hand-authored | None | |
| AC2 | Same fixture | Hand-authored | None | |
| AC3 | A completed journey + the same mock pool | Hand-authored | None | |
| AC4 | Same fixtures, mock pool returns zero products | Hand-authored | None | |
| AC5 | Existing fixtures, handler called with no pool argument | Existing pattern | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### handleGetJourneyStageView_withPool_rendersProductsNavSection (AC1)

- **Verifies:** AC1
- **Precondition:** A completed-stage journey fixture (reusing `check-drh-s1-resume-history-diagram-rendering.js`'s `makeCompletedJourneyFixture` pattern); a mock pool whose `getProductsNavSummary`-shaped query returns ≥1 real product.
- **Action:** `handleGetJourneyStageView(req, res, null, mockPool)`.
- **Expected result:** Response HTML contains the product list markup and the "See all products →" link, matching `/dashboard`'s own rendered nav shape.

### handleGetJourneyStageView_seeAllProductsLink_pointsAtDashboard (AC2)

- **Verifies:** AC2
- **Precondition:** Same fixture as above.
- **Action:** Same call.
- **Expected result:** The "See all products →" link's `href` is exactly `/dashboard`.

### handleGetJourneyComplete_withPool_rendersProductsNavSection (AC3)

- **Verifies:** AC3
- **Precondition:** A completed-journey fixture (reusing `check-ougl7-dor-and-journey-complete.js`'s existing pattern); same mock pool as AC1.
- **Action:** `handleGetJourneyComplete(req, res, null, mockPool)`.
- **Expected result:** Response HTML contains the same product list markup and "See all products →" link as AC1's assertion.

### bothPages_zeroProducts_matchesDashboardsOwnEmptyState (AC4)

- **Verifies:** AC4
- **Precondition:** Same two fixtures, mock pool returns zero products.
- **Action:** Both handler calls.
- **Expected result:** Both pages render the identical zero-products nav markup `/dashboard` itself renders for a zero-product operator (byte-comparable via `_getProductsNavSummary`'s own known zero-product output shape).

### bothHandlers_calledWithoutPool_unaffected (AC5)

- **Verifies:** AC5
- **Precondition:** Existing fixtures from `check-drh-s1-resume-history-diagram-rendering.js`/`check-ougl7-dor-and-journey-complete.js`, called exactly as those files already call them (no `pool` argument).
- **Action:** `handleGetJourneyStageView(req, res)` / `handleGetJourneyComplete(req, res)`.
- **Expected result:** Both complete successfully with `statusCode: 200`, no throw — matching current behaviour exactly, product section absent (unchanged from today for this specific no-pool case).

---

## Integration Tests

None required beyond the unit tests above — each exercises the real handler end to end against a mock pool.

---

## NFR Tests

None beyond the ACs above.

---

## Out of Scope for This Test Plan

- Any other `renderShell` call site not named in the story's scope.
- Live re-confirmation on staging beyond the operator's own already-completed live Chrome inspection this session.

---

## Test Gaps and Risks

None identified as blocking.
