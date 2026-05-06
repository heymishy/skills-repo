## Story: Definition-of-ready per-story stage and journey completion screen

**Epic reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/epics/ougl-epic-3-testplan-to-dor.md
**Discovery reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/discovery.md
**Benefit-metric reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/benefit-metric.md

## User Story

As a **non-engineer operator**,
I want the journey to automatically route me from /review to /definition-of-ready for each story, and when all stories are DoR-complete, show me a summary screen with links to every artefact produced,
So that I know the outer loop is complete and where to find the artefacts for the next manual step (committing to GitHub or handing to the coding agent).

## Benefit Linkage

**Metric moved:** M1 (Journey completion rate ≥ 80%) — this story delivers the `journey_completed` event that makes M1 measurable.
**How:** M1 is defined as `discovery_saved / journey_started`. Without a completion screen, there is no completion event. This story closes the loop: the operator experiences a definitive end state that indicates the full outer loop is done.

## Architecture Constraints

- Gate-confirm handler extension: add story-mode handling for `review → definition-of-ready` in `src/web-ui/routes/journey.js`. The gate-confirm already has a story-mode branch (ougl.6 adds `test-plan → review`). This story adds `review → definition-of-ready`. After the `definition-of-ready` gate-confirm: if `advanceToNextStory()` returns `true` (more stories pending), create the next story's `/test-plan` session. If it returns `false` (all stories done), redirect to `GET /journey/:journeyId/complete`.
- New route in `src/web-ui/routes/journey.js`: `GET /journey/:journeyId/complete`. Renders the completion screen using `renderShell`. Lists all `journey.completedStages` with artefact paths. Auth guard: unauthenticated → 302 /auth/github.
- The completion screen is read-only. It does not trigger any writes.
- `req.session.accessToken` canonical token field.
- Zero new npm dependencies.

## Dependencies

- **Upstream:** ougl.6 must be complete (story-mode gate-confirm, `advanceToNextStory` in journey store, test-plan/review session creation). ougl.2 must expose `advanceToNextStory`.
- **Downstream:** None — this is the final story in the feature.

## Acceptance Criteria

**AC1:** Given a journey is in story mode and the review session for the current story has `done: true`, when `POST /api/journey/:journeyId/gate-confirm` is called, then the handler writes the review artefact to disk and creates a `/definition-of-ready` session for the same story with `priorArtefacts` containing the test-plan artefact, the review artefact, and the story context entry.

**AC2:** Given the gate-confirm creates the definition-of-ready session, when the response is returned, then it is HTTP 303 with `Location: /skills/definition-of-ready/sessions/[dorSessionId]/chat`.

**AC3:** Given the definition-of-ready gate-confirm fires for the current story, when `advanceToNextStory(journeyId)` returns `true` (more stories pending), then the handler creates a new `/test-plan` session for the next story and responds HTTP 303 with `Location: /skills/test-plan/sessions/[newSessionId]/chat`.

**AC4:** Given the definition-of-ready gate-confirm fires for the last story, when `advanceToNextStory(journeyId)` returns `false`, then the handler responds HTTP 303 with `Location: /journey/:journeyId/complete`.

**AC5:** Given an authenticated operator visits `GET /journey/:journeyId/complete`, when the response is returned, then it is HTTP 200 with HTML containing all `completedStages` artefact paths listed as text or links — at minimum each `skillName` and `artefactPath` pair appears in the page body.

**AC6:** Given an unauthenticated request visits `GET /journey/:journeyId/complete`, when the response is returned, then it is HTTP 302 with `Location: /auth/github`.

**AC7:** Given the completion screen renders for a journey with 3 completed feature-level stages and 2 stories × 3 stages each, when the HTML is examined, then it lists at least 9 artefact entries (3 feature + 2×3 story artefacts).

**AC8:** Given `GET /journey/:journeyId/complete` is called with an unknown `journeyId`, when the response is returned, then it is HTTP 404.

**AC9:** Given the full `npm test` suite runs with all ougl.1–ougl.7 changes applied, when all tests complete, then zero pre-existing tests fail.

## Out of Scope

- Automatic GitHub commit or PR creation from the completion screen — the operator takes the artefact paths shown and commits manually (or uses the existing `/skills/:name/sessions/:id/commit` flow). Automated push is a post-MVP story.
- Completion screen email or notification — not in MVP scope.
- Journey replay or re-run from completion screen — the completion screen is a summary view only.
- Visual styling enhancements beyond the standard `renderShell` shell — style improvements are a separate story.

## NFRs

- **Security:** Artefact paths displayed on the completion screen are HTML-escaped with `escHtml` before rendering. They originate from `journey.completedStages` which stores server-derived paths — but escaping is applied anyway as defence in depth.
- **Observability:** Log a structured event at info level when the completion screen is rendered: `{event: 'journey_completed', journeyId, stageCount: completedStages.length}`. This log line is the instrumentation for the M1 metric signal.
