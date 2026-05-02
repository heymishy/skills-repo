# Definition of Ready: Skill launcher and guided question flow

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.13 — Skill launcher and guided question flow
**Epic:** E4 — Phase 2 Guided UI
**DoR run date:** 2026-05-02
**Reviewer:** Agent (automated check)

---

## Hard Blocks

| Block | Description | Status | Notes |
|-------|-------------|--------|-------|
| H1 | User story follows As/Want/So that format | PASS | "As a non-technical pipeline operator / I want to select and launch a pipeline skill through a guided question-by-question interface / So that I can execute skills without knowing CLI syntax…" |
| H2 | All ACs written in Given/When/Then with ≥3 ACs | PASS | 5 ACs, all in GWT format |
| H3 | Every AC has at least one test in the test plan | PASS | 22 tests in wuce.13 test plan; each AC covered |
| H4 | Out of scope section declared and non-trivial | PASS | Bulk skill execution, skill authoring, PDF/DOCX rendering, full ACP multi-turn, sharing skill sessions explicitly excluded |
| H5 | Benefit linkage names a specific metric | PASS | P7 — Non-technical operator skill execution rate |
| H6 | Complexity rated and scope stability declared | PASS | Complexity 3 / UNSTABLE |
| H7 | No HIGH review findings open | PASS | reviewStatus: passed (review-2 confirmed 13-H1 resolved), highFindings: 0 |
| H8 | Every AC is traceable to at least one test | PASS | AC1–AC5 each have dedicated test cases in wuce.13 test plan |
| H8-ext | No unresolved schemaDepends declarations | N/A | No schema field dependencies declared |
| H9 | Architecture constraints populated and reference guardrails | PASS | Server-side skill name allowlist validation (wuce.11), server-side prompt sanitisation, length limits server-side, `SkillContentAdapter` scoped to this story, ADR-009 |
| H-E2E | CSS-layout-dependent ACs have E2E tests | N/A | No CSS-layout-dependent ACs |
| H-NFR | NFRs declared for each active category | PASS | Security (prompt injection prevention, server-side sanitisation, allowlist), Performance (<2s question load), Accessibility (WCAG 2.1 AA), Audit |
| H-NFR2 | Compliance NFR with regulatory clause has human sign-off | N/A | No regulatory compliance clauses |
| H-NFR3 | Data classification not blank in NFR profile | PASS | NFR profile covers prompt injection prevention and sanitisation for wuce.13 |
| H-NFR-profile | Feature-level NFR profile exists | PASS | artefacts/2026-05-02-web-ui-copilot-execution-layer/nfr-profile.md |
| H-GOV | Discovery approved by named non-engineering approver | PASS | Hamish King (Chief Product Guru) and Jenni Ralph (Chief Product Guru) — 2026-05-02 |

**Hard block result: ALL PASS — proceed to warnings.**

---

## Warnings

| Warning | Description | Status | Notes |
|---------|-------------|--------|-------|
| W1 | New pipeline-state.json fields require schema update first | N/A | No new pipeline-state.json fields |
| W2 | Scope stability is Unstable | ⚠️ | Complexity 3 / UNSTABLE — ACP preview caveat; primary path is `-p` subprocess flag. Operator acknowledges instability risk. |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | No MEDIUM findings in wuce.13 review report (13-H1 was HIGH, resolved in review-2) |
| W4 | Verification script reviewed by domain expert | ⚠️ | Verification script exists; domain expert review not recorded — operator should confirm before dispatch |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Test plan gap table contains no UNCERTAIN items |

**Warnings: W2 (Unstable scope — ACP preview caveat, acknowledged) and W4 acknowledged — proceed.**

---

## Oversight Level

**High** — inherited from Epic E4 (Phase 2 Guided UI). Human review required before PR merge.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Skill launcher and guided question flow — artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.13-skill-launcher.md
Test plan: artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.13-skill-launcher-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

ACP preview caveat: The primary skill execution path uses the Copilot CLI `-p` flag (subprocess, wuce.9). Full ACP multi-turn is not implemented in this story. Reinstate/remove this caveat when ACP reaches GA.

Constraints:
- Jest + Node.js (backend only); DOM-state tests using jsdom; no Playwright/Cypress
- Do not implement bulk skill execution, skill authoring, PDF/DOCX rendering, or sharing skill sessions (out of scope)
- Skill list at `/skills` is derived exclusively from `listAvailableSkills` (wuce.11) — no hardcoded skill names
- Server-side skill name allowlist validation: validate selected skill against wuce.11 allowlist before any execution
- Server-side prompt input sanitisation: strip shell metacharacters from all answers before constructing CLI prompt (AC4)
- Answer length limit: ≤1000 characters, enforced server-side (not only client-side) (AC3)
- `SkillContentAdapter`: scoped to this story (not shared with other stories); parses SKILL.md for question blocks; isolate in `src/adapters/skill-content-adapter.js`
- "No Copilot licence" detection (AC5): detect non-200 response from CLI or specific error code → return clear message, disable launcher; do not expose raw error to browser
- Architecture standards: read `.github/architecture-guardrails.md` before implementing
- ADR-009: question parsing and skill execution are separate responsibilities — do not combine in a single route handler
- Open a draft PR when tests pass — do not mark ready for review
- Oversight level: High — add a PR comment confirming: (1) skill name allowlist validated before execution, (2) server-side prompt sanitisation, (3) ACP caveat noted
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review
```

---

## Sign-off

**DoR status: Signed off**
**Date:** 2026-05-02
**Contract artefact:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.13-skill-launcher-dor-contract.md
