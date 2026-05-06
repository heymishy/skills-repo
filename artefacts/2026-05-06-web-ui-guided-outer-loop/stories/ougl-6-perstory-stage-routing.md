## Story: Per-story stage routing — story list entry and test-plan/review session management

**Epic reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/epics/ougl-epic-3-testplan-to-dor.md
**Discovery reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/discovery.md
**Benefit-metric reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/benefit-metric.md

## User Story

As a **non-engineer operator**,
I want to enter my story slugs after the definition stage completes and then be guided through /test-plan and /review for each story in sequence,
So that I can produce test plans and review artefacts for every story without manually navigating between skill sessions or constructing handoff context myself.

## Benefit Linkage

**Metric moved:** MM1 (Artefact quality parity — web UI trace pass rate ≥ VS Code baseline)
**How:** Test-plan and review artefacts produced in the web UI will have the definition artefact and the current story slug injected as prior context. Without this handoff, the test-plan model starts cold and produces generic, context-free test plans that would fail a quality parity audit.

## Architecture Constraints

- Two new routes in `src/web-ui/routes/journey.js`: `GET /journey/:journeyId/stories` and `POST /api/journey/:journeyId/stories`. Wired in `server.js`.
- Journey store additions (extend `src/web-ui/modules/journey-store.js`): `setStoryList(journeyId, storyList)` sets `journey.storyList = [...slugs]`, `journey.currentStoryIndex = 0`, `journey.mode = 'story'`. `getCurrentStory(journeyId)` returns `journey.storyList[journey.currentStoryIndex]`. `advanceToNextStory(journeyId)` increments `currentStoryIndex` and returns `true` if more stories remain, `false` if all stories are done.
- The gate-confirm handler (`POST /api/journey/:journeyId/gate-confirm`) gains a story-mode branch: when `journey.mode === 'story'`, the per-story sequence is `test-plan → review` (within a story). After `review` gate-confirm, ougl.7 handles the `definition-of-ready` advance. This story adds only the `test-plan → review` transition.
- Story context in system prompt: the `priorArtefacts` array for `/test-plan` sessions must include: (1) the definition artefact (path + disk content), and (2) a synthetic context entry with `path: 'context://current-story'` and `content: 'Current story for this test-plan session: [storySlug]\n\nFocus the test plan on this story only.'`. The `buildSystemPrompt` function injects both verbatim — no special-casing needed in `buildSystemPrompt` itself.
- Story slugs entered in the form must be validated: only alphanumeric characters, hyphens, and dots are allowed (regex: `/^[a-z0-9]([a-z0-9.\-]*[a-z0-9])?$/i`). Slugs failing validation are rejected with a 400 response.
- `req.session.accessToken` is the canonical token field.
- Zero new npm dependencies.

## Dependencies

- **Upstream:** ougl.5 must be complete (gate-confirm redirects to `/journey/:journeyId/stories` after `definition` stage). ougl.1 and ougl.2 must be complete (`buildSystemPrompt` with priorArtefacts, journey store base functions).
- **Downstream:** ougl.7 (adds the `review → definition-of-ready` advance in story mode and the `definition-of-ready` final handling).

## Acceptance Criteria

**AC1:** Given the gate-confirm handler has redirected to `GET /journey/:journeyId/stories` and the operator is authenticated, when the page renders, then it returns HTTP 200 with a `<form method="POST" action="/api/journey/:journeyId/stories">` containing a `<textarea>` or `<input>` for entering story slugs.

**AC2:** Given an unauthenticated request sends `GET /journey/:journeyId/stories`, when the response is returned, then it is HTTP 302 with `Location: /auth/github`.

**AC3:** Given an authenticated operator POSTs to `/api/journey/:journeyId/stories` with body containing story slugs `wgol.1\nwgol.2\nwgol.3` (newline-separated), when the handler runs, then `getJourney(journeyId).storyList` equals `['wgol.1', 'wgol.2', 'wgol.3']` and `getJourney(journeyId).mode === 'story'`.

**AC4:** Given the stories POST succeeds, when the response is returned, then it is HTTP 303 with `Location: /skills/test-plan/sessions/[newSessionId]/chat`, where the new session was created for the first story (`'wgol.1'`).

**AC5:** Given the first test-plan session is created, when `_getHtmlSession(newSessionId).systemPrompt` is inspected, then it contains `--- HANDOFF CONTEXT ---` and also contains the string `wgol.1` (the current story slug appears in the handoff context section).

**AC6:** Given the test-plan session for `wgol.1` has `done: true` and the operator triggers gate-confirm (`POST /api/journey/:journeyId/gate-confirm`), when the gate-confirm handler runs in story mode, then it writes the test-plan artefact to disk and creates a `/review` session for `wgol.1` with the test-plan artefact and story context injected as `priorArtefacts`.

**AC7:** Given the gate-confirm creates the review session for `wgol.1`, when the response is returned, then it is HTTP 303 with `Location: /skills/review/sessions/[reviewSessionId]/chat`.

**AC8:** Given a story slug containing path-traversal characters (e.g. `../etc`) is submitted via the story list form, when the handler validates the slugs, then it returns HTTP 400 and does not create any sessions.

**AC9:** Given the story list form is submitted with an empty body (no slugs entered), when the handler runs, then it returns HTTP 400 with an error message — no journey state is modified.

## Out of Scope

- Automatic parsing of story slugs from the `/definition` artefact on disk — the operator enters slugs manually via the form. Auto-parsing is a post-MVP enhancement.
- Parallel story processing — stories are processed one at a time in the order entered.
- The `review → definition-of-ready` transition — that is ougl.7.
- The "skip story" or "remove story from list" UI — linear sequential processing only for MVP.

## NFRs

- **Security:** Story slugs from the form body are validated against the allowlist regex before use. They are used to construct file paths (in the `context://current-story` content string only — they are not used as file system paths directly in this story). Even so, they must pass validation before being stored.
- **Performance:** Session creation in story mode is synchronous with one `registerHtmlSession` call per story start. No additional latency concern.
