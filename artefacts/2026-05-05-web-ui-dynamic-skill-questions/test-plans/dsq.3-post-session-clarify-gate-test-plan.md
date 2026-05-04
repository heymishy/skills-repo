# Test Plan: dsq.3 — Post-session /clarify gate

**Story:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/stories/dsq.3-post-session-clarify-gate.md
**Test file:** tests/check-dsq3-post-session-clarify-gate.js
**Review report:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/review/dsq.3-review.md

---

## Test data strategy

**Type:** Synthetic + Mocked

All tests use synthetic sessions created via `makeSession` overrides. The `/complete` page HTML is tested via a new exported function `htmlGetCompletePage(skillName, sessionId)` (analogous to `htmlGetPreview`). No real HTTP requests needed; no PII. Self-contained: `node tests/check-dsq3-post-session-clarify-gate.js`.

---

## AC coverage

| AC | Description (brief) | Test(s) | Type | Status |
|----|----------------------|---------|------|--------|
| AC1 | Final answer `nextUrl` → `/complete`, not `/commit-preview` | T4.1 | Unit | ❌ fail before impl |
| AC2 | `/complete` page renders: heading, skill name + Q count, "Commit artefact", "Run /clarify first" | T4.2, T4.3 | Unit | ❌ fail before impl |
| AC3 | "Commit artefact" links to commit-preview URL | T4.4 | Unit | ❌ fail before impl |
| AC4 | "Run /clarify first" links to `/skills/clarify` | T4.5 | Unit | ❌ fail before impl |
| AC5 | Commit action is primary; clarify is secondary in HTML order | T4.6 | Unit | ❌ fail before impl |
| AC6 | Regression: prior tests still pass; non-final-answer nextUrl unchanged | T4.7 | Regression | ❌ fail before impl |

---

## Gap table

| Gap | Risk | Mitigation |
|-----|------|-----------|
| Session not found in `/complete` renders gracefully | LOW — server-side concern; tested via `htmlGetCompletePage` returning empty or error | Not in AC; skip |
| "Run /clarify first" preserves session (AC4 note) | LOW — session not destroyed is server-state concern, not HTML content | T4.5 verifies URL points to `/skills/clarify`, not session destruction |

---

## Unit tests

### T4.1 — AC1: Final answer returns nextUrl pointing to `/complete`

**Given** a session with 2 questions and 1 answer already recorded
**When** `htmlRecordAnswer` is called with the final answer
**Then**
- `result.nextUrl` contains `/complete`
- `result.nextUrl` does NOT contain `commit-preview`

---

### T4.2 — AC2: `htmlGetCompletePage` exported and returns HTML with required elements

**Given** `routes.htmlGetCompletePage(skillName, sessionId)` is called
**Then**
- Returns a string (HTML)
- HTML contains `"Draft complete"` (heading text)
- HTML contains the skill name
- HTML contains the question count

---

### T4.3 — AC2 continued: HTML contains "Commit artefact" and "Run /clarify first" elements

**Given** same as T4.2
**Then**
- HTML contains `"Commit artefact"` (button or link text)
- HTML contains `"Run /clarify first"` (secondary option text)

---

### T4.4 — AC3: "Commit artefact" links to commit-preview URL

**Given** the complete page HTML
**Then**
- HTML contains the commit-preview URL segment (e.g. `commit-preview`)
- The commit-preview link is a valid `href` attribute pointing to the same session's commit-preview path

---

### T4.5 — AC4: "Run /clarify first" links to `/skills/clarify`

**Given** the complete page HTML
**Then**
- HTML contains `/skills/clarify` as a link target

---

### T4.6 — AC5: Commit element appears before clarify element in HTML

**Given** the complete page HTML
**Then**
- `indexOf("commit-preview")` < `indexOf("/skills/clarify")` in the HTML string
  (commit CTA appears earlier in the document than the clarify link)

---

### T4.7 — AC6: Regression canary — non-final-answer nextUrl unchanged

**Given** a session with 3 questions and 0 answers
**When** `htmlRecordAnswer` is called with the first answer (not the final answer)
**Then**
- `result.nextUrl` does NOT point to `/complete`
- `result.nextUrl` points to a next-question URL (does not contain `complete` or `commit-preview`)

---

## NFR tests

T4.2 implicitly tests that the complete page doesn't expose session token or answer content (the HTML only contains skill name and question count per NFR). An additional inspection step is added to the verification script.

---

## Test execution

```
node tests/check-dsq3-post-session-clarify-gate.js
```

All 7 tests must FAIL before implementation. All 7 must PASS after implementation.
