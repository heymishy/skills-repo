# Definition of Ready: /subagent-execution runs spec-compliance and code-quality review in parallel, with symmetric discard-and-re-dispatch on either reviewer's fix

**Story reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/stories/ilce-s3-parallel-review-dispatch.md
**Test plan reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/test-plans/ilce-s3-test-plan.md
**Contract proposal:** artefacts/2026-11-04-inner-loop-cycle-efficiency/dor/ilce-s3-dor-contract.md
**Assessed by:** Copilot
**Date:** 2026-11-04

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs, including the symmetric discard-and-re-dispatch mechanism added at Run 2 review.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | Operator running the inner loop |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | 7 tests covering 5 ACs |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage references named metric | ✅ | Metric 1 |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | 0 HIGH, 0 MEDIUM — Run 2 (1-M1 resolved) |
| H8 | No uncovered ACs | ✅ | None |
| H8-ext | Cross-story schema dependency | ✅ | `schemaDepends: []` declared — Epic 1 dependency is a measurement dependency on `pipeline-timings.jsonl`, not a `pipeline-state.schema.json` field |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Cites `decisions.md` ASSUMPTION/symmetric-fix entries + platform change policy |
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
| W1 | NFRs identified | ✅ | "None — confirmed" (no NFR tests; tracked via benefit-metric instead) | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | 1-M1 resolved via symmetric AC revision at Run 2 — no outstanding MEDIUM | — |
| W4 | Verification script reviewed by domain expert | ✅ | — | Reviewed by Hamish King, 2026-11-04 |
| W5 | No UNCERTAIN gap items | ✅ | — | AC5's outcome tracked via benefit-metric, not a test-plan gap |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: /subagent-execution runs spec-compliance and code-quality review in parallel, with symmetric discard-and-re-dispatch on either reviewer's fix — artefacts/2026-11-04-inner-loop-cycle-efficiency/stories/ilce-s3-parallel-review-dispatch.md
Test plan: artefacts/2026-11-04-inner-loop-cycle-efficiency/test-plans/ilce-s3-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js CommonJS only — per product/tech-stack.md runtime constraints
- Extract the review-outcome decision logic into a pure, unit-testable function — do not leave it as inline unstructured dispatch logic (mirrors fhff-s2's isDeployGroupEviction pattern)
- The discard-and-re-dispatch mechanism must be symmetric — either reviewer's fix invalidates the other's pre-fix result, not just spec-compliance's
- Do not change what either reviewer evaluates or its pass/fail bar
- Do not scale review depth by Complexity Rating — already rejected with evidence this session
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
