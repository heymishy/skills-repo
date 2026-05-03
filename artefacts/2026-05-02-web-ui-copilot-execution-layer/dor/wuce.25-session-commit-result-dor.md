# Definition of Ready: Session commit result

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.25 — Session commit result
**Epic:** E6 — HTML Frontend Layer (E6 Skill Execution Forms)
**DoR run date:** 2026-05-03
**Reviewer:** Agent (automated check)

---

## Hard Blocks

| Block | Description | Status | Notes |
|-------|-------------|--------|-------|
| H1 | User story follows As/Want/So that format | PASS | "As an operator completing a skill session in the browser / I want a commit-preview, commit action, and result page / So that I can review and publish the generated artefact without leaving the browser." |
| H2 | All ACs written in Given/When/Then with ≥3 ACs | PASS | 7 ACs, all in GWT format |
| H3 | Every AC has at least one test in the test plan | PASS | 20 tests in wuce.25 test plan; each AC covered |
| H4 | Out of scope section declared and non-trivial | PASS | Artefact editing before commit, diff view, multi-artefact sessions, commit history, rollback, push-to-GitHub explicitly excluded |
| H5 | Benefit linkage names a specific metric | PASS | P5 — Operator self-service HTML completion rate |
| H6 | Complexity rated and scope stability declared | PASS | Complexity 2 / Stable |
| H7 | No HIGH review findings open | PASS | reviewStatus: passed, highFindings: 0 |
| H8 | Every AC is traceable to at least one test | PASS | AC1: T1,T2,T3; AC2: T4,T5; AC3: T6–T10; AC4: T11; AC5: T15,T16; AC6: T17,T18; AC7: T12,T13,T14 |
| H8-ext | No unresolved schemaDepends declarations | N/A | No schema field dependencies declared |
| H9 | Architecture constraints populated and reference guardrails | PASS | ADR-009, ADR-012; double-commit 409 HTML response constraint; session ID server-side validation; WCAG `<pre role="region" aria-label>` |
| H-E2E | CSS-layout-dependent ACs have E2E tests | N/A | No CSS-layout-dependent ACs |
| H-NFR | NFRs declared for each active category | PASS | Security (escHtml in <pre>, server-side session validation), Accessibility (WCAG 2.1 AA — pre with role/aria-label), Audit |
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
Story: Session commit result — artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.25-session-commit-result.md
Test plan: artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.25-session-commit-result-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Runtime: Node.js v22, CommonJS (require), raw http.createServer — no Express
- Test runner: node tests/check-wuce25-session-commit-result.js
- Add to src/web-ui/routes/skills.js:
  - handleGetCommitPreviewHtml(req, res) — named export; handles GET /skills/:name/sessions/:id/commit-preview
  - handlePostCommitHtml(req, res) — named export; handles POST /api/skills/:name/sessions/:id/commit → 303 to result
  - handleGetResultHtml(req, res) — named export; handles GET /skills/:name/sessions/:id/result
- Session ID must be validated server-side before calling any adapter — unknown session → 404 HTML page
- Commit-preview page:
  - Artefact content in <pre role="region" aria-label="Artefact preview"> (WCAG — required)
  - Commit form: <form method="POST" action="/api/skills/:name/sessions/:id/commit"> with submit button
  - Plain HTML — NO JavaScript required or added
- Result page must contain: success message, artefact path, link to /artefact/:slug/:type, link to /features
- Double-commit (409): return 409 HTML page via renderShell — not raw JSON
- All errors (404 unknown session, 409 double-commit) → renderShell HTML error page with informative message
- Import renderShell() and escHtml() from src/web-ui/utils/html-shell.js
- escHtml() applied to artefactContent in <pre> and to artefactPath in all HTML output
- ADR-012: getCommitPreview(), commitSession(), getCommitResult() via adapters — no inline fetch
- authGuard on all three endpoints — unauthenticated → 302
- Audit log on POST commit: { userId, route: '/api/skills/:name/sessions/:id/commit', skillName, sessionId, artefactPath, timestamp }
- Open a draft PR when all 20 tests pass — do not mark ready for review
- Oversight level: High — add PR comment confirming named sign-off from Hamish King
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment and do not mark ready for review
```

---

## Sign-off

**DoR status: Signed off**
**Date:** 2026-05-03
**Contract artefact:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.25-session-commit-result-dor-contract.md
