# Definition of Ready: /branch-complete skips the redundant full-suite rerun when a fresh result exists

**Story reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/stories/ilce-s2-branch-complete-freshness-guard.md
**Test plan reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/test-plans/ilce-s2-test-plan.md
**Contract proposal:** artefacts/2026-11-04-inner-loop-cycle-efficiency/dor/ilce-s2-dor-contract.md
**Assessed by:** Copilot
**Date:** 2026-11-04

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs. (The `fullSuite` field this story's AC3 relies on was added to `ilce-s1`'s contract at this same DoR run — see `ilce-s1-dor-contract.md` and the `decisions.md` SCOPE entry.)

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | Operator running the inner loop |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 6 tests covering 4 ACs |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage references named metric | ✅ | Metric 2 |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | 0 HIGH, 0 MEDIUM — Run 2 (1-M1 resolved) |
| H8 | No uncovered ACs | ✅ | None |
| H8-ext | Cross-story schema dependency | ✅ | `schemaDepends: []` declared in contract — dependency is on `pipeline-timings.jsonl`'s `fullSuite` field, not a `pipeline-state.schema.json` field; no schema field to validate against |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | "None identified beyond general platform change policy" — checked |
| H-E2E | Layout-dependent AC gap | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | Same feature-level profile |
| H-NFR2 | Compliance sign-off | ✅ N/A | No compliance NFRs |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Profile exists |
| H-GOV | Discovery Approved By | ✅ | Same shared discovery artefact — confirmed pass |
| H-ADAPTER | Injectable adapter wiring | ✅ N/A | None introduced |
| H-INF / H-MIG / H-DESIGN | Track-specific gates | ✅ N/A | No tracks set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | 1-M1 resolved via AC revision at Run 2 review — no outstanding MEDIUM to acknowledge | — |
| W4 | Verification script reviewed by domain expert | ✅ | — | Reviewed by Hamish King, 2026-11-04 |
| W5 | No UNCERTAIN gap items | ✅ | — | "No gaps identified" |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: /branch-complete skips the redundant full-suite rerun when a fresh result exists — artefacts/2026-11-04-inner-loop-cycle-efficiency/stories/ilce-s2-branch-complete-freshness-guard.md
Test plan: artefacts/2026-11-04-inner-loop-cycle-efficiency/test-plans/ilce-s2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js CommonJS only — per product/tech-stack.md runtime constraints
- Must build on ilce-s1's appendTimingRecord/reader API, including its fullSuite field — do not invent a parallel mechanism
- Do not modify /verify-completion's own freshness-check logic — read its output only
- No cross-session caching — freshness is scoped to commit-state and run-scope only
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
