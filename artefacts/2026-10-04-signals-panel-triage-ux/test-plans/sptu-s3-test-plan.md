## Test Plan: Make the signals panel's existing sort order visible and explicit

**Story reference:** artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s3.md
**Epic reference:** artefacts/2026-10-04-signals-panel-triage-ux/epics/signals-panel-triage-controls.md
**Test plan author:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-04

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`.

**Real architecture grounding (confirmed by direct code read):** `renderSignalsPanel` (`signals-panel-view.js:72`) is a pure function of `(signals, csrfToken, pagination)`. This story adds a label above the list and a per-item marker for `timestamp == null` signals — both pure presentation, no new route logic, no change to `getSignals()`/`_sortSignals()`/`paginateSignals()`.

**E2E/browser-layout detection (Step 3a):** No AC depends on CSS layout or rendered position — all four are DOM text-content/markup-presence assertions, fully jsdom-safe. No E2E test required.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Page states its own sort order explicitly | 1 test | — | — | — | — | 🟢 |
| AC2 | No-timestamp signals visually distinguished | 2 tests | — | — | — | — | 🟢 |
| AC3 | Stated sort order matches real measured behaviour | 1 test | — | — | — | — | 🟢 |
| AC4 | No functional change to order/content | — | — | — | — | — | 🟢 (regression — reuses `ep2-s1`/`ep2-s3`'s own existing suites unchanged) |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — fixture arrays with a deliberate mix of dated and undated (`timestamp: null`) signals, including one signal that is both `parse-error` type AND undated (to test AC2's independence claim).
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Any signal array | Synthetic | None | |
| AC2 | A signal with `timestamp: null`; a separate signal that is both `type: 'parse-error'` AND `timestamp: null` | Synthetic | None | Tests marker independence |
| AC3 | N/A — this is a static-copy assertion | N/A | None | |
| AC4 | `ep2-s1`/`ep2-s3`'s own existing fixtures | Synthetic | None | Regression only |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### renderSignalsPanel includes a visible sort-order label

- **Verifies:** AC1
- **Precondition:** Any non-empty signal array
- **Action:** Call `renderSignalsPanel(signals, csrfToken, pagination)`
- **Expected result:** Returned HTML contains a visible label stating the sort behaviour (e.g. a string matching `/sorted by.*recent/i`)
- **Edge case:** No

### A signal with timestamp=null carries a distinct "no date" marker

- **Verifies:** AC2
- **Precondition:** A signal array including one entry with `timestamp: null`
- **Action:** Call `renderSignalsPanel`
- **Expected result:** That item's rendered markup contains a "no date" text/icon marker; a dated sibling signal's markup does not
- **Edge case:** No

### The "no date" marker and the parse-error marker are independent — a signal can carry both or either alone

- **Verifies:** AC2
- **Precondition:** Four signals: (dated, not parse-error), (undated, not parse-error), (dated, parse-error), (undated, parse-error)
- **Action:** Call `renderSignalsPanel`
- **Expected result:** Each of the 4 items shows exactly the markers its own combination implies — the undated+parse-error item shows BOTH markers, not just one overriding the other
- **Edge case:** Yes — the combined case is the real risk

### The sort-order label never claims the full list is sorted by recency without qualification

- **Verifies:** AC3
- **Precondition:** The rendered label string from the AC1 test
- **Action:** Assert on its exact text
- **Expected result:** The string does NOT match an unqualified claim (e.g. it must not be exactly "Sorted by most recent first" with no further qualifier) — it must include language scoping the claim to signals that have a date (e.g. contains "no date" or "signals with no date" or equivalent qualifying text)
- **Edge case:** No

---

## Integration Tests

None — this story is presentation-only within `renderSignalsPanel`, already covered by the unit tests above; there is no new route-handler seam to integration-test.

---

## NFR Tests

### No measurable performance change

- **NFR addressed:** Performance
- **Measurement method:** No dedicated test — the added work is a single `timestamp == null` boolean check per already-iterated signal item, within `ep2-s1`'s own existing per-item render loop. Confirmed by code review, not a new timing test, consistent with the story's own NFR statement.
- **Pass threshold:** N/A
- **Tool:** N/A

### Accessibility — "no date" indicator is not colour-only

- **NFR addressed:** Accessibility
- **Measurement method:** Covered by the AC2 unit tests above — the marker assertion checks for a text/icon string, not a CSS class/colour-only signal.
- **Pass threshold:** Marker is present as visible text or an icon with accessible text, not a bare colour change.
- **Tool:** Covered by `node tests/check-sptu-s3-signals-sort-visibility.js` (AC2's own tests, cross-referenced)

---

## Out of Scope for This Test Plan

- Any test of `signals-aggregator.js`'s own `_sortSignals` logic — unchanged, already covered by `ep1-s1`'s own test suite
- Any test of a user-selectable alternate sort order — not in this story's scope

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC4 ("no functional change") has no dedicated new test of its own | It is a negative claim about `ep2-s1`/`ep2-s3`'s own existing, already-tested behaviour | Verified by re-running `ep2-s1`/`ep2-s3`'s own existing test suites unchanged at `/subagent-execution`'s final regression pass — a new passing test here would just duplicate those suites |
