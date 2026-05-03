# Contract: Guided question form

**Story:** wuce.24
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-03

---

## Components built by this story

- Added to `src/web-ui/routes/skills.js`:
  - `handleGetQuestionHtml(req, res)` — named export; handles `GET /skills/:name/sessions/:id/next` → question form HTML via `renderShell`
  - POST answer handler for `POST /api/skills/:name/sessions/:id/answer` → submits answer; 303 redirect to next question URL (or commit-preview on terminal state)
- Question form HTML:
  - `<form method="POST" action="/api/skills/:name/sessions/:id/answer">`
  - `<textarea name="answer">` with associated `<label>` (for/id or wrapping label)
  - `<button type="submit">Submit answer</button>`
  - Plain HTML — NO JavaScript added
- Server-side session ID validation before any adapter call — unknown ID → 404 HTML page
- Terminal state (no more questions) → 303 to `/skills/:name/sessions/:id/commit-preview`
- Audit log: `{ userId, route: '/skills/:name/sessions/:id/next', skillName, sessionId, timestamp }`

## Components NOT built by this story

- Commit preview or result pages (wuce.25 scope)
- Multi-answer or branching question logic
- Session resume from browser close
- Answer history view
- Any change to `src/web-ui/utils/html-shell.js`
- Any change to `GET /skills` handler (wuce.23 scope)

## AC → Test mapping

| AC | Description | Tests |
|----|-------------|-------|
| AC1 | GET /skills/:name/sessions/:id/next → 200 HTML with question form | T1: 200 status, T2: Content-Type text/html, T16: <html> present |
| AC2 | Form contains textarea with label, submit button, correct action attribute | T3: <textarea name="answer"> present, T4: <label> associated, T5: submit button present, T15: form action correct |
| AC3 | POST answer → 303 to next question URL | T7: 303 status, T8: Location header correct |
| AC4 | Terminal state (no more questions) → 303 to commit-preview | T8: Location = /skills/:name/sessions/:id/commit-preview on terminal state |
| AC5 | Unknown session ID → 404 HTML page | T9: unknown session → 404, T10: response is HTML not JSON, T12: Content-Type text/html |
| AC6 | Unauthenticated → 302 on GET and POST | T11: GET no session → 302 |
| AC7 | Question text rendered with escHtml | T6: question text in HTML body, escaped |

## Assumptions

- `getNextQuestion(skillName, sessionId, token)` adapter exists or is created as part of this story
- `submitAnswer(skillName, sessionId, answer, token)` adapter exists or is created as part of this story
- `renderShell` and `escHtml` exist from wuce.18 — imported, not created here
- Session ID format and validation rules are defined by the adapter (server-side check is: call getNextQuestion and treat unknown-session error as 404)

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/web-ui/routes/skills.js` | Extend | Add handleGetQuestionHtml() and POST answer handler |
| `src/web-ui/adapters/skills.js` | Extend | Add getNextQuestion() and submitAnswer() if not already present |
| `src/web-ui/server.js` | Extend | Mount GET /skills/:name/sessions/:id/next and POST /api/skills/:name/sessions/:id/answer |
| `tests/check-wuce24-guided-question-form.js` | Create | 18 tests |

## Out of scope — files that MUST NOT be touched

- `handleGetSkillsHtml()` in skills.js (wuce.23 scope — do not modify)
- Commit preview and result handlers (wuce.25 scope)
- `src/web-ui/utils/html-shell.js`
- Any test file other than `tests/check-wuce24-guided-question-form.js`
- Any file under `artefacts/`

## Contract review

**APPROVED** — all components are within story scope, AC → test mapping is complete, no scope boundary violations identified.
