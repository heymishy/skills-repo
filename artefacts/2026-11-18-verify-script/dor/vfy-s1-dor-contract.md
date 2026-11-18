# Contract Proposal - One committed command boots the test server, runs the core browser lane, and prints what broke

**What will be built:**
- `scripts/verify.js`: runs the core lane (or the files given) through Playwright with `--workers=1` and `NODE_ENV=test`, Playwright's `webServer` starting the server; reads Playwright's JSON report from a temporary file; prints a digest of failed tests; exits with the Playwright exit code. Exports its pure functions for tests.
- `tests/check-vfy-s1-verify-script.js` (T1a to T5b).
- A `decisions.md` entry and a Definition of Done, including one live run with a pass and one with a deliberately failing spec.

**What will NOT be built:**
- No change to `playwright.config.js`, the core lane, `scripts/list-core-specs.js`, any spec, or the server. No new npm dependency. No watch mode. No lint, unit or governance checks in this command.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1a, T1b on the built command and environment | unit |
| AC2 | T2a to T2c on fixture report JSON | unit |
| AC3 | T3a, T3b | unit |
| AC4 | T4 | unit |
| AC5 | T5a, T5b with a real listener on a free and a busy port | unit |
| AC1 to AC3 end to end | one live run with the core lane, one with a temporary failing spec (removed afterwards) | manual, recorded in the DoD |

**Assumptions:** Playwright's JSON reporter writes to the path in `PLAYWRIGHT_JSON_OUTPUT_NAME` (CI already relies on this); `list-core-specs.js` exits non-zero on an empty core; the test server listens on port 3999 (`playwright.config.js`).

`schemaDepends: []`. **Estimated touch points:** Files: 2 plus artefacts. Services: none.

**Exclusion list check (B1/D1):** `playwright.config.js` and the server are excluded; no test here asserts against them beyond the live run.
