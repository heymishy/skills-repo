## Test Plan: Retire the dead /answer form route so it answers 410 Gone instead of a server error

**Story reference:** artefacts/2026-11-16-answer-route-retired/stories/sub-s1-retire-the-answer-route.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-sub-s1-answer-route-retired.js`. It uses the real `createApp()` route table with a seeded signed-in test session (`seedTestSession`, cookie `session_id`), the same way `tests/check-anf-s1-artefact-not-found.js` T4 does, plus a recording capture client for error reports. The existing wuce.24 tests (`check-wuce24-*`, found by searching `tests/` for `handlePostAnswerHtml`) are left unchanged and must pass.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Signed-in POST: 410 page with chat link | - | 1 (T1) | - | - | - | 🟢 |
| AC2 | No model call, credits, session lookup, report or error text | - | 1 (T2) | - | - | - | 🟢 |
| AC3 | Ids are HTML-escaped | - | 1 (T3) | - | - | - | 🟢 |
| AC4 | Unauthenticated answer unchanged | - | 1 (T4) | - | - | - | 🟢 |
| AC5 | Legacy handler unchanged; wuce.24 tests pass | 1 (T5) | the full suite | - | - | - | 🟢 |
| AC6 | Live: 410, no new issue | - | - | - | 1 | Live-only | 🟡 |
| NFR | The handler never throws | 1 (T6) | - | - | - | - | 🟢 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Needs the deployed app | AC6 | Live-only | Verification scenario 7; one operator-approved request |

## Tests (new file `tests/check-sub-s1-answer-route-retired.js`)

- **T1 (AC1).** Real app, signed in: POST `/api/skills/discovery/sessions/abc/answer` with `application/x-www-form-urlencoded` body `answer=hi`: status 410, `text/html`, body contains `JavaScript` and the href `/skills/discovery/sessions/abc/chat`. Fails today (500).
- **T2 (AC2).** Same request: zero reports captured, body does not contain `Adapter not wired` or `at ` stack lines; and `skillsAdapter.submitAnswer` is not called (a counting stub installed with `setSubmitAnswer` records zero calls). Fails today (the adapter is called).
- **T3 (AC3).** Skill and session segments `%22%3E%3Cimg%20src%3Dx%20onerror%3D1%3E`: the body contains no raw `<img` and contains the escaped form. Fails today (500, passes vacuously) so it is asserted together with the 410 status.
- **T4 (AC4).** The same POST with no cookie: status is the same as an unauthenticated POST to another guarded route in the same app (not 410, not 5xx).
- **T5 (AC5).** `handlePostAnswerHtml` called directly with `setSubmitAnswer` stubbed to resolve `{ nextUrl: '/x' }`: answers 303 to `/x`; with the stub rejecting `{status: 404}`: answers an error page with 404. (The wuce.24 files cover the rest.)
- **T6 (NFR).** `handleAnswerRetiredHtml` with an empty request, a request lacking params, and a response that throws on `end`: never throws.

## Test Gaps and Risks
| Gap | Reason | Mitigation |
|-----|--------|------------|
| The route table change is in `server.js` | A wrong route order could shadow another route | T1 and T4 drive the real table; the full suite's route tests cover the neighbours |

**Total automated tests:** 6 (T1 to T6) plus AC6 live.
