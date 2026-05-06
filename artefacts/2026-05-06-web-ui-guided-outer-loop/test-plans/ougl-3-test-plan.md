# Test Plan — ougl.3: Journey entry screen and start endpoint

**Story:** ougl.3 — Journey entry screen and start endpoint
**Feature:** 2026-05-06-web-ui-guided-outer-loop
**Test file:** `tests/check-ougl3-journey-entry-and-start.js`
**Date:** 2026-05-06
**Total ACs:** 7

---

## Test Data Strategy

**Type:** Synthetic — mock `req`/`res` objects. Injectable adapters for `createJourney`, `registerHtmlSession`, `linkSessionToJourney`, and `setActiveSession` so no real store state is needed in each test. `_clear()` called in teardown.

**External dependencies:** None. All route logic tested via mock req/res without HTTP server. `renderShell` is imported by `journey.js` directly — no need to mock it.

**Security note:** AC6 includes checking that the form has no hidden internal state inputs. AC7 (error path) must use `renderShell` — not raw stack trace output.

---

## AC Coverage Table

| AC  | Description | Test IDs | Gap type | Risk |
|-----|-------------|----------|----------|------|
| AC1 | Auth `GET /journey` → 200 with `<form method="POST" action="/api/journey">` | T3.1 | None | Medium |
| AC2 | Unauth `GET /journey` → 302 `/auth/github` | T3.2 | None | Low |
| AC3 | Auth `POST /api/journey` → session created, `setActiveSession` + `linkSessionToJourney` called | T3.3 | None | High |
| AC4 | Successful POST → 303 `Location: /skills/discovery/sessions/[sid]/chat` | T3.4 | None | High |
| AC5 | Unauth POST → 302 `/auth/github` | T3.5 | None | Low |
| AC6 | HTML contains "journey" in heading/title; form has no hidden internal state inputs | T3.6 | None | Low |
| AC7 | POST and session-creation throws → 500 with `renderShell` HTML error page | T3.7 | None | Medium |

**Coverage gaps:** None. All ACs testable via unit handler tests with mock req/res.

---

## Unit Tests

### T3.1 (AC1) — Auth GET /journey → 200 with form
**Module:** `journey.js` (new)
**Setup:** Mock `req = { session: { accessToken: 'tok', login: 'user1' } }`, capture `res.writeHead(status, headers)` and `res.end(html)`.
**Call:** `journey.handleGetJourneyEntry(req, res)`
**Expected:** status `200`, body includes `<form method="POST" action="/api/journey">`.

### T3.2 (AC2) — Unauth GET → 302
**Setup:** `req = { session: {} }` (no accessToken).
**Call:** `handleGetJourneyEntry(req, res)`
**Expected:** status `302`, `Location` header equals `/auth/github`.

### T3.3 (AC3) — Auth POST creates journey and session
**Setup:** Inject mock `createJourney` that returns `{ journeyId: 'jrn-1' }`, mock `registerHtmlSession` that records arguments, mock `setActiveSession`, mock `linkSessionToJourney`. `req = { session: { accessToken: 'tok', login: 'u' }, body: {} }` (or empty form body).
**Call:** `handlePostJourneyStart(req, res)`
**Expected:** `createJourney` was called, `registerHtmlSession` was called with `skillName === 'discovery'`, `setActiveSession` was called with journeyId, `linkSessionToJourney` was called with the new session ID and journeyId. The registered session has `done === false`.

### T3.4 (AC4) — POST → 303 redirect to discovery chat
**Setup:** Same mocks as T3.3. Mock `registerHtmlSession` returns or captures sessionId `'sid-001'`.
**Call:** `handlePostJourneyStart(req, res)`
**Expected:** status `303`, `Location` header matches pattern `/skills/discovery/sessions/[sessionId]/chat`.

### T3.5 (AC5) — Unauth POST → 302
**Setup:** `req = { session: {} }`.
**Call:** `handlePostJourneyStart(req, res)`
**Expected:** status `302`, `Location === '/auth/github'`.

### T3.6 (AC6) — HTML heading contains "journey"; no hidden state inputs
**Setup:** Auth GET as in T3.1.
**Expected:** body includes "journey" (case-insensitive in heading or title), and body does NOT include `<input type="hidden"` (no hidden state injected into form).

### T3.7 (AC7) — POST throws → 500 with renderShell HTML error page
**Setup:** Inject `registerHtmlSession` mock that throws `new Error('Test session creation failure')`. Auth POST.
**Expected:** status `500`, body is HTML (contains `<!DOCTYPE html>` or `<html` from renderShell), body does NOT contain a raw stack trace (no `Error:` followed by `at ` lines), body contains a human-readable error message.

---

## Integration Tests

**T3.INT.1 — Route wiring in server.js:** Verify that `server.js` registers `GET /journey` and `POST /api/journey` routes. Assert `server.js` source contains references to the journey route module. (Grep-based test.)

---

## NFR Tests

**NFR-1 (GET < 100ms):** Not directly testable via unit test. Covered implicitly — handler is synchronous (no I/O). Integration test via server response time measurement in E2E (Playwright, out of scope for this file).

**NFR-2 (Form must not expose sessionId/journeyId):** T3.6 asserts no hidden inputs — covers this.

---

## Pre-implementation Expectation

All T3.1–T3.7 will FAIL before implementation (`journey.js` does not exist — `Cannot find module`). This is the correct TDD baseline.
