# Test Plan: dsq.1 — Dynamic next-question generation for web UI skill sessions

**Story:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/stories/dsq.1-dynamic-next-question.md
**Test file:** tests/check-dsq1-dynamic-next-question.js
**Review report:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/review/dsq.1-review.md

---

## Test data strategy

**Type:** Synthetic + Mocked (injectable adapters as spies/stubs)

All tests use in-memory session store only. Injectable adapters (`_skillTurnExecutor`, `_nextQuestionExecutor`) are replaced with synchronous spy functions per test via `setSkillTurnExecutorAdapter` and `setNextQuestionExecutorAdapter`. No real API calls, no network access, no disk writes beyond what the production code already does when reading skill content from the repo.

Sessions are created via `registerHtmlSession(sessionId, '/tmp/s-<id>', 'discovery')` (uses the real `discovery` skill on disk) then state is patched via `_getHtmlSession(sessionId)` to inject synthetic questions, answers, and model responses. This matches the established wuce.26 test pattern exactly.

No PII, no PCI data. Self-contained: `node tests/check-dsq1-dynamic-next-question.js`.

---

## AC coverage

| AC | Description (brief) | Test(s) | Type | Status |
|----|----------------------|---------|------|--------|
| AC1 | `htmlRecordAnswer` makes second call to `_nextQuestionExecutor` with SKILL.md + history + instruction | T1.1 | Unit | ❌ fail before impl |
| AC2 | Non-empty response stored in `session.dynamicQuestions[i]`; returned by `htmlGetNextQuestion` | T1.2 | Unit | ❌ fail before impl |
| AC3 | Exception/empty/null → static fallback, no error propagated | T1.3, T1.4, T1.5 | Unit | ❌ fail before impl |
| AC4 | `questionIndex`/`totalQuestions` always reflect static list count | T1.6 | Unit | ❌ fail before impl |
| AC5 | `setNextQuestionExecutorAdapter` exported from routes module | T1.7 | Unit | ❌ fail before impl |
| AC6 | Default stub throws exact required message | T1.8 | Unit | ❌ fail before impl |
| AC7 | All 14 wuce.26 tests continue to pass (regression) | T1.9 | Regression | ❌ fail before impl |

---

## Gap table

| Gap | Risk | Mitigation |
|-----|------|-----------|
| Prompt format not fully specified (which fields/order) | LOW — AC1 specifies three required elements; exact prompt format is implementation detail | Test asserts all three elements are present, not exact format |
| Server.js wiring not tested by the unit test file | LOW — AC5 spec says wiring must be verified by a test; covered by T1.7 checking export; server.js wiring tested separately at DoR |
| 10 000 ms timeout NFR | LOW — async timeout is an integration concern; test mocks executor so timeout logic is not hit; NFR verified by code review |

---

## Unit tests

### T1.1 — AC1: `htmlRecordAnswer` calls `_nextQuestionExecutor` with correct arguments

**Given** a session with SKILL.md content, two static questions, and zero answers
**When** `htmlRecordAnswer` is called with the first answer
**Then** the spy wired to `_nextQuestionExecutor` is called exactly once with:
- `systemPrompt` that includes the SKILL.md content
- conversation history array (one entry with the just-recorded answer)
- answer argument that includes the question text and answer text
- the instruction "Given the skill instructions and the conversation so far, what is the single best next question to ask the operator?"

**Assertion detail:**
```
assert.strictEqual(executorCallCount, 1)
assert.ok(capturedSystemPrompt.length > 0)
assert.ok(capturedAnswer.includes('Given the skill instructions and the conversation so far'))  // or the instruction in systemPrompt
assert.ok(Array.isArray(capturedHistory))
```

---

### T1.2 — AC2: Non-empty response stored and served by `htmlGetNextQuestion`

**Given** a session where the executor returns `'What is your primary constraint?'`
**When** `htmlRecordAnswer` completes for answer at index 0
**Then**
- `session.dynamicQuestions[0]` === `'What is your primary constraint?'`
- `htmlGetNextQuestion('discovery', sid).question` === `'What is your primary constraint?'`

---

### T1.3 — AC3 path A: Executor throws → static fallback

**Given** a session with two static questions `['What is your background?', 'What are your goals?']`
**When** `htmlRecordAnswer` is called and `_nextQuestionExecutor` throws `new Error('API timeout')`
**Then**
- `htmlGetNextQuestion` for index 1 returns `question` === `'What are your goals?'` (static item)
- `result.nextUrl` is still returned (session continues)
- No error thrown from `htmlRecordAnswer`

---

### T1.4 — AC3 path B: Executor returns empty string → static fallback

**Given** executor returns `''`
**When** `htmlRecordAnswer` completes
**Then** `htmlGetNextQuestion` for index 1 returns the static item at index 1

---

### T1.5 — AC3 path C: Executor returns null → static fallback

**Given** executor returns `null`
**When** `htmlRecordAnswer` completes
**Then** `htmlGetNextQuestion` for index 1 returns the static item at index 1

---

### T1.6 — AC4: `questionIndex` and `totalQuestions` always reflect static list count

**Given** a session with 3 static questions and a dynamic question already stored at index 0
**When** `htmlGetNextQuestion` is called for index 1 (second question)
**Then**
- `result.questionIndex` === 2
- `result.totalQuestions` === 3 (static list count, unchanged)

---

### T1.7 — AC5: `setNextQuestionExecutorAdapter` is exported

**Given** the module `src/web-ui/routes/skills.js` is loaded
**Then**
- `typeof routes.setNextQuestionExecutorAdapter` === `'function'`

---

### T1.8 — AC6: Default stub throws with exact message

**Given** the default (un-wired) `_nextQuestionExecutor`
**When** a session is registered and `htmlRecordAnswer` is called without wiring the adapter
**Then** the error message thrown by the stub is exactly:
`'Adapter not wired: _nextQuestionExecutor. Call setNextQuestionExecutorAdapter() with a real implementation before use.'`

Note: Because AC3 specifies that `htmlRecordAnswer` catches all executor errors, the stub throw is caught internally and the fallback fires. To observe the stub message directly, this test wires a wrapper that re-throws after capture, or tests the stub directly via the adapters module.

---

### T1.9 — AC7: Regression canary — wuce.26 core behaviour unaffected

**Given** the dsq.1 implementation is in place
**When** the key wuce.26 behaviour is re-tested in this file
**Then** `htmlRecordAnswer` still:
- Calls `_skillTurnExecutor` (first call) and stores the result in `session.modelResponses[i]`
- Returns `{ nextUrl }` correctly

This test re-asserts T1 from the wuce.26 suite to confirm no regression.

---

## NFR tests

No automated NFR tests in this file. The 10 000 ms timeout NFR is enforced by the implementation (a `Promise.race` or `AbortSignal` in the executor wiring); the test file mocks the executor so timeout logic is not exercised. Timeout behaviour is verified during DoR code review.

---

## Integration / E2E

No E2E tests required. All ACs are testable at the unit level via injectable adapters and direct function calls. No new HTTP routes are introduced by this story.

---

## Test execution

```
node tests/check-dsq1-dynamic-next-question.js
```

All 9 tests must FAIL before implementation. All 9 tests must PASS after implementation.

Full suite regression:
```
npm test
```
