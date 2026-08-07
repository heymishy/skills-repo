# AC Verification Script: Register product-feature journeys in the shared in-memory store

**Story reference:** artefacts/2026-07-22-journey-registration-fix/stories/jrf-s2-register-product-feature-journeys.md
**Technical test plan:** artefacts/2026-07-22-journey-registration-fix/test-plans/jrf-s2-test-plan.md
**Script version:** 1
**Verified by:** Claude (agent) | **Date:** 2026-07-22 | **Context:** [x] Pre-code sign-off (post-implementation, pre-PR)

---

## Scenarios

### Scenario 1: Create a product, add a feature, complete discovery, advance to benefit-metric

**Covers:** AC1, AC2, AC3, AC4

**Steps:**
1. Create a new product.
2. Click "New feature."
3. Complete the discovery skill session and save its artefact.
4. Click to proceed to the next stage (`/benefit-metric`).

**Expected outcome:**
> No "Journey not found" error — the flow proceeds to `/benefit-metric` exactly as it does for a journey created via the `/journey` "New journey" form.

**Result:** [ ] Pass  [ ] Fail (awaiting operator retest — this is the exact reported scenario)
**Notes:** Automated equivalent (`check-jrf-s2-...js`'s AC4 test) directly reproduces this using the real, unmocked `handlePostProductFeature`/`handlePostGateConfirm` functions — confirmed no 404. Live click-through not yet performed by the operator.

---

### Scenario 2: The product view's journeys list includes the new feature

**Covers:** AC5

**Steps:**
1. After creating a feature via Scenario 1, return to the product's page.

**Expected outcome:**
> The new feature appears in the product's feature/journey list, same as any other.

**Result:** [x] Pass (automated equivalent)
**Notes:** Confirmed via test that the created journey's `productId` is correctly set on the in-memory journey object, matching the field `handleGetProductView`'s own query filters on.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — create → discovery → benefit-metric | Pending operator retest | Automated reproduction passes |
| Scenario 2 — feature appears in product view | Pass | |

**Overall verdict:** [x] All automated checks pass — ready to proceed; live operator retest recommended to close the loop
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| Scenario 1 | Live click-through by operator | Not yet performed this session | LOW | Recommend operator retest on staging now that the fix is deployed |
