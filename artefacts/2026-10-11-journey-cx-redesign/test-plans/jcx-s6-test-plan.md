## Test Plan: Restructure the Customer experience tab into a real timeline + swimlane grid

**Story reference:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s6.md
**Epic reference:** artefacts/2026-10-11-journey-cx-redesign/epics/journey-map-and-placeholder-trigger.md
**Review reference:** artefacts/2026-10-11-journey-cx-redesign/review/jcx-s6-review-1.md (PASS, 1 MEDIUM resolved below — see Note on AC3/AC6)
**Test plan author:** Claude Sonnet 5
**Date:** 2026-10-13

---

## Note on E2E classification

AC1–AC3 verify the grid's actual rendered column/row layout (left-to-right stage order, swimlane row alignment, curve width/position) — a DOM-simulation environment (jsdom) does not compute real CSS grid/flex layout, so these cannot be reliably unit-tested. Per the `/test-plan` E2E detection gate, these are classified `CSS-layout-dependent` and covered by real Playwright E2E tests (ADR-018 — already configured, no tooling gap), following `jcx-s3`'s own established precedent for this exact feature area. AC4 and AC5 are DOM-presence/structure checks, testable via the real-jsdom-execution pattern already established for `jcx-s1`/`jcx-s3`.

## Note on AC3/AC6 (resolves review finding 1-M1)

The review flagged AC3's "no longer leaving a large empty region" and AC6's "visually distinguishable at a glance" as too soft to test precisely. Pinned down here:

- **AC3** is tested as a concrete threshold: the emotion-curve SVG's own rightmost data point's x-coordinate must be at least 80% of the curve row's own container width, for a journey with 3+ stages (Playwright `getBoundingClientRect`/attribute read — real layout required, hence E2E not unit).
- **AC6** is tested as a concrete DOM-class check, not a visual/E2E check: the Customer experience tab's own outer grid container must carry a dedicated CSS class (e.g. `sw-cx-swimlane-grid`) that the Delivery tab's own container does not carry. This is a plain DOM-presence assertion, testable via jsdom — no real browser rendering needed, since "visually distinguishable" is being satisfied by a class-driven styling difference, not by an assertion about pixel appearance itself.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Stages laid out left-to-right as columns, not stacked | — | — | 1 test | — | CSS-layout-dependent | 🟡 |
| AC2 | Emotion/pain-points/opportunities/actions-touchpoints render as labeled swimlane rows, aligned under stage columns | — | — | 1 test | — | CSS-layout-dependent | 🟡 |
| AC3 | Curve carries stage names on-chart; fills ≥80% of row width for 3+ stages | — | — | 1 test | — | CSS-layout-dependent | 🟡 |
| AC4 | `customer_actions`/`touchpoints` surfaced as their own rows | 1 test | 1 test | — | — | — | 🟢 |
| AC5 | Accessible linear structure preserved through the restructure | 1 test | — | — | — | — | 🟢 |
| AC6 | CX tab carries a distinct container class vs. the Delivery tab | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|---------------------------|---------|
| Real rendered column/row grid layout (left-to-right order, row alignment, curve width) cannot be verified without real CSS layout computation | AC1, AC2, AC3 | CSS-layout-dependent | jsdom does not compute real CSS grid/flex layout or SVG geometry | E2E test — `tests/e2e/jcx-s6-swimlane-grid.spec.js` (Playwright, ADR-018 already configured — not a tooling gap) |

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup; E2E spec seeds a real journey via `seedJourneyWithStages` (established helper, `ic-s2`–`ic-s4`/`jcx-s3` precedent).
**PCI/sensitivity in scope:** No
**Availability:** Available now — local Postgres SSL gap (`ncdv-s2`) and the dashboard CSRF gap it unblocked investigation of are both already resolved this session; `jcx-s3`'s own E2E spec reached real dispatch successfully once `ncdv-s2` shipped, so this story's E2E spec should execute for real locally, not just in CI.
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1, AC2, AC3 | A journey with 3+ stages, mixed emotion/pain-points/opportunities/actions/touchpoints values | `seedJourneyWithStages` (reused) | None | |
| AC4, AC5, AC6 | A rendered canvas with 1+ stages holding `customer_actions`/`touchpoints` data | Synthetic mock pool | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### AC4 (unit): rendered stage card includes customer_actions and touchpoints text

- **Verifies:** AC4
- **Precondition:** A stage row with `customer_actions` and `touchpoints` both set to non-empty strings
- **Action:** Render the Customer experience tab via `handleGetJourneyCanvas` with a mock pool returning that stage
- **Expected result:** The rendered `bodyContent` contains both the `customer_actions` and `touchpoints` values, each inside its own labeled row element (not merged into an existing field's text)
- **Edge case:** No

### AC5: accessible linear structure preserved through the restructure

- **Verifies:** AC5
- **Precondition:** A rendered grid with 3+ stages, mixed emotion/pain-points/opportunities data
- **Action:** Inspect the rendered DOM/ARIA structure
- **Expected result:** A screen-reader-reachable linear structure (e.g. a visually-hidden `<ul>`/`<ol>` or equivalent `aria-label`/`role` annotations) lists every stage, in document order, with its own emotion/pain-points/opportunities/actions/touchpoints values — equivalent to `jcx-s3`'s own existing AC5 mechanism, rebuilt for the new grid structure rather than lost
- **Edge case:** No

---

## Integration Tests

### AC4 (integration): getJourneyCanvas's own stage query already selects customer_actions/touchpoints — rendering reflects it

- **Verifies:** AC4
- **Precondition:** Real handler, mock pool matching `handleGetJourneyCanvas`'s own existing stage SELECT shape (already includes `customer_actions`, `touchpoints`, `channel`)
- **Action:** Call `handleGetJourneyCanvas` directly
- **Expected result:** No query shape change needed (confirms the Architecture Constraint that this is rendering-only); the returned `bodyContent` surfaces the already-queried fields that were previously fetched but not rendered

### AC6: Customer experience tab's own container carries a distinct class from the Delivery tab's

- **Verifies:** AC6
- **Precondition:** The same journey/stage data, rendered once via the Customer-experience code path and once via the Delivery code path (both already exist in `handleGetJourneyCanvas`)
- **Action:** Inspect both rendered outputs' outer container elements
- **Expected result:** The Customer experience container carries a dedicated class (e.g. `sw-cx-swimlane-grid`) that the Delivery container does not carry — a plain, precise DOM-class assertion, not a pixel/visual one, directly resolving review finding 1-M1's AC6 concern

---

## E2E Tests (`tests/e2e/jcx-s6-swimlane-grid.spec.js`)

### Stages render left-to-right as columns, not stacked

- **Verifies:** AC1
- **Precondition:** Real browser, journey with 3 stages
- **Action:** Load the Customer experience tab
- **Expected result:** Each stage column header's own X-position increases left-to-right in document/stage order (assert via each header's `getBoundingClientRect().x`, ascending) — not stacked at the same X with increasing Y, which is today's actual behaviour

### Swimlane rows align under their own stage columns

- **Verifies:** AC2
- **Precondition:** Real browser, same 3-stage journey, each stage with emotion/pain-points/opportunities/actions/touchpoints all set
- **Action:** Load the tab
- **Expected result:** For each swimlane row (emotion, actions/touchpoints, pain points, opportunities), each stage's own cell in that row shares the same Y-position as its sibling cells in the same row (assert via `getBoundingClientRect().y` equality across the row), and the same X-position as that stage's own column header

### Emotion curve carries stage names and fills ≥80% of its row's width for 3+ stages

- **Verifies:** AC3
- **Precondition:** Real browser, same 3-stage journey with all 3 stages' `emotion` set
- **Action:** Load the tab
- **Expected result:** Each curve point has a text element bearing its own stage's name, positioned at/near that point (not only in a separate list); the curve's own rightmost point's X-coordinate is at least 80% of the curve row container's own width

---

## NFR Tests

### Accessibility — AC5's linear structure is reachable without a mouse

- **NFR addressed:** Accessibility (WCAG 2.1 AA)
- **Measurement method:** `check-jcx-s6-swimlane-grid.js`'s own AC5 unit test (keyboard/screen-reader structure, not visual)
- **Pass threshold:** Every stage's full data set is reachable via the accessible linear structure, in document order
- **Tool:** jsdom DOM inspection

### Performance — grid renders without perceptible delay

- **NFR addressed:** Performance
- **Measurement method:** Manual observation during `/verify-completion`, journeys up to 20 stages
- **Pass threshold:** No perceptible delay vs. the prior vertical-stack rendering
- **Tool:** Manual, live Chrome

---

## Gap table

No gaps beyond the CSS-layout-dependent AC1–AC3, already covered by real E2E tests above (not a RISK-ACCEPT-requiring gap, since real coverage exists).
