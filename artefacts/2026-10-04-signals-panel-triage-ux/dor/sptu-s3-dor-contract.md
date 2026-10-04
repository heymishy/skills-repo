# Contract Proposal: Make the signals panel's existing sort order visible and explicit

**Story:** artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s3.md
**Date:** 2026-10-04

---

## What will be built

- `signals-panel-view.js`'s `renderSignalsPanel` extended to render a sort-order label above the signals list (text qualifying the claim to signals that have a date — see AC3) and a "no date" marker on any item with `timestamp == null`.
- New test file `tests/check-sptu-s3-signals-sort-visibility.js` (4 tests per the test plan).

## What will NOT be built

- Any change to `signals-aggregator.js`'s `_sortSignals()` or `getSignals()`'s own output order.
- A user-selectable alternate sort order.
- Any grouping/re-ordering of undated signals among themselves.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — explicit sort-order label | Unit test asserting the rendered label text | unit |
| AC2 — "no date" marker, independent of parse-error marker | Unit tests covering all 4 dated×parse-error combinations | unit |
| AC3 — label doesn't overclaim | Unit test asserting the label text is qualified, not an unconditional "sorted by recency" claim | unit |
| AC4 — no functional change | Re-run of `ep2-s1`/`ep2-s3`'s own existing test suites, unmodified | regression (no new test) |

## Assumptions

- `renderSignalsPanel` is a pure function — this story adds presentation logic only, no new route parameter, no new query string handling.
- The real measured split (693/5,340 dated, 4,647/5,340 undated) is stable enough for the label's own wording to be written once — if the real proportion shifts dramatically in the future, the wording itself doesn't need to change (it's already correctly qualified, not a specific percentage claim).

## Estimated touch points

**Files:** `src/web-ui/views/signals-panel-view.js` (modified), `tests/check-sptu-s3-signals-sort-visibility.js` (new)
**Services:** none
**APIs:** none — no route change

---

## Contract Review

Cross-checked against the story's own 4 ACs and the test plan's AC Coverage table — every AC maps to a specific test approach (AC4 explicitly maps to regression of existing suites, not a new test, matching the test plan's own stated handling). No mismatch found.

**Verdict:** ✅ PASSED — proposed implementation aligns with all ACs.
