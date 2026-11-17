# Contract Proposal - The model-session browser specs run against the test server without the chat page looping, and join the browser suite

**What will be built:**
- `src/web-ui/server.js`: the test-mode stub streaming adapter's text ends with a question (one added line and a comment); nothing else in the file changes.
- `tests/e2e/ep2-s1-presence-sidebar.spec.js`: seeds the roster and adds members through `tests/e2e/fixtures/pods.js`; ids `hamish-uuid` and `susan-uuid` become `Hamish` and `Susan`.
- `tests/e2e/capability-matrix.json`: the four specs leave quarantine (fast ones core, `ep2-s1` extended).
- `tests/check-lpw-s5-stub-turn-ends-on-question.js` (T1a to T5), a decisions entry and a Definition of Done.

**What will NOT be built:**
- No change to the chat page, the turn handlers, `src/modules/skill-turn-executor.js`, the mock LLM gateway or its fixtures; no bound on the page's auto-continue; no new npm dependency.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1a, T1b against the real test server | integration |
| AC2 | T2 in chromium | integration (real browser) |
| AC3 | the four specs alone and in core order, twice | E2E |
| AC4 | T4a, T4b | unit |
| AC5 | T5 | unit |

**Assumptions:** the stub is the streaming adapter in use for every browser turn in `NODE_ENV=test` (read at `src/web-ui/server.js` around line 2030 and confirmed by the 1,745-byte identical replies); the page's continuation rule is `done` false and no "?" in the streamed text (`routes/skills.js` client script, `evt.done` branch); no other spec depends on the stub's final line (only `rdac-s1` and the canvas spec stream turns in the test server).

`schemaDepends: []`. **Estimated touch points:** Files: about 8 (server.js, one spec, the matrix, one test, artefacts). Services: none.

**Exclusion list check (B1/D1):** the excluded paths (`public/`, `modules/`, `routes/`, `src/modules/`) have no test assertion against them other than T5, which asserts they are unchanged.
