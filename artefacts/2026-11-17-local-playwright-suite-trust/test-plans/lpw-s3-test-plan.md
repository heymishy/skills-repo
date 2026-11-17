## Test Plan: The board's Advance button and drag-to-advance work, and a failed advance is never reported as success

**Story reference:** artefacts/2026-11-17-local-playwright-suite-trust/stories/lpw-s3-board-advance-works.md
**Epic reference:** None - short-track
**Source issue:** #1140
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-17
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. Browser specs run with `npm run test:e2e` (Playwright). New files: `tests/check-lpw-s3-board-advance-token.js`, `tests/check-lpw-s3-advance-status.js`, `tests/check-lpw-s3-test-commit-adapter.js`, `tests/check-lpw-s3-matrix-reason.js`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Board script sends the CSRF token (button and drag) | 1 (T1) | - | `s1.1` AC1, `s3.1` AC1 | - | - | 🟢 |
| AC2 | Honest status mapping | 1 (T2, four cases) | - | - | - | - | 🟢 |
| AC3 | Message shown; PostHog capture without secrets | 1 (T3) | - | - | - | - | 🟢 |
| AC4 | Test-mode commit adapter; card ends in next column | 1 (T4) | - | `s1.1` AC1 | - | Wiring (D37 point 4) | 🟡 |
| AC5 | Board specs pass and join the core, or stay quarantined with the real reason | - | - | `s1.1`, `s3.1`, `s3.2`, `psh-s6` in the whole suite and twice in the core job | - | Live | 🟡 |
| AC6 | `ep3-s1` reason corrected to #1042 | 1 (T5) | - | - | - | - | 🟢 |
| AC7 | Advance works on staging | - | - | - | 1 | Live-only | 🟡 |
| AC8 | Readiness survives a restart (issue #1141) | 1 (T6) | - | - | 1 (staging after deploy: no card is "not ready" only because of the deploy) | - | 🟡 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Whether the specs that pass alone also pass in the whole suite | AC5 | Live | Two core-job runs on one commit; any spec that differs stays quarantined with the cause named |
| Staging behaviour needs a real deployed card and changes a journey | AC7 | Live-only | Recorded in the Definition of Done after merge and deploy, with the operator's go-ahead |
| The wiring test must show the card moved, not that a function was assigned | AC4 | Wiring (D37) | T4 drives the real handler and journey store and asserts the stage; the e2e spec asserts the column |

## Tests

- **T1 (AC1).** Rendering the board (`kanban-view.js` `renderKanban`, given the page's token) produces a script whose advance request carries `_csrf` with that token, for the button path and for the drag path; with no token supplied the script contains no hard-coded value. The product, org and tenant board handlers pass `req.session.csrfToken` to the renderer.
- **T2 (AC2).** `handlePostBoardAdvance` with a fake gate-confirm: 403 answers 403 with an error body and no `advanced`; a 302 to `/auth/github` answers 401; a 303 answers 200 `{advanced: true, stage: <new>}`; an unexpected status (409) answers 502 `advance-failed`; the existing 400, 404, 422 and 5xx cases are unchanged.
- **T3 (AC3).** A failed advance calls the PostHog capture with event `board_advance_failed`, the status and a journey id prefix; the captured properties contain no token and no session id; the board script shows `body.error` or `body.reason` in the existing error element.
- **T4 (AC4).** The test-mode commit adapter returns success under `NODE_ENV=test` and throws outside it (D37 point 1); with it wired, advancing a seeded ready journey with a valid token moves its stage from `discovery` to `benefit-metric`, read back from the journey store and the board HTML.
- **T5 (AC6).** In `tests/e2e/capability-matrix.json` the `ep3-s1-regression` entry's reason names issue #1042 and no longer says "model"; the matrix guard (`check-lpw-s2-capability-matrix`) still passes.
- **T6 (AC8).** With a completed session persisted (the fake test database / session store) and the in-memory `_sessionStore` empty, the board's card for that journey is ready and has an Advance control, and `handlePostBoardAdvance` does not answer 400 `not-ready`; the read is one batched call for the whole board (a spy counts calls, as the s1.1 test already does for `_getHtmlSessionsBulk`).
- **E2E (CI).** `s1.1` AC1 and AC2, `s3.1` AC1 to AC3, `s3.2` AC1 to AC3 and the rewritten `psh-s6` pass in the whole suite and, if promoted, in the core job twice.

## Out of scope for this plan

Regress-back (#1042), feature creation, pods, model sessions, the ruleset.
