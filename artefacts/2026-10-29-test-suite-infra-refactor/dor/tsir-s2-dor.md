## Definition of Ready: Add a dedicated self-test for the shared journey.js fixture module

**Story reference:** artefacts/2026-10-29-test-suite-infra-refactor/stories/tsir-s2-fixture-module-self-test.md
**Test plan reference:** artefacts/2026-10-29-test-suite-infra-refactor/test-plans/tsir-s2-fixture-module-self-test-test-plan.md
**Contract Proposal:** artefacts/2026-10-29-test-suite-infra-refactor/dor/tsir-s2-dor-contract.md
**Assessed by:** Copilot
**Date:** 2026-10-29

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs, including AC2's explicitly-manual verification approach (documented as a gap in the test plan, not silently dropped).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format with named persona | ✅ | Persona: "platform maintainer who owns the long-term health of this repo's test infrastructure" |
| H2 | At least 3 ACs in Given/When/Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC2 covered by a documented manual gap, not silently uncovered |
| H4 | Out-of-scope section populated | ✅ | Names 2 exclusions |
| H5 | Benefit linkage references a named metric | ✅ | "Divergence-bug incidence" |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | Review Run 1: 0 HIGH, 0 MEDIUM, 0 LOW (clean on first pass) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | AC2 gap explicitly acknowledged with documented rationale and handling (manual scenario) |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block names upstream `tsir-s1`; contract declares `schemaDepends: ["dorStatus"]`; `dorStatus` confirmed present in `pipeline-state.schema.json` |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | References `.github/standards/testing/test-design-patterns.md`'s mutation-test rule |
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
| W3 | MEDIUM review findings acknowledged | ✅ | — | — (0 MEDIUM) |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases before coding begins | **Pending — see tsir-s1's equivalent warning; same resolution applies across all 3 stories** |
| W5 | No UNCERTAIN items left in gap table | ✅ | — | AC2's gap has a documented handling decision, not left uncertain |

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
Story: Add a dedicated self-test for the shared journey.js fixture module — artefacts/2026-10-29-test-suite-infra-refactor/stories/tsir-s2-fixture-module-self-test.md
Test plan: artefacts/2026-10-29-test-suite-infra-refactor/test-plans/tsir-s2-fixture-module-self-test-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Plain Node.js (CommonJS), matches tests/check-*.js convention.
- Files in scope: tests/check-journey-fixture-self-test.js (new) only. Do not modify tests/helpers/journey-fixture.js.
- Depends on tsir-s1 being merged first (Walking Skeleton sequencing — do not start before it is).
- AC2 requires a ONE-TIME manual verification step (not a committed test): temporarily change journey-fixture.js's default tenantId to '', run the self-test, confirm it fails, then git checkout -- the file to restore it exactly, and re-run to confirm passing again before committing anything. Record this verification as done in the PR description — do not commit the temporary change.
- Architecture standards: .github/standards/testing/test-design-patterns.md injected below — this AC2 discipline IS that standard's own "mutation-test a fix's own new test" rule, applied to a self-test rather than a bug-fix test.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review.

## Applicable standards

### .github/standards/testing/test-design-patterns.md (domain: testing)
[Full text injected at DoR time. Directly applicable this time (unlike tsir-s1): AC2's manual mutation-test step is a direct instance of this file's "Mutation-test a fix's own new test before trusting it" rule.]

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only
**Signed off by:** Not required (Medium oversight)
