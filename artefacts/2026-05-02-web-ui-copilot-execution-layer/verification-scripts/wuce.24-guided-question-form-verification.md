# Verification Script: Guided question form

**Story:** wuce.24 — Guided question form
**For:** Human reviewer / smoke-test operator after merge

---

## Pre-conditions

- Application running with `node --env-file=.env src/web-ui/server.js`
- `tests/check-wuce24-guided-question-form.js` committed
- At least one active skill session available

---

## AC1 — GET /skills/:name/sessions/:id/next renders question form

**Automated check:**
```bash
node tests/check-wuce24-guided-question-form.js
```
T1, T2, T16 must pass.

**Manual smoke check:**
1. Start a skill session via `/skills` → click "Start" on a skill
2. Navigate to the question URL
3. Confirm question text is displayed, progress indicator visible (e.g. "Question 1 of 5")

---

## AC2 — Form structure: POST action, textarea[name=answer], submit button

**Automated check:** T3, T4, T5, T15

**Manual smoke check:**
1. View page source at `/skills/:name/sessions/:id/next`
2. Confirm `<form method="POST" action="/api/skills/:name/sessions/:id/answer">`
3. Confirm `<textarea name="answer">` present
4. Confirm `<button type="submit">Submit answer</button>` present
5. Disable JavaScript — confirm form still submits and next question loads

---

## AC3 — Submit answer → 303 to next question URL

**Automated check:** T7

---

## AC4 — Final answer → 303 to commit-preview

**Automated check:** T8

**Manual smoke check:**
1. Complete all questions in a skill session
2. On final answer submit — confirm you are redirected to the commit-preview page, not another question

---

## AC5 — Unknown session ID → 404 HTML page

**Automated check:** T9, T10, T12

**Manual smoke check:**
1. Navigate to `/skills/discovery/sessions/notarealsession/next`
2. Confirm 404 HTML page with nav shell renders (not raw JSON, not a 500 error)

---

## AC6 — XSS in question text escaped

**Automated check:** T11

---

## AC7 — textarea has associated <label>

**Automated check:** T6

**Manual smoke check:**
1. Load question form in browser
2. Open DevTools → Accessibility inspector
3. Confirm textarea has accessible label
4. Or: view source — confirm `<label for="answer">` (or equivalent wrapper) present

---

## NFR checks

| NFR | Check |
|-----|-------|
| `handleGetQuestionHtml` named export in `routes/skills.js` (ADR-009) | T17 automated |
| No inline fetch (ADR-012) | `grep -n "https\.\|fetch(" src/web-ui/routes/skills.js` — no inline calls |
| Session ID validated server-side | T12 automated |
| Audit log written | T18 automated |
