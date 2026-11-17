# Contract Proposal - The board's Advance button and drag-to-advance work, and a failed advance is never reported as success

**What will be built:**
- `src/web-ui/views/kanban-view.js` and the three board handlers in `src/web-ui/routes/products.js`: the page's CSRF token reaches the board script and is sent with every advance request (button and drag); the script shows the error body's message in the existing error element.
- `src/web-ui/routes/products.js` `handlePostBoardAdvance`: honest status mapping (401 and 403 as they are, other unexpected statuses as 502 `advance-failed`, 2xx and 3xx as success) and a `board_advance_failed` PostHog capture without secrets.
- A test-mode artefact commit adapter wired in `src/web-ui/server.js` only when `NODE_ENV=test` (a separate wiring task per D37), so a seeded journey's gate-confirm can complete.
- Board readiness (issue #1141): the board and `handlePostBoardAdvance` read session completion through the same restore path the chat page uses (one batched read), so a restart or deploy no longer leaves every card "not ready".
- Spec work: `psh-s6` rewritten (signed in, real product); `s1.1`, `s3.1`, `s3.2` verified; the matrix lanes for the board specs and the `ep3-s1` reason updated.
- Four guard tests named in the test plan; `decisions.md` entries and a Definition of Done.

**What will NOT be built:**
- No change to `csrfGuard` or to gate-confirm's own behaviour; no exemption of the route from CSRF; no change to the real artefact commit path; no fix for #1042, feature creation, pods or model sessions; no ruleset change.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1 plus `s1.1` AC1 and `s3.1` AC1 | unit + e2e |
| AC2 | T2 | unit |
| AC3 | T3 | unit |
| AC4 | T4 plus `s1.1` AC1 | unit + e2e |
| AC5 | the specs in the whole suite; two core-job runs | e2e + live |
| AC6 | T5 | unit |
| AC7 | staging check after deploy | live |

**Assumptions:** the board page can render a session CSRF token the way the other server-rendered forms do (the fixtures read a hidden `_csrf` field); gate-confirm attempts a repository commit for the seeded journey, which is why it answers `artefact-commit-failed` in the test server (to confirm in the first task); the order-dependent whole-suite failures of the other board specs may have a separate cause (AC5 names it if so).

`schemaDepends: []`. **Estimated touch points:** Files: about 12 (view, products route, server wiring, adapter, four tests, four specs, matrix, artefacts). Services: GitHub Actions. APIs: PostHog capture (existing).

**Exclusion list check (B1/D1):** the excluded items (`csrfGuard`, gate-confirm behaviour, the real commit path, the ruleset) have no test assertion against them; T2 stubs gate-confirm's response rather than touching it, and T4 asserts only the test-mode adapter.
