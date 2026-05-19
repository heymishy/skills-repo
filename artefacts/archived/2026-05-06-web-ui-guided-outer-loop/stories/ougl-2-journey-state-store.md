## Story: Journey state store module, `registerHtmlSession` extension, and server.js wiring

**Epic reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/epics/ougl-epic-1-journey-foundation.md
**Discovery reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/discovery.md
**Benefit-metric reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/benefit-metric.md

## User Story

As a **platform maintainer**,
I want an in-memory journey state store that tracks which stages have been completed and which session is currently active for a given journey, and I want `registerHtmlSession` to carry a `journeyId` field on the session entry,
So that route handlers can look up journey context from any session ID and advance the journey without maintaining state in the HTTP request.

## Benefit Linkage

**Metric moved:** M1 (Journey completion rate ≥ 80%) — indirectly as a technical enabler.
**How:** Without persistent journey state, the gate-confirm handler cannot determine which artefacts to inject as prior context for the next stage, nor where to redirect after each stage. This store is the single source of truth for the journey; every route handler in ougl.3–ougl.7 reads from it.

## Architecture Constraints

- New module at `src/web-ui/modules/journey-store.js` — CommonJS (`module.exports`), zero external dependencies, no I/O.
- ADR-011 (Artefact-first): this module's creation requires the story artefact (this file) to be committed before the implementation is merged. The DoR check enforces this.
- Injectable adapter rule (D37) does NOT apply to this module — it is an internal state store with no external dependencies (no model calls, no GitHub API calls). Test isolation is achieved via the exported `_clear()` helper function.
- `registerHtmlSession` modification is additive: the 4th parameter `priorArtefacts` (from ougl.1) is already in scope; this story adds an optional 5th parameter `journeyId`. When `journeyId` is not passed, the session entry stores `journeyId: null`. All existing calls to `registerHtmlSession` remain valid.
- `linkSessionToJourney(sessionId, journeyId)` is a separate exported function that sets `journeyId` on an existing session entry — used by route handlers that create a session first, then link it to a journey.

## Dependencies

- **Upstream:** ougl.1 must be complete (`buildSystemPrompt` must accept `priorArtefacts`) before this story can be fully integration-tested. Unit tests for the journey store module itself have no upstream dependency.
- **Downstream:** ougl.3, ougl.4, ougl.5 all consume journey store functions directly.

## Acceptance Criteria

**AC1:** Given `createJourney('my-feature')` is called, when the return value is inspected, then it has: a non-empty string `journeyId`, `featureSlug: 'my-feature'`, `activeSkill: null`, `activeSessionId: null`, `completedStages: []`, and `mode: 'feature'`.

**AC2:** Given a journey is created with `createJourney('my-feature')`, when `getJourney(journeyId)` is called with the returned `journeyId`, then it returns the same object (same reference in memory).

**AC3:** Given a journey exists, when `setActiveSession(journeyId, 'sess-abc', 'discovery')` is called, then `getJourney(journeyId).activeSessionId === 'sess-abc'` and `getJourney(journeyId).activeSkill === 'discovery'`.

**AC4:** Given `setActiveSession(journeyId, 'sess-abc', 'discovery')` has been called, when `getJourneyBySession('sess-abc')` is called, then it returns the same journey object (same journeyId).

**AC5:** Given a journey has `activeSessionId: 'sess-abc'`, when `completeStage(journeyId, 'discovery', 'artefacts/2026-05-06-x/discovery.md')` is called, then `getJourney(journeyId).completedStages` has length 1 and `completedStages[0]` equals `{skillName: 'discovery', artefactPath: 'artefacts/2026-05-06-x/discovery.md'}`.

**AC6:** Given `getNextStage('discovery')` is called, then it returns `'benefit-metric'`. `getNextStage('benefit-metric')` returns `'definition'`. `getNextStage('definition')` returns `'test-plan'`. `getNextStage('definition-of-ready')` returns `null`.

**AC7:** Given `registerHtmlSession('sid', '/path', 'discovery')` is called without `journeyId` argument, when `_getHtmlSession('sid')` is inspected, then `session.journeyId === null` and `session.done === false` (new `journeyId` field defaults to null without breaking existing session model).

**AC8:** Given `linkSessionToJourney('sid', 'journey-xyz')` is called on an existing session, when `_getHtmlSession('sid')` is inspected, then `session.journeyId === 'journey-xyz'`.

**AC9:** Given `_clear()` is called on the journey store (test helper), when `getJourney(anyId)` is called, then it returns `null` (store is empty — test isolation confirmed).

**AC10:** Given the full `npm test` suite runs with this story's changes applied, when all tests complete, then zero pre-existing tests fail (no regressions introduced by the `registerHtmlSession` signature change or the new `journeyId` field on session entries).

## Out of Scope

- Persisting journey state across server restarts — in-memory only for MVP.
- Journey TTL / expiry — journeys live as long as the server process runs.
- `setStoryList` and `getCurrentStory` functions for per-story iteration — those are introduced in ougl.6 when they are first consumed.
- Any changes to the existing HTML chat page rendering — that is ougl.4.

## NFRs

- **Performance:** All journey store functions are synchronous O(1) Map lookups. No performance concern.
- **Security:** `journeyId` values are server-generated UUIDs (use `crypto.randomUUID()` from Node built-ins — no `uuid` package). They are never derived from user input.
- **Test isolation:** The `_clear()` function must be called in `afterEach` blocks of any test file that uses the journey store, to prevent state leakage between tests.
