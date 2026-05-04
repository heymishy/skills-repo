# Test Plan: dsq.1.5 — Section-aware question extraction

**Story:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/stories/dsq.1.5-section-aware-extraction.md
**Test file:** tests/check-dsq1-5-section-aware-extraction.js
**Review report:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/review/dsq.1.5-review.md

---

## Test data strategy

**Type:** Synthetic + Mocked

All tests use synthetic SKILL.md strings passed directly to `extractSections(content)` — no disk reads in the test assertions themselves. The `registerHtmlSession` test (AC4) uses the real `discovery` skill to bootstrap a session, then verifies `session.sections` was populated.

Self-contained: `node tests/check-dsq1-5-section-aware-extraction.js`. No network access. No PII.

---

## AC coverage

| AC | Description (brief) | Test(s) | Type | Status |
|----|----------------------|---------|------|--------|
| AC1 | `extractSections` with H2 headings → `Array<{heading, questions[]}>` in doc order | T2.1, T2.2 | Unit | ❌ fail before impl |
| AC2 | No H2 headings → `[{heading: '', questions: [...all...]}]` | T2.3 | Unit | ❌ fail before impl |
| AC3 | Union of all section.questions === `extractQuestions(content)` result | T2.4 | Unit | ❌ fail before impl |
| AC4 | `registerHtmlSession` populates `session.sections` | T2.5 | Unit | ❌ fail before impl |
| AC5 | 14 wuce.26 tests unaffected (regression canary) | T2.6 | Regression | ❌ fail before impl |

Additional coverage:
| T2.7 | Questions before first H2 captured under empty-string heading | Unit | ❌ fail before impl |

---

## Gap table

| Gap | Risk | Mitigation |
|-----|------|-----------|
| extractSections with mixed questions before and after first H2 | LOW — covered by T2.7 and NFR spec | T2.7 asserts pre-H2 questions land under empty heading |
| extractSections is sync (NFR) | LOW — test calls it synchronously; if it returns a Promise the test will fail | T2.1 asserts return is a plain array (not a Promise) |

---

## Unit tests

### T2.1 — AC1: H2 headings produce correctly shaped section array in document order

**Given** a SKILL.md string with two H2 headings, each with questions beneath them
**When** `extractSections(content)` is called
**Then**
- Returns an array of length 2
- `sections[0].heading` === `'Section One'`
- `sections[0].questions` has only the questions under `## Section One`
- `sections[1].heading` === `'Section Two'`
- `sections[1].questions` has only the questions under `## Section Two`
- No question appears in both sections

---

### T2.2 — AC1 extended: question `id` and `text` fields correct

**Given** the same two-section SKILL.md
**Then**
- `sections[0].questions[0].id` is a string (non-empty)
- `sections[0].questions[0].text` equals the question text extracted from the `> **...**` pattern
- Questions retain the same `id` assignment scheme as `extractQuestions`

---

### T2.3 — AC2: No H2 headings → single element with empty-string heading

**Given** a SKILL.md string with no H2 headings but with questions
**When** `extractSections(content)` is called
**Then**
- Returns array of length 1
- `sections[0].heading` === `''`
- `sections[0].questions` contains all questions from the content

---

### T2.4 — AC3: Union of all section questions equals flat `extractQuestions` result

**Given** a SKILL.md string with two sections containing different questions
**When** both `extractSections(content)` and `extractQuestions(content)` are called
**Then**
- The flat list produced by concatenating all `section.questions` has the same length as the `extractQuestions` result
- Every question text in the flat list appears in the `extractQuestions` result
- The order is preserved (questions within each section are in document order)

---

### T2.5 — AC4: `session.sections` populated by `registerHtmlSession`

**Given** a session is registered via `registerHtmlSession`
**When** `_getHtmlSession(sessionId)` is called
**Then**
- `session.sections` is an array (not undefined, not null)
- `session.questions` is still present and unchanged (existing field must not be removed)
- `session.answers` is still an empty array (no regression to other session fields)

---

### T2.6 — AC5: Regression canary — existing session fields still populated

**Given** a session registered via `registerHtmlSession` (same as T2.5)
**Then**
- `session.skillContent` is a non-empty string (wuce.26 field)
- `session.modelResponses` is an array (wuce.26 field)
- Both fields introduced before this story are not removed or nulled by the dsq.1.5 change

---

### T2.7 — NFR: Questions before first H2 captured under empty-string heading

**Given** a SKILL.md string where questions appear before the first `## heading`
**When** `extractSections(content)` is called
**Then**
- A section with `heading: ''` appears first in the array
- Those pre-H2 questions are in `sections[0].questions`
- Subsequent H2 sections appear after it in order

---

## NFR tests

`extractSections` is synchronous (no I/O). T2.1 verifies this implicitly — it returns a plain Array synchronously in the same tick (no `.then` needed). No further NFR test file entry required; the sync nature is enforced by calling the function without `await` and asserting the return value directly.

---

## Integration / E2E

No E2E tests required. All ACs are testable at the unit level. No new HTTP routes.

---

## Test execution

```
node tests/check-dsq1-5-section-aware-extraction.js
```

All 7 tests must FAIL before implementation. All 7 must PASS after implementation.
