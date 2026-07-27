# Test Plan: Wire the completed-stage view route into server.js's router

**Story reference:** artefacts/2026-07-27-journey-stage-view-routing/stories/jsvr-s1-wire-stage-view-route.md
**Epic reference:** None — short-track bug fix (CLAUDE.md short-track: /test-plan → /definition-of-ready → coding agent)
**Test plan author:** Copilot
**Date:** 2026-07-27

---

## Background

Operator reported: "Testing the current staging resume, it resumes to the open skill stage but if I use the breadcrumb navigation to go back or forward a step, it gives an error Session not complete yet error." Investigation confirmed the actual, live, reproducible defect: `GET /journey/:journeyId/stage/:stageName` (`handleGetJourneyStageView` in `src/web-ui/routes/journey.js`) — the destination of every "view a completed stage's artefact" breadcrumb link in the app (both the live chat page's stage-nav strip in `skills.js` and the stage-view page's own strip in `journey.js`) — was fully implemented and unit-tested in isolation, but was never registered as a route in `src/web-ui/server.js`'s dispatch chain. Confirmed via live local repro (server booted locally, authenticated via the E2E auth-stub, `GET /journey/<id>/stage/discovery` as a logged-in user): the request silently falls through to the router's unconditional final `else` branch and returns a 200 sign-in page instead of the artefact view — not the exact "Session not complete yet" text the operator recalled, but a real, confirmed, and worse defect (looks like the user got logged out). Its sibling save route, `POST /api/journey/:journeyId/stage/:stageName/artefact` (`handlePostJourneyStageArtefact`), used by that same page's "Edit artefact" inline-save form, is unwired for the identical reason.

Two other functions exported from `journey.js` — `handleGetJourneyStage` (a JSON API variant of the same read) and `handlePostJourneyRecommit` (needs-review recommit flow) — are also unwired, but have zero client-side callers anywhere in the codebase (confirmed by grep across `skills.js`/`journey.js` for any fetch/form referencing their URL patterns). They are out of scope for this fix — wiring a route nothing calls does not close the reported gap, and per the established `alrf-s6` precedent (dead code found alongside a real gap is removed, not wired), they are flagged as a candidate for a follow-up dead-code check rather than silently wired here.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `GET /journey/:journeyId/stage/:stageName` is registered in server.js and dispatches to `handleGetJourneyStageView` for a completed stage, returning the artefact view (not the sign-in page) | 2 tests | — | — | — | — | 🟢 |
| AC2 | The same route, requested unauthenticated, 302-redirects to `/auth/github` (not a 200 sign-in-page body) | 1 test | — | — | — | — | 🟢 |
| AC3 | `POST /api/journey/:journeyId/stage/:stageName/artefact` is registered and dispatches to `handlePostJourneyStageArtefact` | 1 test | — | — | — | — | 🟢 |
| AC4 | Route-registration regression test: dispatches a real HTTP request through the actual exported router/app (not a direct handler call) for both new routes, so a future removal of the wiring fails this test | 2 tests | — | — | — | — | 🟢 |
| AC5 | Existing cross-tenant 404 and no-artefact-yet redirect behaviour inside `handleGetJourneyStageView` itself is unchanged (already covered by `check-p0.2-journey-guard-wiring.js`) — confirmed still green, not re-tested here | — | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All ACs are unit/router-dispatch testable without a browser or live DB.

---

## Test Data Strategy

**Source:** Synthetic (in-memory journey-store fixtures, matching the existing pattern in `check-p0.2-journey-guard-wiring.js`)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|------------------|-------|
| AC1 | A journey with one completedStages entry (skillName, artefactPath) | In-memory fixture via `_setHtmlSession`/journey-store test seams | None | Same shape as existing `handleGetJourneyStageView` unit tests |
| AC2 | A request object with no `session.accessToken` | Inline in test | None | |
| AC3 | Same journey fixture as AC1 | In-memory fixture | None | |
| AC4 | The real `createApp()`/router entry point from server.js, invoked with a mock req/res pair carrying a real `pathname` | server.js's exported app factory | None | This is the test that would have caught the original bug — it must go through the actual dispatch chain, not call the handler function directly |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Route is registered and reaches handleGetJourneyStageView for a completed stage

- **Verifies:** AC1
- **Precondition:** A journey exists in the store with `completedStages: [{ skillName: 'discovery', artefactPath: '...' }]`; requester is the journey's tenant owner
- **Action:** Dispatch `GET /journey/<id>/stage/discovery` through the real router
- **Expected result:** 200 response containing the rendered artefact HTML (not the sign-in page's `<title>Sign in` marker)
- **Edge case:** No

### Route redirects home page correctly when stage has no artefact yet

- **Verifies:** AC1 (existing internal handler behaviour, confirmed still reachable once wired)
- **Precondition:** Journey exists, requested stageName is not in completedStages
- **Action:** Dispatch `GET /journey/<id>/stage/not-a-real-stage` through the real router
- **Expected result:** 302 redirect to the active skill's chat URL (matches `handleGetJourneyStageView`'s existing fallback, now actually reachable end-to-end)
- **Edge case:** Yes — confirms wiring didn't regress the handler's own internal fallback logic

### Unauthenticated request redirects to GitHub auth, not the sign-in page body

- **Verifies:** AC2
- **Precondition:** `req.session` has no `accessToken`
- **Action:** Dispatch `GET /journey/<id>/stage/discovery` through the real router
- **Expected result:** 302 redirect to `/auth/github`
- **Edge case:** No

### Artefact-save route is registered and reaches handlePostJourneyStageArtefact

- **Verifies:** AC3
- **Precondition:** Same completed-stage journey fixture as AC1
- **Action:** Dispatch `POST /api/journey/<id>/stage/discovery/artefact` with a body `{ content: 'edited text' }` through the real router
- **Expected result:** 302 redirect back to `/journey/<id>/stage/discovery` (the handler's own success response), confirming the request reached the real handler rather than falling through to the sign-in page
- **Edge case:** No

### Router-dispatch regression test — GET stage-view route survives a future de-wiring

- **Verifies:** AC4
- **Precondition:** The real `createApp()`/router entry point is used, not a direct `require('./routes/journey').handleGetJourneyStageView(...)` call
- **Action:** Send a real pathname (`/journey/<id>/stage/discovery`) through the router dispatch
- **Expected result:** Response body does not contain the sign-in page's distinguishing marker (`Sign in — Skills Platform`); this test fails if the `else if` branch is ever removed from server.js again
- **Edge case:** Yes — this is the specific regression class this fix closes

### Router-dispatch regression test — POST artefact-save route survives a future de-wiring

- **Verifies:** AC4
- **Precondition:** Same as above, for the POST artefact route
- **Action:** Send the real pathname/method through the router dispatch
- **Expected result:** Response is not the sign-in page
- **Edge case:** Yes

---

## Integration Tests

None beyond the router-dispatch tests above — this fix is pure route-registration; no new interaction between components is introduced (both handlers already exist and are independently correct, per the pre-existing `check-p0.2-journey-guard-wiring.js` coverage).

---

## NFR Tests

None — confirmed with story owner. This is a routing-table fix with no new performance, security, or accessibility surface (both handlers already carry their own auth/tenant checks, unchanged by this fix).

---

## Out of Scope for This Test Plan

- `handleGetJourneyStage` (JSON API variant) and `handlePostJourneyRecommit` — unwired, but zero client callers found; not part of the reported defect. Flagged for a separate dead-code follow-up, not fixed here.
- Re-verifying `handleGetJourneyStageView`'s internal cross-tenant/404 logic — already covered by `check-p0.2-journey-guard-wiring.js`; this test plan only confirms that coverage is still reachable once wired, not re-deriving it.
- Browser/E2E confirmation that the breadcrumb `<a>` click actually lands here — the link `href` values are unchanged by this fix (they already pointed at the correct path); only the server's ability to answer that path changes. Covered by the router-dispatch unit tests instead.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| No live-staging confirmation that this specific fix resolves the operator's exact recalled error text ("Session not complete yet") | The exact text did not reproduce locally against the confirmed unwired-route bug; it may describe a different, not-yet-found path, or may be the operator's recollection of the sign-in-page defect in different words | Ship this fix regardless (it closes a real, confirmed, worse defect); ask the operator to re-test breadcrumb back-navigation on staging after merge and report back if the exact wording recurs from a different trigger |
