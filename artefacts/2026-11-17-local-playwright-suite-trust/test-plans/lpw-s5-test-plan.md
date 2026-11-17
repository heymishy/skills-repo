## Test Plan: The model-session browser specs run against the test server without the chat page looping, and join the browser suite

**Story reference:** artefacts/2026-11-17-local-playwright-suite-trust/stories/lpw-s5-model-session-specs-and-stub-turn-loop.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-18
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-lpw-s5-stub-turn-ends-on-question.js`. Browser specs are run with `NODE_ENV=test npx playwright test <file> --workers=1` and by the core job.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | The stub's streamed turn is not done, contains a question, and still sends its canvas blocks | - | 2 (T1a, T1b, real test server) | the four specs | - | - | 🟢 |
| AC2 | A fresh chat page sends at most one stream request and enables its button | - | - | 1 (T2, real browser, in the new test) | - | - | 🟡 |
| AC3 | The four specs pass alone and in core order | - | - | 4 specs, alone and in core order, twice | - | - | 🟡 |
| AC4 | Matrix lanes and guards, core runtime | 2 (T4a, T4b) | - | - | - | - | 🟢 |
| AC5 | Only the test-mode stub changed in product code | 1 (T5) | - | - | - | - | 🟢 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| T2 needs a real browser inside a check script | AC2 | Partial | The new test starts its own server and drives Playwright's chromium directly (as `check-lpw-s3-*` do for the request context); if chromium cannot launch in a unit environment T2 reports a skip with a reason rather than a pass |

## Tests

- **T1a (AC1).** Boot the test server; create a journey (`POST /api/journey` with the CSRF token from `/journey`), take the discovery session id from the redirect, then `POST /api/skills/discovery/sessions/<id>/turn-stream` with `{ answer: '__init__' }`. The last event is `{ done: false }`; the concatenated `chunk` text contains `?`.
- **T1b (AC1).** The same response still carries at least one `canvasBlock` event of type `system-architecture` and one of type `program-design`.
- **T2 (AC2).** Load that session's chat page in chromium, count requests to `/turn-stream` for 10 seconds, and assert at most one, and that `#chat-form button[type="submit"]` is enabled at the end. Red before the change (more than ten requests, button disabled).
- **T4a (AC4).** The four specs are not `quarantined`, carry no `reason`; those taking under 30 seconds in total are `core`.
- **T4b (AC4).** The existing matrix guards (`check-lpw-s2-*`, `check-lpw-s3-matrix-reason`, `check-lpw-s4-seed-team-member`) pass unchanged.
- **T5 (AC5).** `git diff --name-only <base>` has no path under `src/web-ui/public/`, `modules/`, `routes/` or `src/modules/`, and the only `src/` file changed is `src/web-ui/server.js`.
- **E2E (AC3).** The four specs pass alone with `--workers=1`; then the whole core in CI order passes, twice.

## Out of scope for this plan

Bounding the page's auto-continue; mock gateway fixtures; the other quarantined specs.
