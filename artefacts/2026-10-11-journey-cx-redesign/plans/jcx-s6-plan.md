# Implementation Plan: Restructure the Customer experience tab into a real timeline + swimlane grid

**Story:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s6.md
**DoR:** artefacts/2026-10-11-journey-cx-redesign/dor/jcx-s6-dor.md
**Contract:** artefacts/2026-10-11-journey-cx-redesign/dor/jcx-s6-dor-contract.md
**Test plan:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s6-test-plan.md

## Architecture correction (found during implementation-planning, not during DoR)

The DoR contract described "two separate render branches" for Customer-experience vs. Delivery. Reading `src/web-ui/routes/journeys.js` directly shows the real structure: **one shared per-stage list** (`#sw-journey-stages`), where each stage renders a `.sw-stage-card` (name/health/Edit-stage/Map-feature/Add-placeholder — shared chrome) plus two sibling annotation blocks (`.sw-stage-annotations--delivery`, `.sw-stage-annotations--customer-experience`), shown/hidden purely via one CSS rule per view: `.sw-journey-canvas--view-X .sw-stage-annotations--Y{display:block}`. The persona card and emotion curve already live OUTSIDE this list, as their own `.sw-stage-annotations--customer-experience` siblings. This doesn't change any AC, test, or constraint — it changes HOW the restructure is implemented. Noted here rather than reopening DoR, since nothing agreed at DoR time is contradicted.

**Resulting design decision:** the new swimlane grid becomes a NEW sibling container (same `sw-stage-annotations sw-stage-annotations--customer-experience` class pair the persona card already uses, so it piggybacks on the existing show/hide CSS rule with zero new JS). `#sw-journey-stages` itself gets hidden in CX view too (new CSS rule, mirroring the existing canvas-view rule) — its per-stage `.sw-stage-annotations--customer-experience` blocks become fully unreachable in any view, so `buildCustomerExperienceAnnotations` is deleted as dead code, not left in place. The "Edit stage" link is preserved per stage **inside the new grid's own column headers** (reusing the existing `.sw-stage-edit` class, which is already `document`-delegated — confirmed by reading the click handler and its own comment, added specifically because the same link already needed to work from inside drawflow canvas nodes, a context exactly as structurally distant from `#sw-journey-stages` as this new grid is). "Map feature"/"Add placeholder" are dropped from the CX view (genuinely delivery-chrome, per AC6) — still reachable from the Delivery tab, unchanged.

## File map

| File | Change |
|------|--------|
| `src/web-ui/routes/journeys.js` | New `buildCustomerExperienceSwimlaneGrid(stages)` function; `buildEmotionCurve` modified (stage-name labels, responsive width, becomes one row not a standalone block); `buildCustomerExperienceAnnotations` deleted (dead after the restructure); `bodyContent` assembly updated; new CSS rules added to the existing inline `<style>` block |
| `tests/check-jcx-s6-swimlane-grid.js` (new) | Unit + integration tests (AC4, AC5, AC6) |
| `tests/e2e/jcx-s6-swimlane-grid.spec.js` (new) | E2E tests (AC1, AC2, AC3, AC7) |
| `tests/check-jcx-s3-emotion-curve.js` | Update — `buildEmotionCurve`'s own markup changes (stage-name text added, SVG width attribute changes to `100%`); existing AC4/AC5 assertions re-pointed at the new shape, not weakened |
| `tests/e2e/jcx-s3-emotion-curve.spec.js` | Update — curve now renders inside the grid, not a standalone container; selectors updated |
| `tests/check-jcx-s4-persona-card.js` | Check only — persona card itself is unchanged; confirm its own tests don't assert anything about sibling CX markup that moved |

## Tasks

### Task 1 (RED): new grid-builder unit tests
Write `tests/check-jcx-s6-swimlane-grid.js` calling a not-yet-exported `buildCustomerExperienceSwimlaneGrid` indirectly through `handleGetJourneyCanvas` (matching this codebase's own convention — internal builder functions aren't unit-tested directly, only through the handler's own rendered output, per every prior `buildX` function in this file). Assert: AC4 (customer_actions/touchpoints rows present with correct text), AC5 (accessible list covers every stage's full field set, in order), AC6 (`sw-cx-swimlane-grid` class present on the CX container, absent from the Delivery container). All must fail (function doesn't exist yet / old markup doesn't have these rows).

### Task 2 (GREEN): implement `buildCustomerExperienceSwimlaneGrid`
Add the new function in `journeys.js`, modify `buildEmotionCurve` for stage-name labels + responsive width (SVG `width="100%"` instead of a fixed pixel value, same `viewBox` sizing logic), delete `buildCustomerExperienceAnnotations`, wire the new container into `bodyContent`, add the new CSS rules (hide `#sw-journey-stages` in CX view; grid/row/scroll styles, reusing existing `--ink`/`--ink-2`/`--line`/`--surface`/`--bg` tokens — no new colors). Run Task 1's tests until green.

### Task 3 (RED→GREEN): E2E tests for AC1, AC2, AC3, AC7
Write `tests/e2e/jcx-s6-swimlane-grid.spec.js` per the test plan's own E2E section (column X-position ordering, row Y-alignment, curve label/width threshold, 8-stage horizontal-scroll-with-pinned-labels at a 1280×800 viewport). Run against the real implementation from Task 2.

### Task 4: fix regression in `jcx-s3`'s own test files
Run `node tests/check-jcx-s3-emotion-curve.js` and `tests/e2e/jcx-s3-emotion-curve.spec.js` — update assertions to match the new markup shape (stage-name text now present on-chart; curve is a row inside the grid, not a standalone container) without weakening what they verify. Confirm `check-jcx-s4-persona-card.js` needs no change (persona card itself untouched).

### Task 5: full suite + Docker/Linux parity check + live Chrome re-verification
`npm test` full suite, 0 failures. Verify in a Linux/Node24 Docker container (this session's own established practice for layout-adjacent changes). Live-check on `wuce-staging.fly.dev` once deployed, against the approved mockup (`https://claude.ai/artifact/Vn33thqFAs8heUaWDZUJNK`).

## Self-review checklist
- [x] Architecture correction documented, not silently worked around
- [x] Dead code (`buildCustomerExperienceAnnotations`) named for removal, not left as cruft
- [x] Edit-stage reachability from the CX view preserved (functional regression avoided)
- [x] Regression risk to `jcx-s3`'s own tests named explicitly, not discovered cold
- [x] No scope beyond the 7 ACs
