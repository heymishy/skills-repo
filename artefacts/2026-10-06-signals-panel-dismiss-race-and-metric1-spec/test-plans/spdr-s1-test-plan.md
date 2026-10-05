## Test Plan: Disable the Dismiss/Undismiss button on submit

**Story reference:** artefacts/2026-10-06-signals-panel-dismiss-race-and-metric1-spec/stories/spdr-s1-disable-dismiss-button-on-submit.md
**Epic reference:** None — short-track
**Test plan author:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-06

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`. Extends `tests/check-sptu-s4-signals-dismiss.js` (owns the rendered dismiss-control markup).

**E2E/browser-layout detection (Step 3a):** The real double-click timing race (AC1) cannot be reproduced deterministically in a unit test (it depends on real browser navigation timing) — it is instead verified via a markup assertion (the `onsubmit` attribute is present and correctly scoped) plus reasoning already documented in the story's Architecture Constraints about why this attribute closes the race. This is the same class of gap `dswf-s1`'s own AC4 named explicitly (a real timing behaviour verified by construction/markup rather than a flaky timing-dependent automated test) — not deferred, a deliberate choice.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Second click before navigation completes has no effect | 1 test (markup assertion) | — | — | — | documented (see above) | 🟢 |
| AC2 | Single-click path unchanged | 1 test | — | — | — | — | 🟢 |
| AC3 | All pre-existing tests still pass | — | — | — | — | — | 🟢 (regression) |
| AC4 | Keyboard operability unchanged | — | — | — | — | — | 🟢 (no markup change to tabindex/focus; covered by reasoning in Architecture Constraints) |

---

## Test Data Strategy

**Source:** Synthetic signal objects, matching the existing suite's own fixtures.
**PCI/sensitivity in scope:** No.

---

## Unit Tests

### Dismiss/Undismiss form disables its own submit button on submit (AC1)

- **Verifies:** AC1
- **Action:** Render `_dismissControl` (via `renderSignalsPanel`) for a non-dismissed signal; inspect the rendered `<form>` markup
- **Expected result:** The `<form>` tag's `onsubmit` attribute is present and, when evaluated against the form's own submit button, sets `disabled` to `true` (assert the exact attribute string contains `disabled=true` scoped to a `querySelector('button')` call within the form)
- **Edge case:** Yes — this is the markup-level proof the timing race is closed by construction

### Single dismiss/undismiss click still works exactly as before (AC2)

- **Verifies:** AC2
- **Action:** Re-run the existing "Real route dispatch: POST /signals/dismiss removes the signal from the next GET /signals" test unchanged
- **Expected result:** Identical pass — the `onsubmit` attribute has no effect on server-side route dispatch or the first, legitimate submission
- **Edge case:** No — common-case regression guard

---

## Integration Tests

None beyond the existing route-dispatch suite, re-run unchanged (AC3).

---

## NFR Tests

None — no new NFR surface (see story's own NFR section: "None identified" / "None").

---

## Out of Scope for This Test Plan

- A real, automated double-click timing race test — not reliably reproducible deterministically; closed by construction instead (see E2E/browser-layout detection note above).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC1's real timing behaviour has no flaky-timing-dependent automated test | Browser navigation-timing races are not reliably reproducible in an automated test without introducing their own flakiness | Verified by construction via a markup assertion plus the story's own documented reasoning — matches `dswf-s1`'s own AC4 precedent for this class of gap |
