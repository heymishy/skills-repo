# Definition of Ready: Render aggregate test coverage on the product rollup view (pr-s5)

**Story reference:** artefacts/2026-07-16-product-rollup/stories/pr-s5.md
**Test plan reference:** artefacts/2026-07-16-product-rollup/test-plans/pr-s5-test-plan.md
**Contract:** artefacts/2026-07-16-product-rollup/dor/pr-s5-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-17

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As/Want/So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given/When/Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 7 tests across 4 ACs, no gaps |
| H4 | Out-of-scope section is populated | ✅ | Trend over time, per-test detail both correctly deferred |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 1 |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review run 1: 0 HIGH, 1 MEDIUM + 1 LOW (both fixed same-session) |
| H8 | Test plan has no uncovered ACs | ✅ | All 4 ACs covered, no gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block lists upstream pr-s2. `schemaDepends: []` — reads pr-s2's cache table directly, not any pipeline-state.json field. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Discovery [ASSUMPTION] on calc method, ADR-018 cited; Category E score 3/5 in review, no HIGH |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ | No CSS-layout-dependent ACs — N/A |
| H-NFR | NFR profile exists or story has `NFRs: None` | ✅ | `nfr-profile.md` exists |
| H-NFR2 | Compliance NFR with named regulatory clause has human sign-off | ✅ | No compliance NFRs apply |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | NFR profile presence check | ✅ | Story declares NFRs; profile exists |
| H-GOV | Governance approval check | ✅ | Discovery `## Approved By`: non-blank, not engineer-only |
| H-ADAPTER | Injectable adapter wiring check (D37) | N/A | No new injectable adapter introduced by this story |
| H-INF | Infra-plan gate check | N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate check | N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | N/A — populated |
| W2 | Scope stability declared | ✅ | — | N/A — "Stable" |
| W3 | MEDIUM review findings acknowledged | ✅ | — | N/A — findings 5-M1, 5-L1 were fixed, not just acknowledged |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | Accepted — see `decisions.md`, RISK-ACCEPT entry covering all 7 stories, 2026-07-17 |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | — | Test plan flags the calc-method [ASSUMPTION] explicitly with a stated mitigation (update tests if `/clarify` changes it) — not left as an unaddressed "UNCERTAIN" tag |

---

## Oversight level

**High** (per `pr-e2-dimensions.md`) — solo-operator posture. Named sign-off required.

---

## Standards injection

Story has no `domain` field — skipped silently.

---

## READY / BLOCKED determination

## ✅ READY — all hard blocks pass, all warnings resolved or explicitly acknowledged.

Note: the discovery-level [ASSUMPTION] about blended-vs-average calculation method remains open pending `/clarify`. This does not block DoR (per discovery's own `/clarify` recommendation, which states neither remaining assumption blocks `/benefit-metric` or, by the same reasoning, implementation) — but the coding agent must implement exactly the blended method as currently specified in the ACs and tests, and this story would need re-verification if `/clarify` changes the method later.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Render aggregate test coverage on the product rollup view — artefacts/2026-07-16-product-rollup/stories/pr-s5.md
Test plan: artefacts/2026-07-16-product-rollup/test-plans/pr-s5-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Compute aggregate test coverage as sum-of-passing over sum-of-total
  across features (blended), NOT an average of per-feature percentages —
  this is discovery's own stated method, still pending final /clarify
  confirmation. If this method changes before you start, the story and
  test plan will be updated first.
- Features with no testPlan data must be excluded from both numerator and
  denominator — never treated as 0%.
- Per-feature detail must be available alongside the single blended number.
- Do not build trend-over-time or per-test detail — both explicitly out
  of scope for this story.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: High
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Yes
**Signed off by:** Hamish King — Founder/Operator — 2026-07-17
