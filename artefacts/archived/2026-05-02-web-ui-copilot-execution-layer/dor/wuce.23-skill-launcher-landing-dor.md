# Definition of Ready: Skill launcher landing

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.23 — Skill launcher landing
**Epic:** E6 — HTML Frontend Layer (E6 Skill Execution Forms)
**DoR run date:** 2026-05-03
**Reviewer:** Agent (automated check)

---

## Hard Blocks

| Block | Description | Status | Notes |
|-------|-------------|--------|-------|
| H1 | User story follows As/Want/So that format | PASS | "As an operator using the platform in a browser / I want GET /skills to show all available skills with a Start button / So that I can launch a skill session without editing JSON or using the CLI." |
| H2 | All ACs written in Given/When/Then with ≥3 ACs | PASS | 6 ACs, all in GWT format |
| H3 | Every AC has at least one test in the test plan | PASS | 16 tests in wuce.23 test plan; each AC covered |
| H4 | Out of scope section declared and non-trivial | PASS | Skill execution progress, session resume, skill management, skill configuration editing, JS-dependent UX explicitly excluded |
| H5 | Benefit linkage names a specific metric | PASS | P5 — Operator self-service HTML completion rate |
| H6 | Complexity rated and scope stability declared | PASS | Complexity 2 / Stable |
| H7 | No HIGH review findings open | PASS | reviewStatus: passed, highFindings: 0 |
| H8 | Every AC is traceable to at least one test | PASS | AC1: T1–T4; AC2: T5,T6,T7,T14; AC3: T8; AC4: T9,T10; AC5: T11,T12; AC6: T13 |
| H8-ext | No unresolved schemaDepends declarations | N/A | No schema field dependencies declared |
| H9 | Architecture constraints populated and reference guardrails | PASS | ADR-009 (handleGetSkillsHtml separate from JSON handler), ADR-012 (listSkills adapter), plain `<form>` no JavaScript constraint |
| H-E2E | CSS-layout-dependent ACs have E2E tests | N/A | No CSS-layout-dependent ACs |
| H-NFR | NFRs declared for each active category | PASS | Security (escHtml, session ID server-side validation), Accessibility (WCAG 2.1 AA), Audit |
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
Story: Skill launcher landing — artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.23-skill-launcher-landing.md
Test plan: artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.23-skill-launcher-landing-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Runtime: Node.js v22, CommonJS (require), raw http.createServer — no Express
- Test runner: node tests/check-wuce23-skill-launcher-landing.js
- Create src/web-ui/routes/skills.js with:
  - handleGetSkillsHtml() — named export; returns HTML skill list via renderShell
  - POST handler for /api/skills/:name/sessions → creates session, 303 redirect to /skills/:name/sessions/:id
- ADR-009: handleGetSkillsHtml() must be a separate named export from any JSON handler
- ADR-012: listSkills(token) and createSession(skillName, token) via adapters — no inline fetch
- Import renderShell() from src/web-ui/utils/html-shell.js
- Import escHtml() from src/web-ui/utils/html-shell.js — apply to all skill names and descriptions
- Form structure required: <form method="POST" action="/api/skills/:name/sessions"> per skill; plain HTML — NO JavaScript required
- Non-2xx POST → renderShell HTML error page (not raw JSON)
- AC6: renderShell nav "Run a Skill" link points to /skills
- authGuard: unauthenticated → 302 on GET /skills and POST /api/skills/:name/sessions
- Audit log: { userId, route: '/skills', timestamp }
- Open a draft PR when all 16 tests pass — do not mark ready for review
- Oversight level: High — add PR comment confirming named sign-off from Hamish King
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment and do not mark ready for review
```

---

## Sign-off

**DoR status: Signed off**
**Date:** 2026-05-03
**Contract artefact:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.23-skill-launcher-landing-dor-contract.md
