# Definition of Ready: Render aggregate health on the product rollup view (pr-s4)

**Story reference:** artefacts/2026-07-16-product-rollup/stories/pr-s4.md
**Test plan reference:** artefacts/2026-07-16-product-rollup/test-plans/pr-s4-test-plan.md
**Contract:** artefacts/2026-07-16-product-rollup/dor/pr-s4-dor-contract.md
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
| H3 | Every AC has at least one test in the test plan | ✅ | 9 tests across 4 ACs, no gaps |
| H4 | Out-of-scope section is populated | ✅ | Weighted score, drill-down both correctly deferred |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 1 |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review run 1: 0 HIGH, 1 MEDIUM + 1 LOW (both fixed same-session) |
| H8 | Test plan has no uncovered ACs | ✅ | All 4 ACs covered, no gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block lists upstream pr-s2. `schemaDepends: []` — reads pr-s2's cache table directly, not any pipeline-state.json field. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | `fleetHealthLabel`/`featureActionMeta` convention, accessibility constraint, ADR-018 all cited; Category E score 3/5 in review, no HIGH |
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
| W3 | MEDIUM review findings acknowledged | ✅ | — | N/A — findings 4-M1, 4-L1 were fixed, not just acknowledged |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | Accepted — see `decisions.md`, RISK-ACCEPT entry covering all 7 stories, 2026-07-17 |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | — | N/A — no gaps |

---

## Oversight level

**High** (per `pr-e2-dimensions.md`) — solo-operator posture. Named sign-off required.

---

## Standards injection

Story has no `domain` field — skipped silently.

---

## READY / BLOCKED determination

## ✅ READY — all hard blocks pass, all warnings resolved or explicitly acknowledged.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Render aggregate health on the product rollup view — artefacts/2026-07-16-product-rollup/stories/pr-s4.md
Test plan: artefacts/2026-07-16-product-rollup/test-plans/pr-s4-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Reuse the existing status label convention from .github/scripts/viz-functions.js's
  fleetHealthLabel (✓ Healthy / ⚠ Warning / ✕ Blocked / ? Unknown) for
  visual consistency — do not import from that file (it belongs to the
  legacy dashboard), reimplement the same labels as new application code.
- Derive the overall signal using the same red-takes-precedence rule as
  viz-functions.js's featureActionMeta (any red -> red; else any amber ->
  amber; else green).
- Health status must never be conveyed by colour alone — a text label or
  icon is required alongside any colour coding (accessibility constraint).
- Do not build a weighted/percentage health score or per-feature drill-down
  — both explicitly out of scope for this story.
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
