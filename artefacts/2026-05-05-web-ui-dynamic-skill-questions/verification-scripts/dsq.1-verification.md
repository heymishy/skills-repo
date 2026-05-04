# AC Verification Script: dsq.1 — Dynamic next-question generation

**Story:** dsq.1 — Dynamic next-question generation for web UI skill sessions
**Verification type:** Pre-coding baseline (all checks must FAIL) + post-implementation smoke test (all checks must PASS)

---

## Pre-merge automated check

```
node tests/check-dsq1-dynamic-next-question.js
```

Expected before implementation: 0 passed, 9 failed.
Expected after implementation: 9 passed, 0 failed.

Full suite:
```
npm test
```
Expected: all existing tests still pass (no regressions from wuce.26 baseline).

---

## Manual AC verification steps (smoke test after merge)

Run these steps against a locally running server. Start the server:

```powershell
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
node src/web-ui/server.js
```

---

### AC1 — Second model call made with SKILL.md + history + instruction

**Trigger:** Submit an answer on question 1 of any skill session in the web UI.

**Verify:** In the server console output, confirm two model calls are logged — one for the skill-turn executor and one for the next-question executor. The second call's prompt must include the instruction "Given the skill instructions and the conversation so far, what is the single best next question to ask the operator?".

**Pass condition:** Two separate executor log entries visible; second entry references the instruction string.

---

### AC2 — Dynamic question served on question 2

**Trigger:** After submitting answer 1, navigate to the question 2 page.

**Verify:** The question text shown on question 2 is model-generated (differs from the raw SKILL.md question text), confirming `session.dynamicQuestions[0]` was used.

**Pass condition:** Question 2 text is visibly different from the static SKILL.md text for that question.

---

### AC3 — Silent fallback when executor fails

**Trigger:** Temporarily break the `WUCE_TURN_MODEL` env var to an invalid value and submit an answer.

**Verify:** The page still loads question 2 (or commit-preview if on the last question) without showing an error. The static question text from the SKILL.md is used for question 2.

**Pass condition:** No error page rendered; session continues; static question text shown.

---

### AC4 — Progress indicator uses static count

**Trigger:** Any skill session with 4+ questions; submit answers and observe "Question X of Y" display.

**Verify:** The denominator Y equals the total number of questions in the static SKILL.md list and never changes between questions.

**Pass condition:** "Question 2 of N", "Question 3 of N" — N is constant throughout.

---

### AC5 — `setNextQuestionExecutorAdapter` exported and wired

**Trigger:** Run in Node REPL:
```
const r = require('./src/web-ui/routes/skills');
console.log(typeof r.setNextQuestionExecutorAdapter);
```

**Pass condition:** Prints `function`.

---

### AC6 — Default stub throws

**Trigger:** In a fresh module load (before server.js wires the adapter), call the default stub directly.

**Verify:** The error message is exactly: `Adapter not wired: _nextQuestionExecutor. Call setNextQuestionExecutorAdapter() with a real implementation before use.`

**Pass condition:** Error message matches exactly.

---

### AC7 — No wuce.26 regressions

**Trigger:** Run `node tests/check-wuce26-per-answer-model-response.js`

**Pass condition:** 14 passed, 0 failed.
