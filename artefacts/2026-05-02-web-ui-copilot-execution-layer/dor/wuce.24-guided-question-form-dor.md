# Definition of Ready: Guided question form

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.24 — Guided question form
**Epic:** E6 — HTML Frontend Layer (E6 Skill Execution Forms)
**DoR run date:** 2026-05-03
**Reviewer:** Agent (automated check)

---

## Hard Blocks

| Block | Description | Status | Notes |
|-------|-------------|--------|-------|
| H1 | User story follows As/Want/So that format | PASS | "As an operator running a skill session in the browser / I want GET /skills/:name/sessions/:id/next to render a question form / So that I can progress through a guided skill execution without using the CLI." |
| H2 | All ACs written in Given/When/Then with ≥3 ACs | PASS | 7 ACs, all in GWT format |
| H3 | Every AC has at least one test in the test plan | PASS | 18 tests in wuce.24 test plan; each AC covered |
| H4 | Out of scope section declared and non-trivial | PASS | Multi-answer questions, branching logic, session resume from browser close, answer history, session timeout UX explicitly excluded |
| H5 | Benefit linkage names a specific metric | PASS | P5 — Operator self-service HTML completion rate |
| H6 | Complexity rated and scope stability declared | PASS | Complexity 2 / Stable |
| H7 | No HIGH review findings open | PASS | reviewStatus: passed, highFindings: 0 |
| H8 | Every AC is traceable to at least one test | PASS | AC1: T1,T2,T16; AC2: T3,T4,T5,T15; AC3: T7; AC4: T8; AC5: T9,T10,T12; AC6: T11; AC7: T6 |
| H8-ext | No unresolved schemaDepends declarations | N/A | No schema field dependencies declared |
| H9 | Architecture constraints populated and reference guardrails | PASS | ADR-009, ADR-012; session ID server-side validation constraint; plain form no JavaScript |
| H-E2E | CSS-layout-dependent ACs have E2E tests | N/A | No CSS-layout-dependent ACs |
| H-NFR | NFRs declared for each active category | PASS | Security (XSS + server-side session validation), Accessibility (WCAG 2.1 AA — label associated with textarea), Audit |
| H-NFR2 | Compliance NFR with regulatory clause has human sign-off | N/A | No regulatory compliance clauses |
| H-NFR3 | Data classification not blank in NFR profile | PASS | NFR profile exists |
| H-NFR-profile | Feature-level NFR profile exists | PASS | artefacts/2026-05-02-web-ui-copilot-execution-layer/nfr-profile.md |
| H-GOV | Discovery approved by named non-engineering approver | PASS | Hamish King and Jenni Ralph — 2026-05-02 |

**Hard block result: ALL PASS — proceed to warnings.**

---

## Warnings

| Warning | Description | Status | Notes |
|---------|-------------|--------|-------|
| W1 | New pipeline-state.json fields require schema update first | N/A | No new fields |
| W2 | Scope stability is Unstable | N/A | Scope stability is Stable |
| W3 | MEDIUM review findings acknowledged | ✅ | No MEDIUM findings |
| W4 | Verification script reviewed by domain expert | ⚠️ | Verification script exists; domain expert review not recorded |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | No UNCERTAIN items |

**Warnings: W4 acknowledged — proceed.**

---

## Oversight Level

**High** — inherited from Epic E6. Human review required before PR merge. Named sign-off: Hamish King.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Guided question form — artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.24-guided-question-form.md
Test plan: artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.24-guided-question-form-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Runtime: Node.js v22, CommonJS (require), raw http.createServer — no Express
- Test runner: node tests/check-wuce24-guided-question-form.js
- Add to src/web-ui/routes/skills.js:
  - handleGetQuestionHtml(req, res) — named export
  - handles GET /skills/:name/sessions/:id/next
  - POST handler for /api/skills/:name/sessions/:id/answer → submitAnswer(), 303 redirect
- Session ID must be validated server-side before calling any adapter — unknown session → 404 HTML page
- Form structure required:
  - <form method="POST" action="/api/skills/:name/sessions/:id/answer">
  - <textarea name="answer"> with associated <label for="answer"> (or wrapping label)
  - <button type="submit">Submit answer</button>
  - Plain HTML — NO JavaScript required or added
- ADR-012: getNextQuestion(skillName, sessionId, token) and submitAnswer(skillName, sessionId, answer, token) via adapters — no inline fetch
- Terminal state (no more questions): 303 to /skills/:name/sessions/:id/commit-preview
- All errors (404 unknown session, adapter errors) → renderShell HTML error page (not raw JSON)
- Import renderShell() and escHtml() from src/web-ui/utils/html-shell.js
- authGuard on both GET and POST — unauthenticated → 302
- Audit log: { userId, route: '/skills/:name/sessions/:id/next', skillName, sessionId, timestamp }
- Open a draft PR when all 18 tests pass — do not mark ready for review
- Oversight level: High — add PR comment confirming named sign-off from Hamish King
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment and do not mark ready for review
```

---

## Sign-off

**DoR status: Signed off**
**Date:** 2026-05-03
**Contract artefact:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.24-guided-question-form-dor-contract.md
