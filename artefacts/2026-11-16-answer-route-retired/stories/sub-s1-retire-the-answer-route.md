## Story: Retire the dead /answer form route so it answers 410 Gone instead of a server error

**Epic reference:** None - short-track (bounded defect found by a staging write test and confirmed on production, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: staging write-test session 2026-11-16 (20 of 20 POSTs to `/api/skills/<skill>/sessions/<id>/answer` answered 500) and one production request that answered 500 "Adapter not wired: submitAnswer" and opened GitHub issue #1121 (title `http_5xx: Error at /api/:p/:p/:p/:p/:p`) with incident PR #1122. `server.js` never calls `setSubmitAnswer`, so the legacy question-flow adapter always throws.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [web-ui]

## User Story

As **the operator**,
I want **the dead no-JavaScript answer route to say it is retired instead of failing with a server error**,
So that **no request to it opens a production issue, and nobody can mistake a paid-model bypass for a feature**.

## Benefit Linkage

**Metric moved:** None formal. Removes a route that always produces a production 5xx (and a GitHub issue plus incident PR each time it is hit), and closes off the option of someone wiring it up later without the guards `/turn` has.
**How:** the route table answers `POST /api/skills/:name/sessions/:id/answer` with a 410 page ("answers are sent from the chat page, which needs JavaScript") after the existing authentication guard. The legacy handler, adapter and question page are left in place, unreachable from this route, with their tests.

## Architecture Constraints

- **Why retire rather than wire (decision recorded):** `/answer` has none of `/turn`'s safeguards (credits check and deduction, journey-owner check, concurrent-turn lock, the tvl-s1 body validation). Wiring the legacy flow to the model would have created a paid-model path that bypasses all of them. The only caller is the chat page's no-JavaScript form fallback, which has never worked in production (every post 500'd); the real page submits through `/turn` and `/turn-stream`. Operator chose retire on 2026-11-16.
- **Change at the route table, not the handler.** `server.js` stops calling `handlePostAnswerHtml` for this route and calls a new small handler `handleAnswerRetiredHtml` in `routes/skills.js`. `handlePostAnswerHtml`, `setSubmitAnswer`, the question page and their wuce.24 tests are not touched, so no existing test changes.
- **Answer:** after `authGuard` (unauthenticated requests keep their existing answer), 410 with `text/html`, a short page via `renderShell` naming the chat page link built from the URL's skill and session ids, each HTML-escaped; no form, no model call, no session lookup, no credit change, no error report (410 is not a 5xx).
- **Not reachable by accident:** `requireNonViewer` is not needed for a route that does nothing; the guard order stays authGuard first.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; ADR-012 and ADR-025 not engaged (no data access); no other Active ADR engaged. Zero new npm dependencies.

## Dependencies

- **Upstream:** ecg-s1 (the 5xx that reported it), mfc.1 (the chat architecture that replaced the question flow). Both merged.
- **Related:** `pws-s1` (its wiring smoke test lists this route as a known defect until this lands), `tvl-s1` (the guards `/turn` has).

## Acceptance Criteria

**AC1:** Given a signed-in request `POST /api/skills/:name/sessions/:id/answer` through the real route table, When it is made with a form body, Then the response is 410 with an HTML page that says answers are sent from the chat page (which needs JavaScript) and links to `/skills/<name>/sessions/<id>/chat`.

**AC2:** Given the same request, When it is handled, Then no model call is made, no credit changes, no session is looked up, no error report is sent, and the body contains neither "Adapter not wired" nor any stack trace.

**AC3:** Given a skill name or session id containing HTML (for example `"><img src=x onerror=1>`), When the route answers, Then the markup in the response is escaped (no raw `<img`).

**AC4:** Given an unauthenticated request, When it is made, Then it gets the same answer as before this story (not 410, not 5xx).

**AC5:** Given the legacy handler, When `handlePostAnswerHtml` is called directly with a stubbed `setSubmitAnswer` (as the wuce.24 tests do), Then it behaves exactly as before, and every existing wuce.24 test passes unchanged.

**AC6 (live, after deploy):** Given a signed-in production session, When one `POST` is sent to `/api/skills/discovery/sessions/00000000-0000-0000-0000-000000000000/answer`, Then it answers 410 and no new GitHub issue appears. Evidence class `production-observed`; operator-approved single request.

## Out of Scope

- Wiring `submitAnswer`, deleting the legacy question flow, its adapter or its tests (a later cleanup story if wanted).
- Changing the chat page's form markup (it still has the dead fallback form action; a 410 is its correct answer).
- Closing issue #1121 and incident PR #1122 (the operator does that after the live check).

## NFRs

- **Security:** no model call or data access; ids are escaped; no information about sessions is revealed (the route does not look them up).
- **Reliability:** the handler never throws.
- **Performance:** constant time.

## Complexity Rating

**Rating:** 1 - one route replaced, one small handler. **Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified
- [ ] Human oversight level confirmed from parent epic - N/A, short-track, no parent epic
