## Test Plan: Connected emotion curve across stages on the Customer experience tab

**Story reference:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s3.md
**Epic reference:** artefacts/2026-10-11-journey-cx-redesign/epics/journey-map-and-placeholder-trigger.md
**Test plan author:** Claude Sonnet 5
**Date:** 2026-10-11

---

## Note on E2E classification

AC1–AC3 verify the curve's actual rendered shape/position across stages (positive higher, negative lower, connected line, empty-state gaps) — a DOM-simulation environment (jsdom) does not compute real SVG/CSS layout, so these cannot be reliably unit-tested. Per the `/test-plan` E2E detection gate, these are classified `CSS-layout-dependent` and covered by real Playwright E2E tests (ADR-018 — already configured, no tooling gap). AC4 (text label alongside colour) and AC5 (screen-reader structure) are DOM-attribute/structure checks, testable via the real-jsdom-execution pattern already established for `ic-s3`/`ic-s4`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Connected curve renders, tracking emotion position | — | — | 1 test | — | CSS-layout-dependent | 🟡 |
| AC2 | Missing-emotion stages show an empty-state marker on the curve | — | — | 1 test | — | CSS-layout-dependent | 🟡 |
| AC3 | No-emotion-at-all journey shows a full empty state | — | — | 1 test | — | CSS-layout-dependent | 🟡 |
| AC4 | Curve points carry a text label, not colour alone (MC-A11Y-02) | 1 test | — | — | — | — | 🟢 |
| AC5 | Screen-reader-accessible structure | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|---------------------------|---------|
| Real rendered curve shape/position (positive higher, negative lower, connected line) cannot be verified without real SVG/CSS layout computation | AC1, AC2, AC3 | CSS-layout-dependent | jsdom does not compute real layout/position for SVG elements | E2E test — `tests/e2e/jcx-s3-emotion-curve.spec.js` (Playwright, ADR-018 already configured — not a tooling gap) |

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup; E2E spec seeds a real journey via `seedJourneyWithStages` (established helper, `ep1-s3`/`ic-s2`/`ic-s3`/`ic-s4` precedent).
**PCI/sensitivity in scope:** No
**Availability:** Available now (E2E spec requires `DATABASE_URL` to actually execute, same pre-existing dependency as every other E2E spec in this feature area — see `ic-s4`'s own DoD RISK-ACCEPT entry for the known local-execution gap and its root cause)
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1, AC2, AC3 | A journey with 3+ stages, mixed emotion values (some set, some null) | `seedJourneyWithStages` (reused) | None | |
| AC4, AC5 | A rendered curve with 1+ emotion-set stages | Synthetic mock pool | None | |

### PCI / sensitivity constraints

None.

### Gaps

None beyond the already-noted E2E local-execution gap (pre-existing, not new to this story).

---

## Unit Tests

### AC4: curve points carry a text label alongside colour

- **Verifies:** AC4
- **Precondition:** A rendered curve with stages set to each of `positive`/`neutral`/`negative`/`mixed`
- **Action:** Inspect the rendered DOM for each curve point
- **Expected result:** Each point's markup contains a text label matching its emotion value (e.g. "positive") — not conveyed by a CSS class/colour alone, matching `MC-A11Y-02`'s own established convention (confirmed in `journeys.js`'s existing emotion chip rendering)
- **Edge case:** No

### AC5: curve exposes an accessible linear structure

- **Verifies:** AC5
- **Precondition:** A rendered curve with 3+ stages
- **Action:** Inspect the rendered DOM/ARIA structure
- **Expected result:** The curve's content is reachable in document order via an accessible mechanism (e.g. a list structure or `aria-label`/`role` annotations) — not purely a visual-only SVG with no text alternative
- **Edge case:** No

---

## Integration Tests

None — AC1–AC3's own real integration-level behavior (does the curve read live data from `customer_journey_stages.emotion` correctly) is covered by the E2E tests below, which exercise the real handler end to end; a separate jsdom integration layer would not add coverage a DOM-simulation environment can't already provide for layout-dependent assertions.

---

## E2E Tests (`tests/e2e/jcx-s3-emotion-curve.spec.js`)

### Connected curve tracks emotion position across stages

- **Verifies:** AC1
- **Precondition:** Real browser, journey with 3 stages set to `negative`, `neutral`, `positive`
- **Action:** Load the Customer experience tab
- **Expected result:** The curve's rendered points are positioned in ascending order (negative lowest, positive highest) and visually connected by a line — assert via each point's own computed Y-position (Playwright can reliably measure this in a real rendering engine)

### Missing-emotion stage shows an empty-state marker, not a silent gap

- **Verifies:** AC2
- **Precondition:** Real browser, journey with 3 stages, middle stage has no `emotion` set
- **Action:** Load the tab
- **Expected result:** The middle stage's own curve point renders a distinct empty-state marker (not a flat/default position, not silently skipped) — the two set stages on either side still connect correctly around it

### No-emotion-at-all journey shows a full empty state

- **Verifies:** AC3
- **Precondition:** Real browser, journey where no stage has `emotion` set
- **Action:** Load the tab
- **Expected result:** The whole curve area renders a clear, friendly empty state — not a blank space, not a broken-looking flat line

---

## NFR Tests

### Performance — curve renders without perceptible delay

- **NFR addressed:** Performance
- **Measurement method:** Manual observation during `/verify-completion`, journeys up to 20 stages
- **Pass threshold:** No perceptible delay vs. the prior plain-text rendering
- **Tool:** Manual, live Chrome

---

## Gap table

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----|---------------------------|---------|
| Real rendered curve shape/position | AC1, AC2, AC3 | CSS-layout-dependent | jsdom does not compute real SVG/CSS layout | E2E test, already written above — not a gap requiring RISK-ACCEPT, since real coverage exists |
