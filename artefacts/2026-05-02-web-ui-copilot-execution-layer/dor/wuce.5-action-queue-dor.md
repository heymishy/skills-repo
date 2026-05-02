# Definition of Ready: Personalised action queue — pending sign-offs and annotation requests

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.5 — Personalised action queue — pending sign-offs and annotation requests
**Epic:** E2 — Phase 1 Full Surface
**DoR run date:** 2026-05-02
**Reviewer:** Agent (automated check)

---

## Hard Blocks

| Block | Description | Status | Notes |
|-------|-------------|--------|-------|
| H1 | User story follows As/Want/So that format | PASS | "As a business lead or SME reviewer / I want to see a personalised list of artefacts awaiting my sign-off or review / So that I never miss a pending governance action…" |
| H2 | All ACs written in Given/When/Then with ≥3 ACs | PASS | 5 ACs, all in GWT format |
| H3 | Every AC has at least one test in the test plan | PASS | 18 tests in wuce.5 test plan; each AC covered |
| H4 | Out of scope section declared and non-trivial | PASS | Push/email notifications, delegation, sorting/filtering, annotation-request items explicitly excluded |
| H5 | Benefit linkage names a specific metric | PASS | P5 — Sign-off wait time |
| H6 | Complexity rated and scope stability declared | PASS | Complexity 2 / Stable |
| H7 | No HIGH review findings open | PASS | reviewStatus: passed, highFindings: 0 |
| H8 | Every AC is traceable to at least one test | PASS | AC1–AC5 each have dedicated test cases in wuce.5 test plan |
| H8-ext | No unresolved schemaDepends declarations | N/A | No schema field dependencies declared — story explicitly states no new pipeline-state.json fields |
| H9 | Architecture constraints populated and reference guardrails | PASS | ADR-012 (`getPendingActions` adapter), server-side repo access validation, ADR-004 (repo list from context.yml/env) |
| H-E2E | CSS-layout-dependent ACs have E2E tests | N/A | No CSS-layout-dependent ACs |
| H-NFR | NFRs declared for each active category | PASS | Security (server-side repo access validation), Performance (<3s for 50 items), Accessibility (WCAG 2.1 AA), Audit |
| H-NFR2 | Compliance NFR with regulatory clause has human sign-off | N/A | No regulatory compliance clauses |
| H-NFR3 | Data classification not blank in NFR profile | PASS | NFR profile covers repository access validation for wuce.5 |
| H-NFR-profile | Feature-level NFR profile exists | PASS | artefacts/2026-05-02-web-ui-copilot-execution-layer/nfr-profile.md |
| H-GOV | Discovery approved by named non-engineering approver | PASS | Hamish King (Chief Product Guru) and Jenni Ralph (Chief Product Guru) — 2026-05-02 |

**Hard block result: ALL PASS — proceed to warnings.**

---

## Warnings

| Warning | Description | Status | Notes |
|---------|-------------|--------|-------|
| W1 | New pipeline-state.json fields require schema update first | N/A | Story explicitly prohibits new pipeline-state.json fields |
| W2 | Scope stability is Unstable | N/A | Scope stability is Stable |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | No MEDIUM findings in wuce.5 review report |
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
Story: Personalised action queue — pending sign-offs and annotation requests — artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.5-action-queue.md
Test plan: artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.5-action-queue-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Jest + Node.js (backend only); DOM-state tests using jsdom; no Playwright/Cypress
- Do not implement push/email notifications, delegation, sorting, or annotation-request items in queue (out of scope)
- Pending detection mechanism: absence of `## Approved by` section in artefact markdown — do NOT introduce new pipeline-state.json fields
- Server-side repository access validation: call GitHub API to verify read access before including any item in queue
- Repository list must come from `context.yml` or env var — not hardcoded
- Architecture standards: read `.github/architecture-guardrails.md` before implementing
- ADR-012: use `getPendingActions(userIdentity, token)` adapter — no inline GitHub API calls in route handler
- ADR-004: repository list from environment or context.yml
- Open a draft PR when tests pass — do not mark ready for review
- Oversight level: High — add a PR comment confirming server-side access validation logic
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review
```

---

## Sign-off

**DoR status: Signed off**
**Date:** 2026-05-02
**Contract artefact:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.5-action-queue-dor-contract.md
