# Definition of Ready: Create a new GitHub repo directly from product creation (prc-s2.1)

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s2.1.md
**Test plan reference:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s2.1-test-plan.md
**Contract:** artefacts/2026-07-14-product-repo-config/dor/prc-s2.1-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## Contract review

✅ **Contract review passed.** Confirmed this story extends `prc-s1.2`'s already-wired `repoAdapter` rather than introducing a second D37 adapter — H-ADAPTER treated as N/A on that basis (see rationale below), not silently skipped.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So format, named persona | ✅ | "As a tenant admin configuring a new product..." |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has a test | ✅ | 4 integration tests |
| H4 | Out-of-scope populated | ✅ | Visibility settings, bootstrap content |
| H5 | Benefit linkage names a metric | ✅ | Metric 2 |
| H6 | Complexity rated | ✅ | Rating 2, Unstable |
| H7 | No unresolved HIGH findings | ✅ | Review run 1: 0 HIGH, 0 MEDIUM, 1 LOW |
| H8 | No uncovered ACs | ✅ | All 4 covered |
| H8-ext | Cross-story schema dependency | ✅ | `schemaDepends: ["dorStatus"]` — depends on prc-s1.1 |
| H9 | Architecture Constraints populated | ✅ | ADR-020 cited; Category E 4/5 (1-L1 LOW, shared with prc-s1.2) |
| H-E2E | CSS-layout-dependent gap | ✅ | N/A |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance sign-off | ✅ | N/A |
| H-NFR3 | Data classification populated | ✅ | Internal |
| H-NFR-profile | Profile presence | ✅ | |
| H-GOV | Governance approval | ✅ | |
| H-ADAPTER | D37 wiring check | N/A | Extends `prc-s1.2`'s already-wired `repoAdapter`, does not introduce a second adapter — confirmed by re-checking the story's Architecture Constraints (no D37/setX mention), consistent with the systematic grep done at `prc-s1.2`'s DoR |
| H-INF | Infra-plan gate | N/A | |
| H-MIG | Migration-review gate | N/A | |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Acknowledged by |
|---|-------|--------|-----------------|
| W1 | NFRs identified | ✅ | N/A |
| W2 | Scope stability declared | ✅ | N/A |
| W3 | MEDIUM findings acknowledged | ✅ | N/A — 0 MEDIUM |
| W4 | Verification script reviewed | ⚠️→✅ | `decisions.md` W4 RISK-ACCEPT (all 14 stories) |
| W5 | No unaddressed UNCERTAIN gaps | ✅ | N/A |

---

## Oversight level

**Medium** (per `epic-2-full-config-and-bootstrap.md`).

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
Story: Create a new GitHub repo directly from product creation — artefacts/2026-07-14-product-repo-config/stories/prc-s2.1.md
Test plan: artefacts/2026-07-14-product-repo-config/test-plans/prc-s2.1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Extend prc-s1.2's repoAdapter module with a createRepo method -- do not
  create a second, parallel adapter. Verify prc-s1.2's setRepoAdapter
  wiring already covers this method (it should, if the same adapter
  instance is extended) -- if implementation reveals it does not, treat
  that as a new finding and add a wiring AC before proceeding, per D37.
- Reuse prc-s1.2's exact "link your GitHub account" redirect for
  non-GitHub-auth sessions -- do not duplicate the prompt wording.
- repo_* columns must be fully populated before any bootstrap-step response
  is sent -- no partial-configuration window.
- Depends on prc-s1.1 being signed-off/merged first (schemaDepends: dorStatus).
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
