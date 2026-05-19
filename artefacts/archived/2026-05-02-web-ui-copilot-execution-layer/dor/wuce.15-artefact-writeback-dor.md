# Definition of Ready: Artefact write-back with attribution

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.15 — Artefact write-back with attribution
**Epic:** E4 — Phase 2 Guided UI
**DoR run date:** 2026-05-02
**Reviewer:** Agent (automated check)

---

## Hard Blocks

| Block | Description | Status | Notes |
|-------|-------------|--------|-------|
| H1 | User story follows As/Want/So that format | PASS | "As a non-technical pipeline operator / I want the completed skill artefact committed to the repository under my identity / So that the artefact has a clear human author on record…" |
| H2 | All ACs written in Given/When/Then with ≥3 ACs | PASS | 5 ACs, all in GWT format |
| H3 | Every AC has at least one test in the test plan | PASS | 18 tests in wuce.15 test plan; each AC covered |
| H4 | Out of scope section declared and non-trivial | PASS | Artefact editing post-commit, versioned artefact history view, batch commits explicitly excluded |
| H5 | Benefit linkage names a specific metric | PASS | P7 — Non-technical operator skill execution rate |
| H6 | Complexity rated and scope stability declared | PASS | Complexity 2 / Stable |
| H7 | No HIGH review findings open | PASS | reviewStatus: passed, highFindings: 0 |
| H8 | Every AC is traceable to at least one test | PASS | AC1–AC5 each have dedicated test cases in wuce.15 test plan |
| H8-ext | No unresolved schemaDepends declarations | N/A | No schema field dependencies declared |
| H9 | Architecture constraints populated and reference guardrails | PASS | Decisions log 2026-05-02 ARCH phase-1 (OAuth token via GitHub Contents API), ADR-012 (`commitArtefact` adapter — reused from wuce.3), ADR-009 (execute and commit are separate routes), server-side path validation |
| H-E2E | CSS-layout-dependent ACs have E2E tests | N/A | No CSS-layout-dependent ACs |
| H-NFR | NFRs declared for each active category | PASS | Security (server-side path validation, committer = authenticated user), Performance (<5s commit), Accessibility (success message accessible), Audit (commit SHA returned) |
| H-NFR2 | Compliance NFR with regulatory clause has human sign-off | N/A | No regulatory compliance clauses |
| H-NFR3 | Data classification not blank in NFR profile | PASS | NFR profile covers committer identity and server-side path validation for wuce.15 |
| H-NFR-profile | Feature-level NFR profile exists | PASS | artefacts/2026-05-02-web-ui-copilot-execution-layer/nfr-profile.md |
| H-GOV | Discovery approved by named non-engineering approver | PASS | Hamish King (Chief Product Guru) and Jenni Ralph (Chief Product Guru) — 2026-05-02 |

**Hard block result: ALL PASS — proceed to warnings.**

---

## Warnings

| Warning | Description | Status | Notes |
|---------|-------------|--------|-------|
| W1 | New pipeline-state.json fields require schema update first | N/A | No new pipeline-state.json fields |
| W2 | Scope stability is Unstable | N/A | Scope stability is Stable |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | No MEDIUM findings in wuce.15 review report |
| W4 | Verification script reviewed by domain expert | ⚠️ | Verification script exists; domain expert review not recorded — operator should confirm before dispatch |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Test plan gap table contains no UNCERTAIN items |

**Warnings: W4 acknowledged — proceed.**

---

## Oversight Level

**High** — inherited from Epic E4 (Phase 2 Guided UI). Human review required before PR merge.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Artefact write-back with attribution — artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.15-artefact-writeback.md
Test plan: artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.15-artefact-writeback-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Jest + Node.js (backend only); no Playwright/Cypress
- Do not implement post-commit editing, version history view, or batch commits (out of scope)
- Commit path: `artefacts/<feature-slug>/<artefact-type>.md` — validated server-side; paths outside `artefacts/` → HTTP 400 (AC3)
- Git author AND committer = authenticated user (name + email from GitHub user identity endpoint) — same constraint as wuce.3 (AC2)
- Reuse `commitArtefact(artefactPath, content, commitMessage, token)` adapter from wuce.3 — do not create a parallel commit function (ADR-012)
- execute route and commit route are separate API routes — do not combine in one handler (ADR-009)
- 409 conflict from Contents API → return "Artefact already exists — reload and review" message to user; do not overwrite silently (AC4)
- On success: return repository link + commit SHA to display to user (AC5)
- Architecture standards: read `.github/architecture-guardrails.md` before implementing
- Architecture decision: Phase 1 and Phase 2 write-back uses authenticated user's OAuth token via GitHub Contents API (decisions.md 2026-05-02 ARCH phase-1)
- Open a draft PR when tests pass — do not mark ready for review
- Oversight level: High — add a PR comment confirming: (1) path validation rejects outside artefacts/, (2) author + committer = authenticated user, (3) commitArtefact adapter reused from wuce.3
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review
```

---

## Sign-off

**DoR status: Signed off**
**Date:** 2026-05-02
**Contract artefact:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.15-artefact-writeback-dor-contract.md
