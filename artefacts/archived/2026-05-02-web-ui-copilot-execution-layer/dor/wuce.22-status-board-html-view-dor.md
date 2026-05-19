# Definition of Ready: Status board HTML view

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.22 — Status board HTML view
**Epic:** E5 — HTML Frontend Layer (E5 Read Views)
**DoR run date:** 2026-05-03
**Reviewer:** Agent (automated check)

---

## Hard Blocks

| Block | Description | Status | Notes |
|-------|-------------|--------|-------|
| H1 | User story follows As/Want/So that format | PASS | "As an operator opening the status page in a browser / I want GET /status to return an HTML status board / So that I can see pipeline health at a glance without parsing JSON." |
| H2 | All ACs written in Given/When/Then with ≥3 ACs | PASS | 6 ACs, all in GWT format |
| H3 | Every AC has at least one test in the test plan | PASS | 16 tests in wuce.22 test plan; each AC covered |
| H4 | Out of scope section declared and non-trivial | PASS | Editing status, historical trend charts, interactive filtering, /status/export format changes explicitly excluded |
| H5 | Benefit linkage names a specific metric | PASS | P5 — Operator self-service HTML completion rate |
| H6 | Complexity rated and scope stability declared | PASS | Complexity 1 / Stable |
| H7 | No HIGH review findings open | PASS | reviewStatus: passed, highFindings: 0 |
| H8 | Every AC is traceable to at least one test | PASS | AC1: T1–T4,T14; AC2: T7,T8; AC3: T5,T6; AC4: T9,T10; AC5: T11; AC6: T12,T13 |
| H8-ext | No unresolved schemaDepends declarations | N/A | No schema field dependencies declared |
| H9 | Architecture constraints populated and reference guardrails | PASS | ADR-009 (content-type negotiation within handleGetStatus), AC6 /status/export regression constraint |
| H-E2E | CSS-layout-dependent ACs have E2E tests | N/A | No CSS-layout-dependent ACs (AC3 text-label approach eliminates layout dependency) |
| H-NFR | NFRs declared for each active category | PASS | Security (escHtml), Accessibility (WCAG 2.1 AA — text labels not colour-only), Audit |
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
| W5 | No UNCERTAIN items in test plan gap table | ✅ | No UNCERTAIN items (colour rendering gap is LOW, mitigated by text labels) |

**Warnings: W4 acknowledged — proceed.**

---

## Oversight Level

**High** — inherited from Epic E5. Human review required before PR merge. Named sign-off: Hamish King.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Status board HTML view — artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.22-status-board-html-view.md
Test plan: artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.22-status-board-html-view-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Runtime: Node.js v22, CommonJS (require), raw http.createServer — no Express
- Test runner: node tests/check-wuce22-status-board-html.js
- Extend handleGetStatus() in src/web-ui/routes/status.js with content-type negotiation:
  - Accept: text/html → renderShell wrapping status board HTML
  - Accept: application/json or no header → JSON unchanged
  - Do NOT split into two separate handlers (ADR-009 allows in-place extension for content negotiation)
- Import renderShell() from src/web-ui/utils/html-shell.js
- Import escHtml() from src/web-ui/utils/html-shell.js — apply to all slug, phase, health values
- Import renderStatusBoard(statusData) from utils/status-board.js — export if not already exported; do not inline
- AC3: health indicators must include BOTH a colour class AND a text label ("Blocked", "At risk", "On track", "In progress") — never colour-only
- GET /status/export: must remain completely unchanged (regression guard)
- authGuard: unauthenticated → 302
- Audit log: { userId, route: '/status', timestamp }
- Open a draft PR when all 16 tests pass — do not mark ready for review
- Oversight level: High — add PR comment confirming named sign-off from Hamish King
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment and do not mark ready for review
```

---

## Sign-off

**DoR status: Signed off**
**Date:** 2026-05-03
**Contract artefact:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.22-status-board-html-view-dor-contract.md
