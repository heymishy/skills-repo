## Story: Journey entry screen and start endpoint

**Epic reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/epics/ougl-epic-2-discovery-to-definition.md
**Discovery reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/discovery.md
**Benefit-metric reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/benefit-metric.md

## User Story

As a **non-engineer operator**,
I want to visit `/journey` in the web UI and click a "Start new journey" button to begin the guided outer loop,
So that I can start a discovery session without knowing which skill to run or how to wire sessions together manually.

## Benefit Linkage

**Metric moved:** M2 (Non-engineer autonomous completion ≥ 1 within 4 weeks of MVP)
**How:** This story is the entry point. A non-engineer who does not know the pipeline can visit `/journey` and start — there is no prerequisite knowledge needed. Without this story, the feature has no way to begin.

## Architecture Constraints

- New routes in `src/web-ui/server.js`: `GET /journey` and `POST /api/journey`. These must follow the same pattern as existing HTML routes (auth guard, `renderShell`, `escHtml`, `req.session.accessToken`).
- Route handlers belong in a new file `src/web-ui/routes/journey.js` — not inlined in `server.js`. `server.js` wires the routes only.
- ADR-011 (Artefact-first): `src/web-ui/routes/journey.js` is a new `src/` module. This story artefact satisfies that requirement.
- `req.session.accessToken` is the canonical token field — no other field name.
- `renderShell` and `escHtml` from `'../utils/html-shell'` must be used for HTML rendering (consistent with existing routes; no new templating dependency).
- Copilot licence check: not required for HTML form routes (consistent with existing HTML routes `handleGetSkillsHtml` and `handlePostSkillSessionHtml` which do not check licence before creating a session).
- Zero new npm dependencies.

## Dependencies

- **Upstream:** ougl.2 must be complete (journey store `createJourney`, `setActiveSession`, and `registerHtmlSession` with `journeyId` field) before this story's route handler can be fully implemented.
- **Downstream:** ougl.4 (journey-aware chat button), ougl.5 (gate-confirm handler) both depend on journeys created by this story.

## Acceptance Criteria

**AC1:** Given an authenticated operator (valid `req.session.accessToken`) sends `GET /journey`, when the response is returned, then it is HTTP 200 with `Content-Type: text/html` and the body contains a `<form method="POST" action="/api/journey">` element.

**AC2:** Given an unauthenticated request (no `req.session.accessToken`) sends `GET /journey`, when the response is returned, then it is HTTP 302 with `Location: /auth/github`.

**AC3:** Given an authenticated operator POSTs to `/api/journey`, when the handler runs, then: (a) a new journey is created in the journey store via `createJourney`, (b) a new discovery session is created in `_sessionStore` with `skillName === 'discovery'` and `done === false`, (c) `setActiveSession` is called linking the journey to the new session, and (d) `linkSessionToJourney` is called so `_getHtmlSession(sessionId).journeyId` equals the new journey's `journeyId`.

**AC4:** Given a successful `POST /api/journey`, when the response is returned, then it is HTTP 303 with `Location` header matching the pattern `/skills/discovery/sessions/[sessionId]/chat` where `[sessionId]` is the ID of the newly created session.

**AC5:** Given an unauthenticated request POSTs to `/api/journey`, when the response is returned, then it is HTTP 302 with `Location: /auth/github`.

**AC6:** Given the journey entry screen renders (AC1), when the HTML is examined, then it contains a heading or title that includes the word "journey" (case-insensitive), and the form does not expose `sessionId`, `journeyId`, or any internal server state in any hidden `<input>` element.

**AC7:** Given `POST /api/journey` is called and `sessionManager.createSession` throws an error, when the response is returned, then it is HTTP 500 with a rendered HTML error page (using `renderShell`) containing a human-readable error message — not a raw stack trace.

## Out of Scope

- Listing in-progress journeys on the entry screen — `GET /journey` shows only the "start new journey" form for MVP.
- Resuming an existing journey — in-memory only; no resume mechanism for MVP.
- Feature slug entry on the form — the featureSlug is derived later from the model's `---SLUG---` output when the discovery artefact is generated. The journey is created with an empty featureSlug initially.
- Copilot licence check before starting a journey — the licence check happens inside the discovery session's first model call, consistent with existing HTML session routes.

## NFRs

- **Security:** The journey entry form must not expose internal IDs. The POST response redirects to a server-derived URL — the client does not supply the sessionId. All redirected URLs are constructed from server-side values only.
- **Performance:** `GET /journey` is a static HTML render with no external calls. Response time must be under 100ms.
