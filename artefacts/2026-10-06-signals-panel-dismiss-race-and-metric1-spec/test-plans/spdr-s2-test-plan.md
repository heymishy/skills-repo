## Test Plan: Automated Playwright timing spec for Metric 1

**Story reference:** artefacts/2026-10-06-signals-panel-dismiss-race-and-metric1-spec/stories/spdr-s2-metric1-playwright-timing-spec.md
**Epic reference:** None — short-track
**Test plan author:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-06

**Confirmed test runner:** `npx playwright test tests/e2e/spdr-s2-metric1-timing.spec.js` — NOT in the `npm test` chain, per ADR-018 (matches every other `tests/e2e/*.spec.js`).

**E2E/browser-layout detection (Step 3a):** This entire story IS the E2E spec — by definition E2E, not unit/integration.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Hide parse-error filter removes parse-error signals from DOM | — | — | 1 spec assertion | — | — | 🟢 |
| AC2 | 10 real dismisses persisted, verified via showDismissed | — | — | 1 spec assertion | — | — | 🟢 |
| AC3 | Full sequence completes under 15s, value printed | — | — | 1 spec assertion | — | — | 🟢 |
| AC4 | Existing seed-signals callers (ep2-s1, ep2-s3) unaffected | — | — | re-run existing specs | — | — | 🟢 (regression) |

---

## Test Data Strategy

**Source:** A custom fixture array passed to the extended `/test/seed-signals` endpoint — 3 `parse-error` signals (to be filtered out) + 12 dated, non-`parse-error` signals with distinct timestamps (10 to dismiss, 2 left over to confirm the filter/dismiss didn't over-remove).
**PCI/sensitivity in scope:** No.
**Availability:** Available now (constructed inline in the spec).

### Data requirements per AC

| AC | Data needed | Source | Notes |
|----|-------------|--------|-------|
| AC1 | ≥2 parse-error-type signals | Inline fixture | Distinguishable by a unique id prefix for assertion |
| AC2 | ≥10 dated, non-parse-error signals | Inline fixture | Distinct timestamps so sort order is also exercised incidentally |
| AC3 | N/A (timing only) | N/A | |
| AC4 | ep2-s1/ep2-s3's own existing `{ count }`-only usage | Existing specs | Re-run unchanged, not modified |

---

## E2E Tests

### Metric 1: filter→sort→dismiss×10 completes correctly and under the regression-guard ceiling

- **Verifies:** AC1, AC2, AC3
- **Precondition:** POST `/test/seed-signals` with a custom `signals` array (3 parse-error + 12 dated real-shaped signals)
- **Action:** `page.goto('/signals')`; record `Date.now()`; click "Hide parse-error"; assert no `parse-error` items remain in the DOM (AC1); click "Dismiss" on 10 signals sequentially, waiting for each navigation; record `Date.now()` again
- **Expected result:** AC1's DOM assertion passes; navigating to `/signals?showDismissed=true` shows exactly 10 `[data-signal-dismissed="true"]` elements (AC2); the measured duration is under 15000ms, logged via `console.log` for human reference (AC3)
- **Edge case:** No — this is the golden-path flow itself

### Existing seed-signals callers unaffected (AC4)

- **Verifies:** AC4
- **Action:** Re-run `tests/e2e/ep2-s1-signals-panel.spec.js` and `tests/e2e/ep2-s3-signals-pagination.spec.js` unchanged
- **Expected result:** Both pass identically to their pre-existing behaviour

---

## Out of Scope for This Test Plan

- Running this spec as part of `npm test`'s default chain — per ADR-018, Playwright specs are invoked separately.
- Re-validating `sptu-s4`'s own accessibility ACs — out of scope, already covered elsewhere.

---

## Test Gaps and Risks

None — all 4 ACs have direct E2E coverage.
