# Definition of Ready: Per-user session isolation via COPILOT_HOME

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.10 — Per-user session isolation via COPILOT_HOME
**Epic:** E3 — Phase 2 Execution Engine
**DoR run date:** 2026-05-02
**Reviewer:** Agent (automated check)

---

## Hard Blocks

| Block | Description | Status | Notes |
|-------|-------------|--------|-------|
| H1 | User story follows As/Want/So that format | PASS | "As the execution engine / I want each user's CLI invocation to run in a dedicated COPILOT_HOME directory / So that concurrent sessions never share credentials, model context, or intermediate files…" |
| H2 | All ACs written in Given/When/Then with ≥3 ACs | PASS | 5 ACs, all in GWT format |
| H3 | Every AC has at least one test in the test plan | PASS | 17 tests in wuce.10 test plan; each AC covered |
| H4 | Out of scope section declared and non-trivial | PASS | Persistent model context, disk quota, cloud storage of session dirs explicitly excluded |
| H5 | Benefit linkage names a specific metric | PASS | P6 — Skill execution success rate |
| H6 | Complexity rated and scope stability declared | PASS | Complexity 2 / Stable |
| H7 | No HIGH review findings open | PASS | reviewStatus: passed, highFindings: 0 |
| H8 | Every AC is traceable to at least one test | PASS | AC1–AC5 each have dedicated test cases in wuce.10 test plan |
| H8-ext | No unresolved schemaDepends declarations | N/A | No schema field dependencies declared |
| H9 | Architecture constraints populated and reference guardrails | PASS | Path traversal mitigation (validate path starts with temp base dir), per-user sha256-derived subdir, cleanup validates path before deletion, startup cleanup of orphans, ADR-009 (session lifecycle = standalone module) |
| H-E2E | CSS-layout-dependent ACs have E2E tests | N/A | No CSS-layout-dependent ACs |
| H-NFR | NFRs declared for each active category | PASS | Security (path traversal mitigation, no session dir outside temp base), Performance (cleanup within 5s), Reliability (startup orphan cleanup), Audit |
| H-NFR2 | Compliance NFR with regulatory clause has human sign-off | N/A | No regulatory compliance clauses |
| H-NFR3 | Data classification not blank in NFR profile | PASS | NFR profile covers session isolation for wuce.10 |
| H-NFR-profile | Feature-level NFR profile exists | PASS | artefacts/2026-05-02-web-ui-copilot-execution-layer/nfr-profile.md |
| H-GOV | Discovery approved by named non-engineering approver | PASS | Hamish King (Chief Product Guru) and Jenni Ralph (Chief Product Guru) — 2026-05-02 |

**Hard block result: ALL PASS — proceed to warnings.**

---

## Warnings

| Warning | Description | Status | Notes |
|---------|-------------|--------|-------|
| W1 | New pipeline-state.json fields require schema update first | N/A | No new pipeline-state.json fields |
| W2 | Scope stability is Unstable | N/A | Scope stability is Stable |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | No MEDIUM findings in wuce.10 review report |
| W4 | Verification script reviewed by domain expert | ⚠️ | Verification script exists; domain expert review not recorded — operator should confirm before dispatch |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Test plan gap table contains no UNCERTAIN items |

**Warnings: W4 acknowledged — proceed.**

---

## Oversight Level

**High** — inherited from Epic E3 (Phase 2 Execution Engine). Human review required before PR merge.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Per-user session isolation via COPILOT_HOME — artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.10-session-isolation.md
Test plan: artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.10-session-isolation-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Jest + Node.js (backend only); no Playwright/Cypress
- `createSession(userId)` path structure: `/tmp/copilot-sessions/<sha256(userId)>/<uuid>/` — exactly this structure
- Concurrent users must get distinct paths — use a UUID per session, not just userId hash alone
- `cleanupSession(sessionPath)` MUST validate that sessionPath starts with the configured temp base dir before deleting — no arbitrary path deletion
- Startup orphan cleanup: on server start, delete all COPILOT_HOME dirs under the temp base older than 24h
- ADR-009: session lifecycle management is a standalone module — not inline in route handlers or skill-executor
- Architecture standards: read `.github/architecture-guardrails.md` before implementing
- Do not implement persistent model context, disk quota enforcement, or cloud storage for session dirs (out of scope)
- Open a draft PR when tests pass — do not mark ready for review
- Oversight level: High — add a PR comment confirming path traversal mitigation in cleanupSession
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review
```

---

## Sign-off

**DoR status: Signed off**
**Date:** 2026-05-02
**Contract artefact:** artefacts/2026-05-02-web-ui-copilot-execution-layer/dor/wuce.10-session-isolation-dor-contract.md
