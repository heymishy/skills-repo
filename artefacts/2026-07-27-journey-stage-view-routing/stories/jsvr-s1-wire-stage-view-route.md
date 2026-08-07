# jsvr-s1: Wire the completed-stage view route into server.js's router

**Track:** Short-track (bug fix) — CLAUDE.md short-track skips discovery through review; starts at /test-plan.

## Background

Operator report: "Testing the current staging resume, it resumes to the open skill stage but if I use the breadcrumb navigation to go back or forward a step, it gives an error Session not complete yet error." Investigation (this session) confirmed a real, live, reproducible defect distinct from the recalled error text: `GET /journey/:journeyId/stage/:stageName` — the URL every "view a completed stage" breadcrumb link in the app points at — has a fully-implemented, unit-tested handler (`handleGetJourneyStageView` in `src/web-ui/routes/journey.js`) that was never registered as a route in `src/web-ui/server.js`. An authenticated user clicking any such breadcrumb link is silently served the sign-in page instead of the artefact view. Its sibling save route, `POST /api/journey/:journeyId/stage/:stageName/artefact`, has the same gap.

## User story

As a pipeline operator reviewing a feature's progress, I want clicking a completed stage's breadcrumb link to show me that stage's artefact, so that I can navigate back through a journey's history without being unexpectedly bounced to the sign-in page.

## Acceptance Criteria

- **AC1:** Given an authenticated tenant-owner request for a journey stage that IS in `completedStages`, when `GET /journey/:journeyId/stage/:stageName` is requested, then the response is 200 with the artefact view rendered (not the sign-in page).
- **AC2:** Given the same route requested with no `accessToken` in session, when the request is made, then the response 302-redirects to `/auth/github`.
- **AC3:** Given a completed stage, when `POST /api/journey/:journeyId/stage/:stageName/artefact` is requested with edited content, then the response reaches the real save handler (redirects back to the stage-view page), not the sign-in page.
- **AC4:** A regression test dispatches these exact pathnames through the real, exported router (not a direct handler-function call), so a future accidental removal of the route registration fails CI.

## Out of scope

- `handleGetJourneyStage` (JSON API variant) and `handlePostJourneyRecommit` — also unwired in server.js, but zero client-side callers found anywhere in the codebase. Not part of the reported defect; flagged as a candidate for a separate dead-code review, not fixed here.
- Re-deriving `handleGetJourneyStageView`'s internal cross-tenant/404 logic — already covered by `check-p0.2-journey-guard-wiring.js`; unaffected by this fix.
- Confirming the operator's exact recalled error text ("Session not complete yet") reproduces from this specific trigger — it did not, in local repro. This fix closes a real, confirmed, and more serious defect (silent sign-in-page fallback) regardless.

## Architecture constraints

No new route pattern, handler, or module is introduced. This fix adds two `else if` branches to the existing dispatch chain in `server.js`, following the exact pattern (regex match on pathname + method, `req.params` assignment, delegate to the existing exported handler) already used by every other `/journey/:id/...` route in that file. No Active ADR in `.github/architecture-guardrails.md` is implicated.

## Complexity

1 — well understood, clear path (the handlers already exist and are already tested; this is pure route registration).

## Scope stability

Stable.
