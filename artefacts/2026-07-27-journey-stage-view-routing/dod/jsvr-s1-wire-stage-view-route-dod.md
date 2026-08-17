# Definition of Done: jsvr-s1 — Wire the completed-stage view route into server.js's router

**PR:** #623 (`fix(jsvr-s1): wire GET /journey/:id/stage/:name into server.js's router`, commit `6bd90899`) | **Merged:** 2026-07-27 (commit timestamp `2026-07-27 12:25:19 +1200`)
**Story:** artefacts/2026-07-27-journey-stage-view-routing/stories/jsvr-s1-wire-stage-view-route.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|------------|----------|----------------------|-----------|
| AC1: `GET /journey/:journeyId/stage/:stageName` on a completed stage returns 200 with the artefact view rendered | ✅ Yes | `AC1: GET /journey/:id/stage/discovery does not fall through to the sign-in page`; `AC1: GET /journey/:id/stage/discovery returns 200 with the stage-view title` | Router-dispatch unit test through the real exported router | None |
| AC2: Same route with no `accessToken` in session 302-redirects to `/auth/github` | ✅ Yes | `AC2: unauthenticated GET redirects to /auth/github` | Router-dispatch unit test | None |
| AC3: `POST /api/journey/:journeyId/stage/:stageName/artefact` reaches the real save handler | ✅ Yes | `AC3: POST artefact-save route does not fall through to the sign-in page`; `AC3: POST artefact-save route redirects back to the stage-view page (real handler's own success response)` | Router-dispatch unit test | None |
| AC4: Regression test dispatches these exact pathnames through the real, exported router (not a direct handler call) | ✅ Yes | All six tests in `check-jsvr-s1-wire-stage-view-route.js` `require('../src/web-ui/server').router` and dispatch real pathnames — confirmed by reading the test file's require block (line 47) rather than any direct `journey.js` handler invocation | Source read + router-dispatch unit tests | None |

Bonus coverage beyond the four ACs: `AC1 edge case: unknown stageName 302-redirects to the active chat` confirms `handleGetJourneyStageView`'s existing internal fallback is still reachable once wired — matches test plan's AC1 edge-case row.

Static confirmation: `src/web-ui/server.js` (lines ~2738 and ~2744, current master) shows both `handleGetJourneyStageView` and `handlePostJourneyStageArtefact` invoked from the dispatch chain — the fix is present in the codebase, not just in the merge commit diff.

---

## Scope Deviations

None. The story's own Out of scope section names `handleGetJourneyStage` (JSON API variant) and `handlePostJourneyRecommit` as intentionally not wired here (zero client-side callers found; flagged as a candidate for a separate dead-code review) — this is an explicitly accepted exclusion from the story text, not a defect. Re-deriving `handleGetJourneyStageView`'s internal cross-tenant/404 logic was also explicitly out of scope, already covered by `check-p0.2-journey-guard-wiring.js`.

---

## Test Plan Coverage

The dispatch instructions for this DoD pass supplied "null passed, null failed" for `check-jsvr-s1-wire-stage-view-route.js`, which is not usable evidence, so the test file was re-run directly. Actual result: **6 passed, 0 failed** — matching all six unit tests named in the test plan (2 for AC1 + 1 edge case, 1 for AC2, 2 for AC3/AC4). No Integration or NFR tests were planned (test plan states none needed for this pure route-registration fix).

---

## NFR Status

None named. The test plan states "None — confirmed with story owner. This is a routing-table fix with no new performance, security, or accessibility surface (both handlers already carry their own auth/tenant checks, unchanged by this fix)." No NFR regressions observed in the re-run.

---

## Metric Signal

No benefit-metric artefact is referenced by this story — it is an explicitly short-track bug fix (CLAUDE.md short-track skips discovery through review, including `/benefit-metric`), closing a confirmed live defect rather than pursuing a new benefit hypothesis.

---

## Outcome

**COMPLETE**
**Follow-up actions:** None required for this story. The story's own text already flags a separate, out-of-scope dead-code candidate (`handleGetJourneyStage`, `handlePostJourneyRecommit`) for a future dead-code review — this is a pre-existing, explicitly-deferred item, not a new gap found during this DoD pass.

---

## DoD Observations

Fix is present and verified live on the current master branch (`src/web-ui/server.js` dispatch chain), roughly three weeks post-merge, with no signs of regression or revert. The test plan's own noted gap — no live-staging confirmation that this closes the operator's exact recalled error text — remains an open low-risk item per the test plan's own mitigation (ask the operator to re-test on staging), not a defect in this story's delivery.
