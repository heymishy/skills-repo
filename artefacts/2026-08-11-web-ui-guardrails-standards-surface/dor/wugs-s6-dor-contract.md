## Contract Proposal — Build the branch + PR creation adapter for guardrail/standard edits

**What will be built:**
A new module (e.g. `src/web-ui/adapters/guardrail-pr-adapter.js`) implementing the injectable-adapter pattern (`_guardrailPrAdapter`, `setGuardrailPrAdapter()`/`getGuardrailPrAdapter()`, stub throws). The real implementation performs, in sequence: (1) GET default branch SHA, (2) POST create ref (new branch), (3) PUT create/update file content (using fetched SHA for updates), (4) POST create PR. Returns `{prNumber, prUrl}` on success.

**What will NOT be built:**
PR merging. Rate-limit retry/backoff logic. Any reuse of `repo-bootstrap.js`'s direct-to-master pattern.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test, 4 mocked sequential API calls, all succeed | unit |
| AC2 | Unit test, mocked SHA fetch + update, plus a mocked 409/422 conflict case | unit |
| AC3 | Unit test, mocked success response with `number`/`html_url` | unit |
| AC4 | Unit test, mocked failure at each of the 4 steps (4 cases) | unit |
| AC5 | Unit test, fresh module require, no adapter wired | unit |
| AC6 | Integration test, real `server.js` wiring, two distinct content changes | integration |

**Assumptions:**
Real GitHub branch/Contents/Pulls API shapes match documentation — flagged in the test plan as requiring one live sandbox-repo confirmation before merge (not optional), per CLAUDE.md's mock-shape-verification rule.

**Estimated touch points:**
Files: `src/web-ui/adapters/guardrail-pr-adapter.js` (new), `src/web-ui/server.js` (wiring), `tests/check-wugs-s6-*.js` (new)
Services: None
APIs: GitHub Git Refs API, Contents API, Pulls API
