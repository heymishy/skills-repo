# Test Plan: wuce.26 — Per-answer model response in skill HTML flow

**Story:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.26-per-answer-model-response.md
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-04
**Review status:** PASS (short-track — bounded scope, no new user-facing contract changes, extends existing tested infrastructure)
**Test runner:** `node tests/check-wuce26-per-answer-model-response.js` (chained in `npm test`)

---

## Test Data Strategy

**Strategy:** Synthetic + mocked external services

All tests inject a `_skillTurnExecutor` double via `setSkillTurnExecutor(fn)`. No real Copilot API calls are made in unit or integration tests. The double returns a resolved promise with a canned response string.

Session state (`_sessionStore`) is populated directly by calling `registerHtmlSession()` with a test skill name and a dummy session path. Skills content is loaded from the real SKILL.md files on disk via `_getQuestionsForSkill` — this is intentional (tests real question extraction).

No PCI/sensitivity constraints apply. No test data gaps.

---

## AC Coverage Table

| AC | Description | Test type | Test IDs |
|----|-------------|-----------|---------|
| AC1 | `_skillTurnExecutor` called on answer submit; response appended to `modelResponses` | Unit | T1, T2 |
| AC2 | Adapter throw → answer still recorded, `modelResponses[i]` = null, redirect proceeds | Unit | T3, T4 |
| AC3 | Question N>1: model response from previous turn rendered above prior Q&A | Unit | T5, T6 |
| AC4 | Question 1: no model-response block rendered | Unit | T7 |
| AC5 | Default stub throws `'Adapter not wired: skillTurnExecutor'` | Unit | T8 |
| AC6 | Production wiring calls correct Copilot API endpoint with correct headers | Integration | T9, T10 |
| AC7 | `htmlGetPreview` includes model responses in artefact content | Unit | T11, T12 |

## Gap Table

| Gap | Type | Handling |
|-----|------|---------|
| Real Copilot API call latency and response parsing | External service | Mocked in unit/integration; manual smoke test in verification script |
| `max_tokens` cap enforcement (API actually honours it) | External contract | Manual smoke verification only |

---

## Unit Tests

### T1 — `htmlRecordAnswer` calls `_skillTurnExecutor` and appends response to `modelResponses`

**AC:** AC1
**Precondition:** Session exists in `_sessionStore` with 0 answers, `modelResponses: []`. `_skillTurnExecutor` stub returns `Promise.resolve('Great answer, here is context.')`.
**Action:** Call `htmlRecordAnswer('discovery', sessionId, 'My raw idea')` (async).
**Expected:** `session.answers` has 1 entry (sanitised). `session.modelResponses` has 1 entry = `'Great answer, here is context.'`. Return value is `{ nextUrl: '.../next' }`.
**Currently fails:** `htmlRecordAnswer` is synchronous and does not call `_skillTurnExecutor`.

### T2 — Model response index aligns with answer index

**AC:** AC1
**Precondition:** Session with 2 prior answers and 2 prior modelResponses. Stub returns `Promise.resolve('Response 3')`.
**Action:** Call `htmlRecordAnswer('discovery', sessionId, 'Third answer')`.
**Expected:** `session.modelResponses[2]` = `'Response 3'`. `session.answers[2]` set. No earlier indices modified.
**Currently fails:** `htmlRecordAnswer` does not call the executor.

### T3 — Adapter throw does not prevent answer recording

**AC:** AC2
**Precondition:** Session with 0 answers. `_skillTurnExecutor` stub throws `new Error('API error')`.
**Action:** Call `htmlRecordAnswer('discovery', sessionId, 'My answer')`.
**Expected:** `session.answers` has 1 entry. `session.modelResponses[0]` = `null`. Return value is `{ nextUrl: '.../next' }` (no throw propagated).
**Currently fails:** `htmlRecordAnswer` does not call the executor.

### T4 — Adapter throw (non-Error rejection) handled gracefully

**AC:** AC2
**Precondition:** `_skillTurnExecutor` stub rejects with a plain string `'timeout'`.
**Action:** Call `htmlRecordAnswer('discovery', sessionId, 'Answer')`.
**Expected:** `session.modelResponses[0]` = `null`. No unhandled rejection.
**Currently fails:** `htmlRecordAnswer` is synchronous.

### T5 — `htmlGetNextQuestion` includes `modelResponse` from previous turn

**AC:** AC3
**Precondition:** Session with 1 answer and `modelResponses = ['Model said hello']`.
**Action:** Call `htmlGetNextQuestion('discovery', sessionId)`.
**Expected:** Return value has `priorQA[0].modelResponse` = `'Model said hello'`. `questionIndex` = 2.
**Currently fails:** `htmlGetNextQuestion` does not include `modelResponse` in `priorQA` entries.

### T6 — `handleGetQuestionHtml` renders model response block for question N>1

**AC:** AC3
**Precondition:** Session with 1 answer and `modelResponses = ['Here is the model insight.']`. `_getNextQuestion` wired to `htmlGetNextQuestion`.
**Action:** Call `handleGetQuestionHtml` with a mock `req`/`res` for question 2.
**Expected:** Rendered HTML body contains `'Here is the model insight.'` in a model-response block before the question form. The block is distinct from the prior-Q&A section (different CSS class or element).
**Currently fails:** `handleGetQuestionHtml` does not render a model response block.

### T7 — `handleGetQuestionHtml` renders no model-response block for question 1

**AC:** AC4
**Precondition:** Freshly registered session, 0 answers, `modelResponses = []`. `_getNextQuestion` wired.
**Action:** Call `handleGetQuestionHtml` for question 1.
**Expected:** Rendered HTML body does NOT contain any model-response section or empty placeholder for it.
**Currently fails:** N/A — currently renders nothing (will need to confirm absence after T6 is implemented).

### T8 — Default `_skillTurnExecutor` stub throws

**AC:** AC5
**Precondition:** `src/web-ui/adapters/skills.js` loaded fresh without calling `setSkillTurnExecutor`.
**Action:** Invoke `skillsAdapter.skillTurnExecutor('discovery', [], 'question?', 'answer', 'token')`.
**Expected:** Throws `Error` with message containing `'Adapter not wired: skillTurnExecutor'`.
**Currently fails:** `skillTurnExecutor` does not yet exist in `adapters/skills.js`.

### T11 — `htmlGetPreview` includes model responses in artefact content

**AC:** AC7
**Precondition:** Session with 2 answers and `modelResponses = ['Model response 1', 'Model response 2']`.
**Action:** Call `htmlGetPreview('discovery', sessionId)`.
**Expected:** `artefactContent` contains both `'Model response 1'` and `'Model response 2'` each appearing after their corresponding answer.
**Currently fails:** `htmlGetPreview` does not include `modelResponses`.

### T12 — `htmlGetPreview` handles null model responses gracefully

**AC:** AC7
**Precondition:** Session with 2 answers and `modelResponses = ['Model response 1', null]`.
**Action:** Call `htmlGetPreview('discovery', sessionId)`.
**Expected:** `artefactContent` contains `'Model response 1'` after answer 1. No null/undefined is rendered for answer 2's model response — section is omitted or replaced with empty string.
**Currently fails:** `htmlGetPreview` does not read `modelResponses`.

---

## Integration Tests

### T9 — Production wiring: `skill-turn-executor` sends correct request to Copilot API

**AC:** AC6
**Precondition:** `src/modules/skill-turn-executor.js` loaded with a stub `https` module that captures outgoing request options and body.
**Action:** Call the real executor with `(skillContent, priorQA, 'What is the problem?', 'It is slow', 'fake-token')`.
**Expected:**
- Request URL host = `api.githubcopilot.com`
- Request path = `/chat/completions`
- `Authorization` header = `'Bearer fake-token'`
- `User-Agent` header present and non-empty
- Request body `messages` array: first = `{ role: 'system', content: skillContent }`, subsequent = alternating user/assistant pairs for priorQA, last = `{ role: 'user', content: 'It is slow' }`
- Request body `max_tokens` = 300 (or `WUCE_TURN_MODEL_MAX_TOKENS` value)
**Currently fails:** `src/modules/skill-turn-executor.js` does not exist.

### T10 — Production wiring: executor returns parsed response content

**AC:** AC6
**Precondition:** Stub `https` module returns a valid Copilot API JSON response body: `{ choices: [{ message: { content: 'Good insight.' } }] }`.
**Action:** Call the real executor.
**Expected:** Returns `Promise.resolve('Good insight.')`.
**Currently fails:** Module does not exist.

---

## NFR Tests

### T-NFR1 — Token not logged on executor error

**NFR:** Security
**Precondition:** `skill-turn-executor.js` configured to throw after receiving the token. A mock logger captures all log output.
**Action:** Call the executor with token `'secret-token-abc'`. Let it throw.
**Expected:** Mock logger output does NOT contain `'secret-token-abc'` anywhere.
**Currently fails:** Module does not exist.

### T-NFR2 — Executor respects 30-second timeout

**NFR:** Performance
**Precondition:** Stub `https` module that never calls `end()` on the response.
**Action:** Call the real executor with a timeout override of 100ms.
**Expected:** Promise rejects within 200ms (with timeout error). `session.modelResponses[i]` = null (AC2 path applies).
**Currently fails:** Module does not exist.

---

## Test file

`tests/check-wuce26-per-answer-model-response.js`

All tests use the real module paths; `_skillTurnExecutor` is injectable via `setSkillTurnExecutor`. No real HTTP calls in the test file. T9/T10 stub the `https` module.

Run: `node tests/check-wuce26-per-answer-model-response.js`
Expected before implementation: **all tests FAIL**
Expected after implementation: **all tests PASS**
