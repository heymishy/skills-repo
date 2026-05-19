# Definition of Ready: HTML shell and navigation

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.18 — HTML shell and navigation
**Epic:** E5 — HTML Frontend Layer (E5 Read Views)
**DoR run date:** 2026-05-03
**Reviewer:** Agent (automated check)

---

## Hard Blocks

| Block | Description | Status | Notes |
|-------|-------------|--------|-------|
| H1 | User story follows As/Want/So that format | PASS | "As an operator using the platform in a browser / I want a shared HTML shell with navigation and identity display / So that every page has consistent structure and I can reach Features, Actions, Status, and Run a Skill from any page." |
| H2 | All ACs written in Given/When/Then with ≥3 ACs | PASS | 5 ACs, all in GWT format |
| H3 | Every AC has at least one test in the test plan | PASS | 20 tests in wuce.18 test plan (18 unit/integration + 2 Playwright E2E); each AC covered |
| H4 | Out of scope section declared and non-trivial | PASS | Custom per-page styling, active nav state highlighting, mobile/responsive layout, dark mode, accessibility beyond keyboard nav explicitly excluded |
| H5 | Benefit linkage names a specific metric | PASS | P5 — Operator self-service HTML completion rate |
| H6 | Complexity rated and scope stability declared | PASS | Complexity 1 / Stable |
| H7 | No HIGH review findings open | PASS | reviewStatus: passed, highFindings: 0 (1 MEDIUM acknowledged) |
| H8 | Every AC is traceable to at least one test | PASS | AC1: T2,T9; AC2: T10; AC3: T1–T8; AC4: T6,T18; AC5: T19,T20 |
| H8-ext | No unresolved schemaDepends declarations | N/A | No schema field dependencies declared |
| H9 | Architecture constraints populated and reference guardrails | PASS | ADR-004, ADR-009, ADR-012, ADR-018; `escHtml()` canonical location constraint |
| H-E2E | CSS-layout-dependent ACs have E2E tests | PASS | AC5 (keyboard focus styling) covered by T19–T20 in `tests/e2e/wuce18-keyboard-nav.spec.ts` |
| H-NFR | NFRs declared for each active category | PASS | Security (XSS via `escHtml()`), Accessibility (WCAG 2.1 AA — `<nav aria-label>`, `<main>`, `<header>`), Audit |
| H-NFR2 | Compliance NFR with regulatory clause has human sign-off | N/A | No regulatory compliance clauses |
| H-NFR3 | Data classification not blank in NFR profile | PASS | NFR profile exists at `artefacts/2026-05-02-web-ui-copilot-execution-layer/nfr-profile.md` |
| H-NFR-profile | Feature-level NFR profile exists | PASS | artefacts/2026-05-02-web-ui-copilot-execution-layer/nfr-profile.md |
| H-GOV | Discovery approved by named non-engineering approver | PASS | Hamish King (Chief Product Guru) and Jenni Ralph (Chief Product Guru) — 2026-05-02 |

**Hard block result: ALL PASS — proceed to warnings.**

---

## Warnings

| Warning | Description | Status | Notes |
|---------|-------------|--------|-------|
| W1 | New pipeline-state.json fields require schema update first | N/A | No new fields beyond established schema |
| W2 | Scope stability is Unstable | N/A | Scope stability is Stable |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | 1 MEDIUM finding (AC5 CSS-dependent) — covered by Playwright E2E tests T19–T20 in test plan |
| W4 | Verification script reviewed by domain expert | ⚠️ | Verification script exists; domain expert review not recorded — operator should confirm before dispatch |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table contains one LOW gap (AC5) mitigated by E2E tests — no UNCERTAIN items |

**Warnings: W3 and W4 acknowledged — proceed.**

---

## Oversight Level

**High** — inherited from Epic E5 (HTML Frontend Layer). Human review required before PR merge. Named sign-off: Hamish King.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: HTML shell and navigation — artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.18-html-shell-navigation.md
Test plan: artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.18-html-shell-navigation-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Runtime: Node.js v22, CommonJS (require), raw http.createServer — no Express
- Test runner: node tests/check-wuce18-html-shell.js (no Jest); E2E: npx playwright test tests/e2e/ (ADR-018: npm test must NOT invoke Playwright)
- Create src/web-ui/utils/html-shell.js with:
  - renderShell({ title, bodyContent, user }) — synchronous, returns complete HTML string
  - escHtml(str) — canonical XSS-escaping function; ALL other modules must import from here — do NOT duplicate
- Structural elements required: <!doctype html>, <html>, <head>, <title>, <body>, <header>, <nav aria-label="Main navigation">, <main>
- Nav links: Features → /features, Actions → /actions, Status → /status, Run a Skill → /skills
- GET /dashboard: apply authGuard (unauthenticated → 302 /auth/github), return renderShell with user login in <header>
- XSS: all user-supplied values (login name etc.) must be passed through escHtml() before insertion into HTML
- ADR-009: GET /dashboard handler must be a named export — do not inline in server.js
- ADR-018: E2E spec at tests/e2e/wuce18-keyboard-nav.spec.ts — Playwright only, not in npm test chain
- WCAG 2.1 AA: nav must have aria-label="Main navigation"; main and header elements must be present
- Audit log required: write { userId, route: '/dashboard', timestamp } to audit log on every authenticated request
- Architecture guardrails: read .github/architecture-guardrails.md before implementing
- Open a draft PR when all 18 unit/integration tests pass — do not mark ready for review
- Oversight level: High — add a PR comment confirming: (1) named sign-off obtained from Hamish King; (2) escHtml() is defined exactly once in html-shell.js and imported by all other modules
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review
```

---

## Sign-off

**DoR status: Signed off**
**Date:** 2026-05-03
**Contract artefact:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.18-html-shell-navigation-dor-contract.md
