# Definition of Ready: Attributed sign-off on pipeline artefacts

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.3 — Attributed sign-off on pipeline artefacts
**Epic:** E1 — Walking Skeleton
**DoR run date:** 2026-05-02
**Reviewer:** Agent (automated check)

---

## Hard Blocks

| Block | Description | Status | Notes |
|-------|-------------|--------|-------|
| H1 | User story follows As/Want/So that format | PASS | "As a business lead or product owner / I want to sign off on a pipeline artefact directly from the web UI / So that my approval is recorded in the repository under my identity…" |
| H2 | All ACs written in Given/When/Then with ≥3 ACs | PASS | 6 ACs, all in GWT format |
| H3 | Every AC has at least one test in the test plan | PASS | 17 tests in wuce.3 test plan; each AC covered |
| H4 | Out of scope section declared and non-trivial | PASS | Multi-approver workflows, rejection action, other artefact types, pipeline-state updates explicitly excluded |
| H5 | Benefit linkage names a specific metric | PASS | P1 — Non-engineer self-service sign-off rate |
| H6 | Complexity rated and scope stability declared | PASS | Complexity 2 / Stable |
| H7 | No HIGH review findings open | PASS | reviewStatus: passed, highFindings: 0 |
| H8 | Every AC is traceable to at least one test | PASS | AC1–AC6 each have dedicated test cases in wuce.3 test plan |
| H8-ext | No unresolved schemaDepends declarations | N/A | No schema field dependencies declared in this story |
| H9 | Architecture constraints populated and reference guardrails | PASS | ADR-009 (separate handler), ADR-012 (`commitSignOff` adapter), committer = authenticated user, server-side path validation, ADR-003 |
| H-E2E | CSS-layout-dependent ACs have E2E tests | N/A | No CSS-layout-dependent ACs |
| H-NFR | NFRs declared for each active category | PASS | Security (server-side validation, rate limit 10/user/min), Performance (<5s), Accessibility (WCAG 2.1 AA modal), Audit |
| H-NFR2 | Compliance NFR with regulatory clause has human sign-off | N/A | No regulatory compliance clauses |
| H-NFR3 | Data classification not blank in NFR profile | PASS | NFR profile covers committer identity cross-cutting requirement for wuce.3 |
| H-NFR-profile | Feature-level NFR profile exists | PASS | artefacts/2026-05-02-web-ui-copilot-execution-layer/nfr-profile.md |
| H-GOV | Discovery approved by named non-engineering approver | PASS | Hamish King (Chief Product Guru) and Jenni Ralph (Chief Product Guru) — 2026-05-02 |

**Hard block result: ALL PASS — proceed to warnings.**

---

## Warnings

| Warning | Description | Status | Notes |
|---------|-------------|--------|-------|
| W1 | New pipeline-state.json fields require schema update first | N/A | This story introduces no new pipeline-state.json fields |
| W2 | Scope stability is Unstable | N/A | Scope stability is Stable |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | No MEDIUM findings in wuce.3 review report |
| W4 | Verification script reviewed by domain expert | ⚠️ | Verification script exists; domain expert review not recorded — operator should confirm before dispatch |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Test plan gap table contains no UNCERTAIN items |

**Warnings: W4 acknowledged — proceed.**

---

## Oversight Level

**High** — inherited from Epic E1 (Walking Skeleton). Human review required before PR merge.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Attributed sign-off on pipeline artefacts — artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.3-attributed-signoff.md
Test plan: artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.3-attributed-signoff-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Jest + Node.js (backend only); DOM-state tests using jsdom; no Playwright/Cypress
- Do not implement multi-approver workflows, rejection actions, or pipeline-state.json updates (out of scope)
- The committer identity must be the authenticated user — never a service account; use the user's OAuth token from the session cookie
- Server-side path validation is mandatory before any Contents API call — reject paths with traversal sequences (AC4)
- Rate limit: 10 sign-off requests per user per minute (enforce server-side)
- Architecture standards: read `.github/architecture-guardrails.md` before implementing. Do not introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs.
- ADR-009: sign-off handler is separate from read and auth handlers
- ADR-012: use `commitSignOff(artefactPath, approverName, token)` adapter — no inline GitHub API calls in route handler
- ADR-003: no new pipeline-state.json fields
- Open a draft PR when tests pass — do not mark ready for review
- Oversight level: High — add a PR comment confirming path traversal mitigation and committer identity enforcement
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review
```

---

## Sign-off

**DoR status: Signed off**
**Date:** 2026-05-02
**Contract artefact:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.3-attributed-signoff-dor-contract.md
