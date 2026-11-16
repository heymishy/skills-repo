## Test Plan: Answer 404 for a commit preview or commit with nothing to commit, and say where the file really goes

**Story reference:** artefacts/2026-11-16-commit-preview-unknown-session/stories/cpv-s1-commit-preview-unknown-session.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-cpv-s1-commit-preview-unknown-session.js`. It sets `NODE_ENV=test` and `WIRE_SKILL_ADAPTERS=true` before requiring `server.js` (as `tests/check-scr-s1-commit-result-page.js` does), so the real wiring block runs; it uses the real `createApp()` route table with a seeded signed-in session (`seedTestSession`, cookie `session_id`, `csrfToken` set), sessions seeded with `_setHtmlSession`, and a recording replacement for `global.fetch` so any outward GitHub request is visible. `GITHUB_REPO_OWNER` and `GITHUB_REPO_NAME` are set to made-up values in the test.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Unknown session preview: 404, "Nothing to commit", no form | - | 1 (T1) | - | - | - | 🟢 |
| AC2 | No drafted artefact, or skill mismatch: same 404 | - | 1 (T2) | - | - | - | 🟢 |
| AC3 | Drafted session: 200 with truthful copy; no "new branch" on either page | - | 1 (T3) | - | - | - | 🟢 |
| AC4 | Commit POST for an unknown or empty session: 404, no GitHub request | - | 1 (T4) | - | - | - | 🟢 |
| AC5 | Commit POST for a drafted session: one PUT, 303 | - | 1 (T5) | - | - | - | 🟢 |
| AC6 | `htmlGetPreview` unchanged; existing tests pass | 1 (T6) | the full suite | - | - | - | 🟢 |
| AC7 | Live: 404 on staging and production | - | - | - | 1 | Live-only | 🟡 |
| NFR | The checked function never throws an unexpected error type | 1 (T7) | - | - | - | - | 🟢 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Needs the deployed apps | AC7 | Live-only | Verification scenario 8; read-only GETs, nothing is committed |

## Tests (new file `tests/check-cpv-s1-commit-preview-unknown-session.js`)

- **T1 (AC1).** Real app, signed in: GET `/skills/discovery/sessions/does-not-exist/commit-preview`: status 404, body contains `Nothing to commit for this session`, body contains neither `<form` nor `Review & commit`. Fails today (200 with the form).
- **T2 (AC2).** (a) A session seeded with `skillName: 'discovery'` and no `artefactPath`; (b) one with a path but empty content; (c) a drafted `discovery` session requested under `/skills/ideate/...`: each 404 with the same message. Fails today (a and b answer 200; c answers 200).
- **T3 (AC3).** A drafted session (`artefactPath` `artefacts/2026-01-01-x/discovery.md`, content `# x`): preview 200, body contains the path and a form and `default branch`, does not contain `new branch`; the result page for the same session after the commit stamp (`committedAt`) contains `The artefact has been committed.` and not `new branch`. Fails today (copy).
- **T4 (AC4).** POST `/api/skills/discovery/sessions/does-not-exist/commit` with `_csrf=<token>`; and the same for an empty session: each 404; the `global.fetch` recorder shows zero calls to any host; the session has no `committedAt`. Fails today (the adapter calls GitHub with an empty path and the response is a 500).
- **T5 (AC5).** A drafted session; `global.fetch` replaced by a stub that answers `{ ok: true, status: 200, json: () => ({ commit: { sha: 's' }, content: { html_url: 'u' } }) }`: the POST answers 303 with `Location` `/skills/discovery/sessions/<id>/result`, and the recorder shows exactly one request, method `PUT`, URL ending `/contents/artefacts/2026-01-01-x/discovery.md`. Passes today as an invariant.
- **T6 (AC6).** `routes.htmlGetPreview('discovery', 'unknown')` still returns `{ artefactContent: '', artefactPath: '' }` (the dsq4 expectation, re-asserted here as a guard).
- **T7 (NFR).** `htmlGetCommitPreviewChecked` called with `undefined`, an empty string, a 300-character id and a number: each rejects with an error whose `status` is 404 and message is the fixed text; none throws a different error type.

## Test Gaps and Risks
| Gap | Reason | Mitigation |
|-----|--------|------------|
| A session restored from Redis is not driven | Needs a Redis double | The checked function uses the same `_getSessionOrRestore` as the other routes, which `check-wusl-s1-session-redis-fallback` already covers |

**Total automated tests:** 7 (T1 to T7) plus AC7 live.
