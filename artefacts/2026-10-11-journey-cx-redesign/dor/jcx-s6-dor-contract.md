# Contract Proposal — jcx-s6: Restructure the Customer experience tab into a real timeline + swimlane grid

## What will be built

In `src/web-ui/routes/journeys.js`'s own Customer-experience-tab rendering branch of `handleGetJourneyCanvas` (confirmed via a repo-wide grep — `sw-emotion-curve`/`sw-journey-stage`/`sw-persona-card` class markers appear only in this one file, so this is the complete touch-point list, not file-scoped guesswork):

- Replace the current vertical stack of per-stage `<div>` boxes with a CSS-grid-based layout: stage columns left-to-right (header row), swimlane rows beneath (emotion curve, customer actions/touchpoints, pain points, opportunities), each row's cells aligned under their own stage column.
- Move the existing emotion-curve SVG (built by `buildEmotionCurve`) into its own swimlane row; add a text element bearing each point's own stage name directly on the chart; size the curve's own SVG viewBox/width so its rightmost point reaches ≥80% of the row container's width for 3+ stages.
- Add two new swimlane rows rendering `customer_actions` and `touchpoints` — both fields are already returned by the existing stage SELECT in `handleGetJourneyCanvas` (no query change).
- Add a dedicated outer container class (`sw-cx-swimlane-grid`) to the Customer-experience-tab's own render branch only — the Delivery tab's own render branch (same function, different conditional) keeps its existing class/layout unchanged.
- Rebuild the existing accessible-linear-structure mechanism (the visually-hidden `<ul>` `jcx-s3` built for the emotion curve alone) to cover the full new grid — one list item per stage, each carrying that stage's full data set (emotion, pain points, opportunities, actions, touchpoints), in document order.
- New CSS for the grid/row/column layout, added inline in the same `<style>` block `journeys.js` already uses for this page (no new stylesheet, no new build step).

## What will NOT be built

- No change to the Delivery tab's own layout or rendering branch.
- No change to the Canvas (`ic-s1`–`ic-s4`, drawflow-based) view.
- No change to any query — `handleGetJourneyCanvas`'s existing stage SELECT already returns every field this story renders.
- No split of the emotion curve into separate positive/negative rows, and no first-person "I want/I need" persona reframing — both logged as deferred, data-model-affecting follow-ups in `decisions.md` (2026-10-13 DESIGN entry), not built here.
- No new chart library or UI framework dependency — pure inline SVG/HTML/CSS, matching the existing architecture.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (left-to-right columns) | Playwright: each stage column header's `getBoundingClientRect().x` ascends in stage order | E2E |
| AC2 (swimlane rows aligned) | Playwright: each row's own cells share Y-position; each cell shares its stage column's X-position | E2E |
| AC3 (curve labels + ≥80% width) | Playwright: text element per point bearing stage name; rightmost point X ≥ 80% of row container width | E2E |
| AC4 (actions/touchpoints surfaced) | Unit (rendered `bodyContent` contains both fields) + Integration (confirms no query-shape change) | unit, integration |
| AC5 (accessible linear structure preserved) | Unit: DOM/ARIA inspection of the rebuilt accessible list | unit |
| AC6 (CX tab visually distinct from Delivery) | Integration: CX container has `sw-cx-swimlane-grid` class, Delivery container does not | integration |

## Assumptions

- The existing `seedJourneyWithStages` E2E helper (established by `ic-s2`–`ic-s4`/`jcx-s3`) can seed `customer_actions`/`touchpoints` values on stages — confirmed these are ordinary string columns already supported by that helper's own existing stage-creation call, no helper change needed.
- "≥80% of row container width" is a reasonable, implementation-agnostic threshold for "doesn't leave a large empty region" — chosen to be generous enough not to over-constrain the exact visual design, while still being a precise, non-vague number a test can assert.
- The Delivery tab's own existing CSS class naming (whatever it currently is) does not already coincidentally match `sw-cx-swimlane-grid` — confirmed via the same repo-wide grep above (no existing use of that exact string).

## Estimated touch points

**Files:** `src/web-ui/routes/journeys.js` (rendering + inline CSS), `tests/check-jcx-s6-swimlane-grid.js` (new), `tests/e2e/jcx-s6-swimlane-grid.spec.js` (new)
**Services:** None
**APIs:** None new — no route/query change
