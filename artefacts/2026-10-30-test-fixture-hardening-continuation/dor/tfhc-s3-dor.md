## Definition of Ready: Extract a shared mockReq/mockRes fixture module for skills.js tests

**Story reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s3-skills-js-fixture-walking-skeleton.md
**Test plan reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s3-skills-js-fixture-walking-skeleton-test-plan.md
**Review artefact:** artefacts/2026-10-30-test-fixture-hardening-continuation/review/tfhc-s3-review-1.md
**Contract Proposal:** artefacts/2026-10-30-test-fixture-hardening-continuation/dor/tfhc-s3-dor-contract.md
**Assessed by:** Copilot
**Date:** 2026-10-30

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs. The contract explicitly surfaces the `skills/review/SKILL.md` PR-governance requirement rather than treating it as a routine same-commit edit, mirroring `tsir-s3`'s own precedent.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format with named persona | ✅ | Persona: "developer/engineer debugging or extending skills.js's existing test coverage" |
| H2 | At least 3 ACs in Given/When/Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | All 5 ACs covered |
| H4 | Out-of-scope section populated | ✅ | Names 2 exclusions |
| H5 | Benefit linkage references a named metric | ✅ | "skills.js fixture duplication (m3)" |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Review Run 1: 0 HIGH, 0 MEDIUM, 1 LOW (retrospective note only) |
| H8 | Test plan has no uncovered ACs | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency check | ✅ N/A | Dependencies block states "None" — no upstream story referenced |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | References `product/constraints.md` #13 and CLAUDE.md's Platform change policy |
| H-E2E | CSS-layout-dependent AC without E2E tooling | ✅ N/A | No AC is CSS-layout-dependent |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-30-test-fixture-hardening-continuation/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFRs |
| H-NFR3 | Data classification not blank | ✅ | Public |
| H-GOV | Discovery Approved By populated | ✅ | Hamish King — Platform Owner — 2026-10-30 |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No `setX()` adapter introduced |
| H-INF / H-MIG / H-DESIGN | Track-specific gates | ✅ N/A | All three track flags absent |

**All hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ | — | — (0 MEDIUM; the 1 LOW finding is a retrospective-only note, not a blocking acknowledgement) |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases before coding begins | **RISK-ACCEPT logged in `decisions.md`, 2026-10-30 — covers tfhc-s1/s2/s3/s4 as one entry** |
| W5 | No UNCERTAIN items left in gap table | ✅ | — | — (gap table: None) |

---

## Oversight level

**Oversight:** Medium (from parent epic `fixture-divergence-closure`)

---

## Standards injection

Domain tags: `[testing]`
Matched standards files: `.github/standards/testing/test-design-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Extract a shared mockReq/mockRes fixture module for skills.js tests — artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s3-skills-js-fixture-walking-skeleton.md
Test plan: artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s3-skills-js-fixture-walking-skeleton-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Plain Node.js (CommonJS), matches scripts/check-design-tokens.js's / scripts/check-journey-fixture-usage.js's exported-function-plus-CLI-wrapper shape.
- Files in scope: tests/helpers/skills-fixture.js (new), tests/check-skills-fixture-self-test.js (new), scripts/check-skills-fixture-usage.js (new), tests/fixtures/tfhc-s3-hand-rolled-mockreq.js (new), tests/fixtures/tfhc-s3-shared-fixture-usage.js (new), tests/check-dic1-story-cards.js (modified), skills/review/SKILL.md (modified).
- The skills/review/SKILL.md edit is a platform-infrastructure change per CLAUDE.md's "Platform change policy (Phase 2+)" — it must go through this story's own feature-branch PR with the same review bar as any other SKILL.md change (this is the standard inner-loop path already; do not attempt a direct-to-master bookkeeping-style commit for this specific file).
- The new skills/review/SKILL.md section must be its own named category ("Category G: skills.js fixture hygiene"), not folded into Category F's existing journey.js-specific prose.
- Independently re-derive skills.js's real req.session field list via grep — do not copy-paste trust journey.js's own fixture field list.
- Out of scope: migrating the other 11 hand-rolled skills.js files; promoting this check to a /definition-of-ready hard block.
- Architecture standards: product/constraints.md #13 and CLAUDE.md's Platform change policy — both already reflected in the story's Architecture Constraints field. .github/standards/testing/test-design-patterns.md injected below.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review.

## Applicable standards

### .github/standards/testing/test-design-patterns.md (domain: testing)
[Full text injected at DoR time.]

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only
**Signed off by:** Not required (Medium oversight)
