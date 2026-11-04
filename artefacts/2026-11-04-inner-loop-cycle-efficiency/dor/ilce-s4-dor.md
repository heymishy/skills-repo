# Definition of Ready: /workflow reconciles merged-but-no-DoD stories against live GitHub, not just pipeline-state.json

**Story reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/stories/ilce-s4-dod-handoff-reconciliation.md
**Test plan reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/test-plans/ilce-s4-test-plan.md
**Contract proposal:** artefacts/2026-11-04-inner-loop-cycle-efficiency/dor/ilce-s4-dor-contract.md
**Assessed by:** Copilot
**Date:** 2026-11-04

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs, directly implementing ADR-030's specified mechanism.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | Operator running the inner loop |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | 7 tests covering 5 ACs |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage references named metric | ✅ | Metric 3 |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | 0 HIGH, 0 MEDIUM — Run 1 |
| H8 | No uncovered ACs | ✅ | None |
| H8-ext | Cross-story schema dependency | ✅ N/A | Dependencies: "None" |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Cites ADR-030 by name with its specific requirement |
| H-E2E | Layout-dependent AC gap | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | Same feature-level profile |
| H-NFR2 | Compliance sign-off | ✅ N/A | No compliance NFRs |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Profile exists |
| H-GOV | Discovery Approved By | ✅ | Shared discovery artefact — confirmed pass |
| H-ADAPTER | Injectable adapter wiring | ✅ N/A | None introduced |
| H-INF / H-MIG / H-DESIGN | Track-specific gates | ✅ N/A | No tracks set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ N/A | No MEDIUM findings (only 1 LOW) | — |
| W4 | Verification script reviewed by domain expert | ✅ | — | Reviewed by Hamish King, 2026-11-04 |
| W5 | No UNCERTAIN gap items | ✅ | — | One LOW noted (pagination lacks AC anchor), not UNCERTAIN/blocking |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: /workflow reconciles merged-but-no-DoD stories against live GitHub, not just pipeline-state.json — artefacts/2026-11-04-inner-loop-cycle-efficiency/stories/ilce-s4-dod-handoff-reconciliation.md
Test plan: artefacts/2026-11-04-inner-loop-cycle-efficiency/test-plans/ilce-s4-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js CommonJS only — per product/tech-stack.md runtime constraints
- Must implement ADR-030's specific mechanism: cross-reference `gh pr list --state merged` against each story's prUrl, not just read pipeline-state.json's own fields
- Must degrade gracefully (explicit warning, not a hard failure) when `gh` is unavailable or unauthenticated
- Do not build a new scheduled CI job — this runs inside /workflow at session-time only
- Do not retroactively resolve the 22 existing merged-but-no-DoD stories — this story implements the detection mechanism only
- Architecture standards: read `.github/architecture-guardrails.md` before implementing.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech lead awareness (no formal sign-off) — solo repo
**Signed off by:** Hamish King, 2026-11-04
