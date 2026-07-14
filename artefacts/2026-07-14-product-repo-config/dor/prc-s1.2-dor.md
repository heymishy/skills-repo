# Definition of Ready: Connect an existing GitHub repo to a product (prc-s1.2)

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s1.2.md
**Test plan reference:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s1.2-test-plan.md
**Contract:** artefacts/2026-07-14-product-repo-config/dor/prc-s1.2-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## ⚠️ Read this first

This DoR run found and fixed a real gap: the story's Architecture Constraints named a D37 injectable adapter, but the original 4 ACs had no explicit wiring AC. AC5 was added, the test plan updated with 2 new tests, and the gap logged in `decisions.md` before this checklist was evaluated. H-ADAPTER below reflects the corrected story.

---

## Contract review

✅ **Contract review passed** — proposed implementation (including the added AC5 wiring test) aligns with all 5 ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As/Want/So format with a named persona | ✅ | "As a tenant admin configuring a new product..." |
| H2 | At least 3 ACs in Given/When/Then format | ✅ | 5 ACs (AC1-AC5), all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC5 now has 2 tests, added this run |
| H4 | Out-of-scope section is populated | ✅ | Create-new-repo, bootstrap, non-GitHub providers |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 2 |
| H6 | Complexity is rated | ✅ | Rating 2, Unstable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review run 1: 0 HIGH, 0 MEDIUM, 2 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | All 5 ACs covered, no gaps |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: ["dorStatus"]` declared — prc-s1.1 must be signed-off before this story is assigned. Field confirmed present in `pipeline-state.schema.json`. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-020, ADR-012 cited; Category E score 4/5 in review (1-L1, vague route citation — LOW, not blocking) |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ | No CSS-layout-dependent ACs — N/A |
| H-NFR | NFR profile exists or story has `NFRs: None` | ✅ | `nfr-profile.md` exists |
| H-NFR2 | Compliance NFR with named regulatory clause has human sign-off | ✅ | No compliance NFRs apply |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | NFR profile presence check | ✅ | Story declares NFRs; profile exists |
| H-GOV | Governance approval check | ✅ | Discovery `## Approved By` populated |
| H-ADAPTER | Injectable adapter wiring check (D37) | ✅ | **Fixed this run** — AC5 now explicitly scopes wiring; stub-throws behaviour and behavioural-correctness (2 distinct sessions → 2 distinct results) both required by AC5's own wording, not just "a function got wired" |
| H-INF | Infra-plan gate check | N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate check | N/A | `hasMigrationTrack` not set |

**All hard blocks pass** (after this run's fix).

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | N/A |
| W2 | Scope stability declared | ✅ | — | N/A — "Unstable" |
| W3 | MEDIUM review findings acknowledged | ✅ | — | N/A — 0 MEDIUM findings |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | Accepted — see `decisions.md` W4 RISK-ACCEPT, 2026-07-14 |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | — | N/A — no gaps |

---

## Oversight level

**Medium** (per `epic-1-walking-skeleton.md`).

---

## Standards injection

Story has no `domain` field — skipped silently.

---

## READY / BLOCKED determination

## ✅ READY — all hard blocks pass (H-ADAPTER fixed this run), all warnings resolved or acknowledged.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Connect an existing GitHub repo to a product — artefacts/2026-07-14-product-repo-config/stories/prc-s1.2.md
Test plan: artefacts/2026-07-14-product-repo-config/test-plans/prc-s1.2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- D37 adapter: setRepoAdapter/getRepoAdapter. Stub default MUST throw
  ("Adapter not wired: repoAdapter. Call setRepoAdapter() with a real
  implementation before use.") -- never a silent safe-looking return.
- Wiring must happen in server.js as its own separate task, distinct from
  building the handler -- do not conflate the two tasks in implementation
  planning.
- The wiring test MUST prove two different sessions resolve to two
  different, individually-correct access results -- not just that
  setRepoAdapter was called.
- Never store the OAuth token itself against the product record.
- Reuse the existing GET /settings/link-account/github/start route for the
  non-GitHub-auth redirect -- do not build a new account-linking mechanism.
- Depends on prc-s1.1 being signed-off/merged first (schemaDepends: dorStatus).
- Architecture standards: read .github/architecture-guardrails.md before
  implementing (ADR-020, ADR-012).
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off required for Medium — tech lead awareness only
**Signed off by:** Hamish King (Founder/Operator), 2026-07-14
