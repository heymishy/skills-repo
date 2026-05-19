# Definition of Ready: Multi-feature navigation and artefact browser

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.6 — Multi-feature navigation and artefact browser
**Epic:** E2 — Phase 1 Full Surface
**DoR run date:** 2026-05-02
**Reviewer:** Agent (automated check)

---

## Hard Blocks

| Block | Description | Status | Notes |
|-------|-------------|--------|-------|
| H1 | User story follows As/Want/So that format | PASS | "As a programme manager or business lead / I want to browse all features in a repository and navigate to any artefact / So that I can get a complete picture of the pipeline without asking an engineer…" |
| H2 | All ACs written in Given/When/Then with ≥3 ACs | PASS | 5 ACs, all in GWT format |
| H3 | Every AC has at least one test in the test plan | PASS | 19 tests in wuce.6 test plan; each AC covered |
| H4 | Out of scope section declared and non-trivial | PASS | Search/filtering, sorting, non-GitHub repos, editing, dependency graph explicitly excluded |
| H5 | Benefit linkage names a specific metric | PASS | P4 — Status self-service rate |
| H6 | Complexity rated and scope stability declared | PASS | Complexity 1 / Stable |
| H7 | No HIGH review findings open | PASS | reviewStatus: passed, highFindings: 0 |
| H8 | Every AC is traceable to at least one test | PASS | AC1–AC5 each have dedicated test cases in wuce.6 test plan |
| H8-ext | No unresolved schemaDepends declarations | N/A | No schema field dependencies declared |
| H9 | Architecture constraints populated and reference guardrails | PASS | ADR-012 (`listFeatures`, `listArtefacts` adapters), ADR-004, server-side repo access validation |
| H-E2E | CSS-layout-dependent ACs have E2E tests | N/A | No CSS-layout-dependent ACs |
| H-NFR | NFRs declared for each active category | PASS | Security (read access validation), Performance (<4s for 50 features), Accessibility (WCAG 2.1 AA), Audit |
| H-NFR2 | Compliance NFR with regulatory clause has human sign-off | N/A | No regulatory compliance clauses |
| H-NFR3 | Data classification not blank in NFR profile | PASS | NFR profile covers repository access validation for wuce.6 |
| H-NFR-profile | Feature-level NFR profile exists | PASS | artefacts/2026-05-02-web-ui-copilot-execution-layer/nfr-profile.md |
| H-GOV | Discovery approved by named non-engineering approver | PASS | Hamish King (Chief Product Guru) and Jenni Ralph (Chief Product Guru) — 2026-05-02 |

**Hard block result: ALL PASS — proceed to warnings.**

---

## Warnings

| Warning | Description | Status | Notes |
|---------|-------------|--------|-------|
| W1 | New pipeline-state.json fields require schema update first | N/A | No new pipeline-state.json fields |
| W2 | Scope stability is Unstable | N/A | Scope stability is Stable |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | No MEDIUM findings in wuce.6 review report |
| W4 | Verification script reviewed by domain expert | ⚠️ | Verification script exists; domain expert review not recorded — operator should confirm before dispatch |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Test plan gap table contains no UNCERTAIN items |

**Warnings: W4 acknowledged — proceed.**

---

## Oversight Level

**High** — inherited from Epic E2 (Phase 1 Full Surface). Human review required before PR merge.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Multi-feature navigation and artefact browser — artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.6-feature-navigation.md
Test plan: artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.6-feature-navigation-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Jest + Node.js (backend only); DOM-state tests using jsdom; no Playwright/Cypress
- Do not implement search, sorting, editing, or dependency graphs (out of scope)
- Plain-language labels required in browser-rendered content: "Ready Check" (not "dor"), "Benefit Metric" (not "benefit-metric") — internal identifiers must not appear as browser text
- Server-side repo access validation before serving any feature list
- Architecture standards: read `.github/architecture-guardrails.md` before implementing
- ADR-012: use `listFeatures(token)` and `listArtefacts(featureSlug, token)` adapters
- ADR-004: repository configuration from environment/context.yml
- Open a draft PR when tests pass — do not mark ready for review
- Oversight level: High — add a PR comment confirming plain-language label mapping
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review
```

---

## Sign-off

**DoR status: Signed off**
**Date:** 2026-05-02
**Contract artefact:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.6-feature-navigation-dor-contract.md
