# Review: Guided question form

**Story:** wuce.24 — Guided question form
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Epic:** E6 — Skill launcher HTML form
**Review date:** 2026-05-03
**Reviewer:** Agent (automated check)
**Review pass:** 1

---

## Category A — AC completeness and testability

| Finding | Severity | Detail |
|---------|----------|--------|
| All 7 ACs in Given/When/Then format | ✅ PASS | — |
| AC1 specifies form structure — question text, `<form>`, `<textarea name="answer">`, `<button type="submit">` | ✅ PASS | Testable via jsdom |
| AC2 answer submission → 303 redirect to next question URL | ✅ PASS | HTTP integration test assertable |
| AC3 non-2xx answer submission → HTML error page, not raw JSON | ✅ PASS | Error handling scenario with recovery link |
| AC4 terminal state → 303 redirect to commit-preview (not empty form) | ✅ PASS | State-machine boundary clearly specified |
| AC5 unknown session ID → 404 HTML page | ✅ PASS | Security boundary explicitly specified |
| AC6 XSS — question text escaped | ✅ PASS | Question text from API treated as untrusted |
| AC7 unauthenticated → 302 | ✅ PASS | — |

**Category verdict: PASS**

---

## Category B — Architecture and constraint compliance

| Finding | Severity | Detail |
|---------|----------|--------|
| ADR-012: `handleGetSessionState()` (wuce.14/16) reused for data | ✅ PASS | No inline API calls |
| ADR-009: `handleGetQuestionHtml()` added in `routes/skills.js` | ✅ PASS | Handler separation maintained |
| POST answers to existing `POST /api/skills/:name/sessions/:id/answer` (wuce.15) | ✅ PASS | Handler already exists |
| Server-side 303 redirect — not client-side JSON parse | ✅ PASS | — |
| Plain `<form method="POST">` — no JavaScript for baseline | ✅ PASS | — |
| Session ID validated against known sessions before serving | ✅ PASS | Security constraint stated; AC5 enforces it |
| `escHtml()` on question text and all session state values | ✅ PASS | Untrusted input classification explicit |
| Terminal state redirects to commit-preview (wuce.25) | ✅ PASS | State boundary defined |
| WCAG: `<textarea>` has associated `<label>`; submit button descriptive | ✅ PASS | NFR specifies label association |

**Category verdict: PASS**

---

## Category C — Scope and out-of-scope discipline

| Finding | Severity | Detail |
|---------|----------|--------|
| Out of scope declared and non-trivial | ✅ PASS | Back-navigation, JS enhancement, artefact preview inline, multi-question forms, API shape change excluded |
| One question per page — matches underlying API contract | ✅ PASS | Not a constraint violation; constraint enforced |

**Category verdict: PASS**

---

## Category D — Dependency and sequencing

| Finding | Severity | Detail |
|---------|----------|--------|
| Upstream wuce.13 (session management), wuce.14 (preview), wuce.15 (answer API), wuce.16 (persistence) merged | ✅ PASS | All upstream handlers exist |
| Upstream wuce.18 (HTML shell) and wuce.23 (session start) must be merged first | ✅ PASS | Entry point via wuce.23 redirect |
| Downstream wuce.25 (commit preview) receives terminal redirect | ✅ PASS | — |

**Category verdict: PASS**

---

## Category E — NFR coverage

| Finding | Severity | Detail |
|---------|----------|--------|
| Security — question text and session state escaped; session ID validated server-side | ✅ PASS | — |
| Performance — one API call per page, no extra round-trips | ✅ PASS | — |
| Accessibility — `<label>` for textarea; logical keyboard order; descriptive submit button | ✅ PASS | — |
| Audit — GET question view logged (userId, sessionId, route, timestamp) | ✅ PASS | Answer submission logging by wuce.15 already covers that path |

**Category verdict: PASS**

---

## Summary

| Category | Result |
|----------|--------|
| A — AC completeness | PASS |
| B — Architecture | PASS |
| C — Scope | PASS |
| D — Dependencies | PASS |
| E — NFRs | PASS |

**HIGH findings:** 0
**MEDIUM findings:** 0
**LOW findings:** 0

**Overall verdict: PASS** — story may proceed to test-plan.
