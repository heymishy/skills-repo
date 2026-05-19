# Test Plan: Guided question form

**Story:** wuce.24 — Guided question form
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Test file:** `tests/check-wuce24-guided-question-form.js`
**Total tests:** 18
**Passing at plan-write time:** 0 (tests written to fail — TDD)
**Review artefact:** review/wuce.24-guided-question-form-review-1.md

---

## Test data strategy

Mock `getNextQuestion(skillName, sessionId, token)`:
- Standard path: returns `{ question: 'What problem are you solving?', questionIndex: 1, totalQuestions: 5 }`
- Terminal path (no more questions): returns `null`
- Unknown session: throws with status 404

Mock `submitAnswer(skillName, sessionId, answer, token)`:
- Standard path: returns `{ nextUrl: '/skills/discovery/sessions/sess-abc/next' }`
- Terminal path: returns `{ nextUrl: '/skills/discovery/sessions/sess-abc/commit-preview' }`

All HTTP tests use `NODE_ENV=test` auth bypass. Session ID `sess-abc123`.

---

## Tests

### T1 — Integration: GET /skills/:name/sessions/:id/next → 200 question form

**AC:** AC1
**Type:** HTTP integration

```
GET /skills/discovery/sessions/sess-abc123/next (authenticated)

Expected:
  Status: 200
  Content-Type: text/html; charset=utf-8
  Body includes: <!doctype html
```

---

### T2 — Integration: HTML — question text displayed

**AC:** AC1
**Type:** HTTP integration

```
Body includes: What problem are you solving?
```

---

### T3 — Integration: HTML — form has correct action URL and method POST

**AC:** AC2
**Type:** HTTP integration

```
Body includes: action="/api/skills/discovery/sessions/sess-abc123/answer"
Body includes: method="POST"
```

---

### T4 — Integration: HTML — textarea with name="answer" present

**AC:** AC2
**Type:** HTTP integration

```
Body includes: <textarea
Body includes: name="answer"
```

---

### T5 — Integration: HTML — submit button with correct text

**AC:** AC2
**Type:** HTTP integration

```
Body includes: <button type="submit">Submit answer</button>
```

---

### T6 — Integration: HTML — textarea has associated <label>

**AC:** AC7 / WCAG AA
**Type:** HTTP integration

```
Body includes: <label
Body includes: for="answer"  (or label wraps textarea)
```

---

### T7 — Integration: POST /api/skills/:name/sessions/:id/answer → 303 to next question

**AC:** AC3
**Type:** HTTP integration (standard path — more questions)

```
POST /api/skills/discovery/sessions/sess-abc123/answer
Body: answer=My+answer

Expected:
  Status: 303
  Location: /skills/discovery/sessions/sess-abc/next
```

---

### T8 — Integration: POST answer when terminal (no more questions) → 303 to commit-preview

**AC:** AC4
**Type:** HTTP integration (submitAnswer returns commit-preview URL)

```
POST /api/skills/discovery/sessions/sess-abc123/answer
Body: answer=Final+answer

Expected:
  Status: 303
  Location: /skills/discovery/sessions/sess-abc/commit-preview
```

---

### T9 — Integration: GET next with unknown session ID → 404 HTML page

**AC:** AC5
**Type:** HTTP integration (getNextQuestion throws 404)

```
GET /skills/discovery/sessions/unknown-sess-id/next

Expected:
  Status: 404
  Content-Type: text/html; charset=utf-8
  Body includes: <nav aria-label="Main navigation">
  Body does NOT include: {"error":
```

---

### T10 — Integration: POST answer with unknown session ID → 404 HTML page

**AC:** AC5
**Type:** HTTP integration

```
POST /api/skills/discovery/sessions/unknown-sess-id/answer

Expected:
  Status: 404
  Content-Type: text/html; charset=utf-8
  Body does NOT include: {"error":
```

---

### T11 — Integration: GET next — XSS in question text escaped

**AC:** AC6
**Type:** HTTP integration (question: '<script>alert(1)</script>')

```
Body does NOT include: <script>alert(1)</script>
Body includes: &lt;script&gt;
```

---

### T12 — Integration: POST answer — session ID validated server-side

**AC:** AC5 / security
**Type:** HTTP integration (session ID from URL must match session store)

```
POST /api/skills/discovery/sessions/not-a-real-session/answer
Body: answer=hacked

Expected:
  Status: 404 or 403
  Not 200, not 303
```

---

### T13 — Integration: GET /skills/:name/sessions/:id/next unauthenticated → 302

**AC:** AC1 / authGuard
**Type:** HTTP integration (no session)

```
Expected:
  Status: 302
  Location: /auth/github
```

---

### T14 — Integration: POST answer unauthenticated → 302

**AC:** authGuard regression
**Type:** HTTP integration (no session)

```
Expected:
  Status: 302
```

---

### T15 — Integration: HTML form requires no JavaScript

**AC:** AC2 / NFR
**Type:** HTTP integration — structural

```
Body does NOT include: onclick= on form elements
Body does NOT include: addEventListener
<form method="POST" and action=" present — no JS required
```

---

### T16 — Integration: question progress indicator displayed

**AC:** AC1
**Type:** HTTP integration (questionIndex: 1, totalQuestions: 5)

```
Body includes: 1  (question progress displayed, e.g. "Question 1 of 5")
Body includes: 5
```

---

### T17 — Integration: handleGetQuestionHtml is a named export from routes/skills.js

**AC:** NFR / ADR-009
**Type:** Static analysis

```
grep "handleGetQuestionHtml" src/web-ui/routes/skills.js returns one export
```

---

### T18 — Integration: audit log written on GET next

**AC:** NFR audit
**Type:** HTTP integration

```
Audit log called with { userId, route: '/skills/:name/sessions/:id/next', skillName: 'discovery', sessionId: 'sess-abc123', timestamp }
```

---

## Gap table

| Gap | AC | Severity | Reason | Mitigation |
|-----|----|----------|--------|------------|
| No E2E needed | — | — | No CSS/layout dependencies | None |

---

## Test coverage map

| AC | Tests |
|----|-------|
| AC1 | T1, T2, T16 |
| AC2 | T3, T4, T5, T15 |
| AC3 | T7 |
| AC4 | T8 |
| AC5 | T9, T10, T12 |
| AC6 | T11 |
| AC7 | T6 |
