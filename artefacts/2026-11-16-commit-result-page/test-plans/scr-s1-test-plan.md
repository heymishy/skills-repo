## Test Plan: Show the "Committed" result page after a skill session commit, instead of a server error

**Story reference:** artefacts/2026-11-16-commit-result-page/stories/scr-s1-commit-result-page.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-scr-s1-commit-result-page.js`. It sets `NODE_ENV=test` and `WIRE_SKILL_ADAPTERS=true` before requiring `server.js` (the same switch `playwright.local.config.js` uses), so the real wiring block runs once in the process. Sessions are seeded with `registerHtmlSession` and `seedTestSession`; the commit adapter is stubbed with `setCommitSession`. Existing `tests/check-wuce25-session-commit-result.js` is left unchanged and must keep passing.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Real wiring: `getCommitResult` returns the committed session's own data | - | 1 (T1) | - | - | - | 🟢 |
| AC2 | Path derivation for nested and root-level artefacts | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | Result page 200 with path and link; two sessions give two results | - | 1 (T3) | - | - | - | 🟢 |
| AC4 | Unknown, uncommitted, or pathless session: 404, never "Committed.", no report | - | 1 (T4) | - | - | - | 🟢 |
| AC5 | Commit POST then follow the redirect: 200 | - | 1 (T5) | - | - | - | 🟢 |
| AC6 | Unwired adapter still throws | 1 (T6) | - | - | - | - | 🟢 |
| AC7 | Live: committed page shows | - | - | - | 1 | Live-only | 🟡 |
| NFR | Derivation never throws | 1 (T7) | - | - | - | - | 🟢 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Needs the deployed app and a real commit | AC7 | Live-only | Verification scenario 9; operator-performed, `production-observed` |

No AC depends on CSS layout; no B2 classification needed.

## Test Data Strategy

**Source:** Synthetic sessions with the real shape (`skillName`, `artefactPath` as `computeArtefactSavePath` builds it, `committedAt` as the commit handler stamps it). **PCI/sensitivity:** No. **Owner:** self-contained.

## Tests (new file `tests/check-scr-s1-commit-result-page.js`)

- **T1 (AC1).** With the real server module loaded and wiring on: seed a committed session; `skillsAdapter.getCommitResult('discovery', id, 'tok')` resolves to its path, slug and type. Fails today ("Adapter not wired").
- **T2 (AC2).** `htmlGetCommitResult` for a nested path (`dor/ex-s1-dor`) and a root path (`discovery`); also a path under `artefacts/archived/` is returned as given with the slug as the segment after `artefacts/`.
- **T3 (AC3).** Through the real route table with a signed-in test session: GET result for two committed sessions answers 200, body contains "Committed.", its own path and `/artefact/<slug>/<type>`, and not the other session's path. Fails today (500).
- **T4 (AC4).** Unknown id, a session with no `committedAt`, a committed session with no path: each answers 404, body contains "Commit result not found", does not contain "Committed."; zero reports.
- **T5 (AC5).** `setCommitSession` stub; POST to the commit route with a valid CSRF token for a drafted session answers 303 with the result Location; following it answers 200. Fails today (500 at the end).
- **T6 (AC6).** A fresh copy of the adapter module (loaded in a child process or via `require` cache isolation) throws "Adapter not wired: getCommitResult".
- **T7 (NFR).** Paths `''`, `'x'`, `'artefacts/'`, `'artefacts//x.md'`, a non-string: the derivation returns a 404 error, never an unexpected exception type.

## Test Gaps and Risks
| Gap | Reason | Mitigation |
|-----|--------|------------|
| A real GitHub commit is not exercised | The commit adapter is stubbed; the real one is untouched | AC7 live, operator-performed |

**Total automated tests:** 7 (T1 to T7) plus AC7 live.
