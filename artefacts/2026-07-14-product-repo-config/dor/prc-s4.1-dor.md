# Definition of Ready: Edit a product's name, description, and repo association (prc-s4.1)

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s4.1.md
**Test plan reference:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s4.1-test-plan.md
**Contract:** artefacts/2026-07-14-product-repo-config/dor/prc-s4.1-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## Contract review

✅ **Contract review passed.**

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So format, named persona | ✅ | |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 3 ACs |
| H3 | Every AC has a test | ✅ | 3 integration tests |
| H4 | Out-of-scope populated | ✅ | Cross-tenant transfer |
| H5 | Benefit linkage names a metric | ✅ | Metric 2 |
| H6 | Complexity rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings | ✅ | Review run 1: 0/0/0 |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | `schemaDepends: ["dorStatus"]` — depends on prc-s1.2, prc-s2.1 |
| H9 | Architecture Constraints populated | ✅ | ADR-020; Category E 5/5 |
| H-E2E | CSS-layout-dependent gap | ✅ | N/A |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance sign-off | ✅ | N/A |
| H-NFR3 | Data classification populated | ✅ | Internal |
| H-NFR-profile | Profile presence | ✅ | |
| H-GOV | Governance approval | ✅ | |
| H-ADAPTER | D37 wiring check | N/A | Reuses `prc-s1.2`'s already-wired `repoAdapter` |
| H-INF | Infra-plan gate | N/A | |
| H-MIG | Migration-review gate | N/A | |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Acknowledged by |
|---|-------|--------|-----------------|
| W1, W2, W3, W5 | Pass cleanly | ✅ | N/A |
| W4 | Verification script reviewed | ⚠️→✅ | `decisions.md` W4 RISK-ACCEPT (all 14 stories) |

---

## Oversight level

**Medium** (per `epic-4-product-crud-and-isolation.md`).

---

## Standards injection

No `domain` field — skipped.

---

## READY / BLOCKED determination

## ✅ READY

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Edit a product's name, description, and repo association — artefacts/2026-07-14-product-repo-config/stories/prc-s4.1.md
Test plan: artefacts/2026-07-14-product-repo-config/test-plans/prc-s4.1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Reuse prc-s1.2's repoAdapter access-verification logic for repo-association
  changes -- do not reimplement.
- Adding a repo via edit must use the identical code path as first-time
  configuration -- not a second, parallel implementation that could drift.
- Depends on prc-s1.2 and prc-s2.1 being signed-off/merged first
  (schemaDepends: dorStatus).
- Architecture standards: read .github/architecture-guardrails.md (ADR-020).
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off required for Medium
**Signed off by:** Hamish King (Founder/Operator), 2026-07-14
