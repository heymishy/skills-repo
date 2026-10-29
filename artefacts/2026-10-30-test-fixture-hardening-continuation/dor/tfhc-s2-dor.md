## Definition of Ready: Migrate a bounded batch of hand-rolled journey.js test files to the shared fixture

**Story reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s2-journey-js-fixture-retrofit-batch.md
**Test plan reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s2-journey-js-fixture-retrofit-batch-test-plan.md
**Review artefact:** artefacts/2026-10-30-test-fixture-hardening-continuation/review/tfhc-s2-review-1.md
**Contract Proposal:** artefacts/2026-10-30-test-fixture-hardening-continuation/dor/tfhc-s2-dor-contract.md
**Assessed by:** Copilot
**Date:** 2026-10-30

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format with named persona | ✅ | Persona: "developer/engineer debugging or extending journey.js's existing test coverage" |
| H2 | At least 3 ACs in Given/When/Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | All 4 ACs covered |
| H4 | Out-of-scope section populated | ✅ | Names 2 exclusions |
| H5 | Benefit linkage references a named metric | ✅ | "journey.js fixture duplication, continued (m2)" |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | Review Run 1: 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block names upstream `tsir-s1`; contract declares `schemaDepends: ["dorStatus"]`, confirmed present in `pipeline-state.schema.json` |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | "None identified" — accurate for a test-only migration, no production code path |
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
| W3 | MEDIUM review findings acknowledged | ✅ | — | — (0 MEDIUM) |
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
Story: Migrate a bounded batch of hand-rolled journey.js test files to the shared fixture — artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s2-journey-js-fixture-retrofit-batch.md
Test plan: artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s2-journey-js-fixture-retrofit-batch-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Plain Node.js (CommonJS), matches tests/check-*.js convention.
- Files in scope: 3-5 files chosen from the 16 currently flagged by `node scripts/check-journey-fixture-usage.js` against every journey.js-touching test file under tests/. Do not modify tests/helpers/journey-fixture.js.
- Depends on tsir-s1 and tsir-s3 already being merged (both confirmed present on disk).
- Preserve each migrated file's existing test intent exactly — migration only, not a test-quality pass.
- Capture a pre-migration baseline (full suite pass/fail counts, and the 16-file flagged count) before editing any file.
- Architecture standards: .github/standards/testing/test-design-patterns.md injected below.
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
