# Definition of Ready: Action queue HTML view

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.21 — Action queue HTML view
**Epic:** E5 — HTML Frontend Layer (E5 Read Views)
**DoR run date:** 2026-05-03
**Reviewer:** Agent (automated check)

---

## Hard Blocks

| Block | Description | Status | Notes |
|-------|-------------|--------|-------|
| H1 | User story follows As/Want/So that format | PASS | "As an operator using the platform in a browser / I want GET /actions to return an HTML page showing pending actions / So that I can action pipeline tasks without leaving the browser." |
| H2 | All ACs written in Given/When/Then with ≥3 ACs | PASS | 6 ACs, all in GWT format |
| H3 | Every AC has at least one test in the test plan | PASS | 16 tests in wuce.21 test plan; each AC covered |
| H4 | Out of scope section declared and non-trivial | PASS | Dismissing actions, action assignment, notification emails, action creation, JSON shape changes to /api/actions explicitly excluded |
| H5 | Benefit linkage names a specific metric | PASS | P5 — Operator self-service HTML completion rate |
| H6 | Complexity rated and scope stability declared | PASS | Complexity 1 / Stable |
| H7 | No HIGH review findings open | PASS | reviewStatus: passed, highFindings: 0 |
| H8 | Every AC is traceable to at least one test | PASS | AC1: T1–T5,T15; AC2: T6; AC3: T7,T8,T16; AC4: T9,T10; AC5: T11; AC6: T12 |
| H8-ext | No unresolved schemaDepends declarations | N/A | No schema field dependencies declared |
| H9 | Architecture constraints populated and reference guardrails | PASS | ADR-009 (new handleGetActionsHtml in routes/dashboard.js), ADR-012 (getPendingActions adapter), AC6 nav routing constraint |
| H-E2E | CSS-layout-dependent ACs have E2E tests | N/A | No CSS-layout-dependent ACs |
| H-NFR | NFRs declared for each active category | PASS | Security (escHtml), Accessibility (WCAG 2.1 AA), Audit |
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

**High** — inherited from Epic E5. Human review required before PR merge. Named sign-off: Hamish King.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Action queue HTML view — artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.21-action-queue-html-view.md
Test plan: artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.21-action-queue-html-view-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Runtime: Node.js v22, CommonJS (require), raw http.createServer — no Express
- Test runner: node tests/check-wuce21-action-queue-html.js
- ADR-009: add handleGetActionsHtml() as a new named export in src/web-ui/routes/dashboard.js
  - GET /actions → HTML response using renderShell wrapping the action queue HTML
  - GET /api/actions → JSON response unchanged — do not modify existing handler
- Import renderShell() from src/web-ui/utils/html-shell.js
- Import escHtml() from src/web-ui/utils/html-shell.js — apply to all title, feature, and actionType values
- ADR-012: call getPendingActions(userIdentity, token) from adapters/action-queue.js — no inline fetch
- Export renderActionQueue(actions) from adapters/action-queue.js if not already exported
- Zero actions → empty-state message, no empty <ul>
- AC6: renderShell nav "Actions" link must point to /actions (not /api/actions)
- authGuard: unauthenticated → 302 on both /actions and /api/actions
- Audit log: { userId, route: '/actions', timestamp }
- Open a draft PR when all 16 tests pass — do not mark ready for review
- Oversight level: High — add PR comment confirming named sign-off from Hamish King
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment and do not mark ready for review
```

---

## Sign-off

**DoR status: Signed off**
**Date:** 2026-05-03
**Contract artefact:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.21-action-queue-html-view-dor-contract.md
