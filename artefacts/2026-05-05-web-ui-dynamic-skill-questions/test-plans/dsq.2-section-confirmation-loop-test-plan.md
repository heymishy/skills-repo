# Test Plan: dsq.2 — Section confirmation loop

**Story:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/stories/dsq.2-section-confirmation-loop.md
**Test file:** tests/check-dsq2-section-confirmation-loop.js
**Review report:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/review/dsq.2-review-run2.md

---

## Test data strategy

**Type:** Synthetic + Mocked

All tests inject synthetic section data via `makeSession` overrides into the `_sessionStore`. The `_sectionDraftExecutor` adapter is replaced with a spy function for assertion. No real API calls. No PII. Self-contained: `node tests/check-dsq2-section-confirmation-loop.js`.

---

## AC coverage

| AC | Description (brief) | Test(s) | Type | Status |
|----|----------------------|---------|------|--------|
| AC1 | Last Q of a section triggers `_sectionDraftExecutor` | T3.1 | Unit | ❌ fail before impl |
| AC2 | Successful draft → pending confirmation state in session | T3.2 | Unit | ❌ fail before impl |
| AC3 | "Confirm" → `sectionDrafts[i]` = draft, advance to next section | T3.3 | Unit | ❌ fail before impl |
| AC4 | "Edit" + operator text → `sectionDrafts[i]` = operator text, advance | T3.4 | Unit | ❌ fail before impl |
| AC5 | Executor throws → silent fallback, session advances normally | T3.5 | Unit | ❌ fail before impl |
| AC6 | Default stub throws exact required message | T3.6 | Unit | ❌ fail before impl |
| AC7 | Skill with no H2 sections → no confirmation step | T3.7 | Unit | ❌ fail before impl |
| AC8 | All prior tests pass (regression) | T3.8 | Regression | ❌ fail before impl |

Additional coverage:
| T3.9 | `setSectionDraftExecutorAdapter` exported from routes | Smoke | ❌ fail before impl |

---

## Gap table

| Gap | Risk | Mitigation |
|-----|------|-----------|
| "Edit" path with empty operator text | LOW — AC4 implies operator provides text; empty treated same as fallback | Not required by AC; skip |
| Section advancement index tracking | MEDIUM — could go out of bounds | T3.3 asserts `session.currentSectionIndex` increments to 1 after confirm |
| Concurrent session isolation | LOW — Map store is single-process in tests | freshRequire per test provides isolation |

---

## Unit tests

### T3.9 — Smoke: `setSectionDraftExecutorAdapter` exported

**Given** `routes/skills.js` is loaded
**Then** `routes.setSectionDraftExecutorAdapter` is a function

---

### T3.1 — AC1: Last Q of a section triggers `_sectionDraftExecutor`

**Given** a session with 2 sections, section 0 has 2 questions, 1 answer already recorded (so next answer is the last Q of section 0)
**When** `htmlRecordAnswer` is called with the second answer
**Then** `_sectionDraftExecutor` is called exactly once, with arguments including the section heading and Q&A pairs

---

### T3.2 — AC2: Successful draft → pending confirmation

**Given** same setup as T3.1, `_sectionDraftExecutor` returns a non-empty draft string
**When** `htmlRecordAnswer` completes
**Then**
- `session.pendingConfirmation` is truthy (or `session.pendingSectionDraft` is set)
- The returned `nextUrl` or `draftText` signals that confirmation is needed (i.e. response is not a plain next-question URL)

---

### T3.3 — AC3: "Confirm" → sectionDrafts[i] set, session advances

**Given** a session in pending confirmation state (pendingSectionDraft set to `'Draft text for section 0.'`)
**When** `htmlRecordAnswer` is called with answer `'confirm'`
**Then**
- `session.sectionDrafts[0]` equals `'Draft text for section 0.'`
- `session.pendingConfirmation` is falsy
- Session has advanced to the next section (index 1)

---

### T3.4 — AC4: "Edit" → sectionDrafts[i] set to operator text, advance

**Given** a session in pending confirmation state with some draft stored
**When** `htmlRecordAnswer` is called with answer `'edit:My custom final text for this section.'`
**Then**
- `session.sectionDrafts[0]` equals `'My custom final text for this section.'` (the operator text after `'edit:'` prefix)
- `session.pendingConfirmation` is falsy
- Session advances to the next section

---

### T3.5 — AC5: Executor throws → silent fallback, no error propagated

**Given** `_sectionDraftExecutor` is wired to throw `new Error('API failure')`
**When** `htmlRecordAnswer` is called with the last Q of section 0
**Then**
- No error is thrown from `htmlRecordAnswer`
- Session advances past the section without setting `pendingConfirmation`
- `session.sectionDrafts[0]` is undefined/null (no draft stored)

---

### T3.6 — AC6: Default stub throws exact message

**Given** `setSectionDraftExecutorAdapter` has NOT been called (fresh routes module)
**When** the adapter function is invoked directly (or via a session that triggers section-end)
**Then** throws `Error` with message `'Adapter not wired: _sectionDraftExecutor. Call setSectionDraftExecutorAdapter() with a real implementation before use.'`

---

### T3.7 — AC7: Flat skill (no H2 sections) → no confirmation step

**Given** a session whose `session.sections` contains a single element with `heading: ''`
**When** `htmlRecordAnswer` is called with the last answer
**Then**
- `_sectionDraftExecutor` is NOT called (spy confirms 0 calls)
- Session completes normally (done=true path continues to next URL)

---

### T3.8 — AC8: Regression canary — wuce.26 + dsq.1.5 behaviour intact

**Given** a session with standard sections and an executor returning a non-empty draft
**When** `htmlRecordAnswer` is called for a non-last-question-of-section answer
**Then**
- `_skillTurnExecutor` is still called and `modelResponses` is populated (wuce.26)
- `_nextQuestionExecutor` is still called and `dynamicQuestions` is populated (dsq.1)
- Neither `_sectionDraftExecutor` nor `pendingConfirmation` is triggered for mid-section answers

---

## NFR tests

No separate NFR test entry. T3.5 implicitly tests the error-resilience NFR (silent fallback for API failure).

---

## Test execution

```
node tests/check-dsq2-section-confirmation-loop.js
```

All tests must FAIL before implementation. All must PASS after implementation.
