## Definition of Ready: Add a structural /review check flagging hand-rolled mockReq on journey.js-touching test files

**Story reference:** artefacts/2026-10-29-test-suite-infra-refactor/stories/tsir-s3-structural-review-check-fixture-usage.md
**Test plan reference:** artefacts/2026-10-29-test-suite-infra-refactor/test-plans/tsir-s3-structural-review-check-fixture-usage-test-plan.md
**Contract Proposal:** artefacts/2026-10-29-test-suite-infra-refactor/dor/tsir-s3-dor-contract.md
**Assessed by:** Copilot
**Date:** 2026-10-29

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs. The contract explicitly surfaces the `skills/review/SKILL.md` PR-governance requirement (added to Architecture Constraints at Review Run 2) rather than treating it as a routine same-commit edit.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format with named persona | ✅ | Persona: "developer/engineer (or AI coding agent) running the inner loop" |
| H2 | At least 3 ACs in Given/When/Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | All 4 ACs covered, including the mutation-test AC4 fully automated (unlike tsir-s2's AC2) |
| H4 | Out-of-scope section populated | ✅ | Names 2 exclusions |
| H5 | Benefit linkage references a named metric | ✅ | "Adoption" |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Review Run 2: 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block names upstream `tsir-s1`; contract declares `schemaDepends: ["dorStatus"]`, confirmed present in schema |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | References `product/constraints.md` #13 and CLAUDE.md's Platform change policy (added at Review Run 2) |
| H-E2E | CSS-layout-dependent AC without E2E tooling | ✅ N/A | No AC is CSS-layout-dependent |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-29-test-suite-infra-refactor/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFRs |
| H-NFR3 | Data classification not blank | ✅ | Public |
| H-GOV | Discovery Approved By populated | ✅ | Hamish King — Platform Owner — 2026-10-29 |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No `setX()` adapter introduced |
| H-INF / H-MIG / H-DESIGN | Track-specific gates | ✅ N/A | All three track flags absent |

**All hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ | — | — (Run 2: 0 MEDIUM remaining) |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases before coding begins | **Pending — same cross-story warning as tsir-s1/s2** |
| W5 | No UNCERTAIN items left in gap table | ✅ | — | — (gap table: None) |

---

## Oversight level

**Oversight:** Medium (from parent epic)

---

## Standards injection

Domain tags: `[testing]`
Matched standards files: `.github/standards/testing/test-design-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Add a structural /review check flagging hand-rolled mockReq on journey.js-touching test files — artefacts/2026-10-29-test-suite-infra-refactor/stories/tsir-s3-structural-review-check-fixture-usage.md
Test plan: artefacts/2026-10-29-test-suite-infra-refactor/test-plans/tsir-s3-structural-review-check-fixture-usage-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Plain Node.js (CommonJS), matches scripts/check-design-tokens.js's exported-function-plus-CLI-wrapper shape.
- Files in scope: scripts/check-journey-fixture-usage.js (new), tests/fixtures/tsir-s3-hand-rolled-mockreq.js (new), tests/fixtures/tsir-s3-shared-fixture-usage.js (new), tests/check-tsir-s3-journey-fixture-usage-check.js (new), skills/review/SKILL.md (modified).
- Depends on tsir-s1 being merged first (Walking Skeleton sequencing).
- The skills/review/SKILL.md edit is a platform-infrastructure change per CLAUDE.md's "Platform change policy (Phase 2+)" — it must go through this story's own feature-branch PR with the same review bar as any other SKILL.md change (this is the standard inner-loop path already; do not attempt a direct-to-master bookkeeping-style commit for this specific file).
- Out of scope: promoting this check to a /definition-of-ready hard block; extending it to skills.js/products.js/journeys.js.
- Architecture standards: product/constraints.md #13 and CLAUDE.md's Platform change policy — both already reflected in the story's Architecture Constraints field.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review.

## Applicable standards

### .github/standards/testing/test-design-patterns.md (domain: testing)
[Full text injected at DoR time. AC4 IS this file's "Mutation-test a fix's own new test before trusting it" rule, applied to the check script itself — fully automatable here (unlike tsir-s2's AC2) since the mutation is a test-fixture-file edit, not a production-module edit.]

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only
**Signed off by:** Not required (Medium oversight)
