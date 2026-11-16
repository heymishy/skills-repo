# Contract Proposal - Reject malformed, empty and oversized skill turns before they reach the model

**What will be built:**
- `src/web-ui/routes/skills.js`: a limited JSON body reader `_readTurnBody(req)` (honours a pre-parsed `req.body` like `_readBody`; reads at most 262144 bytes and reports too-large) and a shared `_validateTurnRequest(skillName, session, body)` that returns `null` or `{status, error}` using the rules in the story; both `handlePostTurnHtml` and `handlePostTurnStreamHtml` call them after the session lookup and before the journey lock, the credits deduction and the model call; the validation exports `_validateTurnRequest` for tests.
- `tests/check-tvl-s1-turn-body-validation.js` (new, T1 to T8).

**What will NOT be built:**
- No change to `server.js`, the credits guard, the viewer guard, `_readBody` or any other route; no change to the model executors, the response shapes, the chat page's own error display, `/answer` or `commit-preview`; no rate limiting; no new npm dependency.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1 | integration (handler, counting stubs) |
| AC2 | T2 | integration |
| AC3 | T3a, T3b | unit and integration |
| AC4 | T4 | integration |
| AC5 | T5 | integration |
| AC6 | T6 and the existing turn tests | integration |
| AC7 | T7 | integration |
| AC8 | Scenario 9 | live (staging) |

**Existing tests that drive these handlers (must pass unchanged):** `check-a4-session-store-state`, `check-alrf-s8-journey-slug-priority`, `check-csd-s1`, `check-csd-s2`, `check-csd-s6`, `check-csgc-s1`, `check-dcuf-s1`, `check-defs-revs-s1`, `check-dsh-s1`, `check-icv-s1`, `check-inc2.1`, `check-inc4`, `check-isc-s1`, `check-iwu3`, `check-iwu5`, `check-lab-s3.3-credit-enforcement`, `check-ltd-s1`, `check-mfc1-model-first-chat-session`, `check-ntpg-s1`, `check-pla-s2`, `check-ral-s1`, `check-res-s2`, `check-res-s3`, `check-rsc-s1`, `check-s0.4`, `check-s1-diagram-marker-diagnostic`, `check-s2-mermaid-syntax-diagnostic`, `check-s5`, `check-s6.1`, `check-sdrg-s1`.

**Assumptions:** the page sends `{answer, attemptId}` JSON and `__init__` for the first turn (read at `routes/skills.js` lines 3976 and 2678); `creditsGuard` in `server.js` only checks the balance and the deduction happens after success in the handler (read at lines 4916 to 4921); `session.skillName` is set by `registerHtmlSession`; `turnInProgress` is set after the journey lookup and before the body read today, so validation must move ahead of it.

`schemaDepends: []`. **Estimated touch points:** Files: `src/web-ui/routes/skills.js`, `tests/check-tvl-s1-turn-body-validation.js` (new). Services: none. APIs: bad turn requests become 400, 413 or 404 instead of 200.
